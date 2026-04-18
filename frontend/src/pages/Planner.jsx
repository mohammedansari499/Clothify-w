import { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  Calendar as CalendarIcon,
  CheckCircle2,
  CloudRain,
  Loader2,
  MapPin,
  RefreshCw,
  Save,
  Sparkles,
  Sun,
  Thermometer,
} from 'lucide-react';
import api from '../utils/axios';
import AddToCollectionModal from '../components/AddToCollectionModal';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const OCCASIONS = ['Casual', 'Work', 'Party', 'Formal', 'Gym', 'Date', 'Traditional'];
const POPULAR_CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 'London', 'New York', 'Tokyo', 'Paris', 'Dubai', 'Singapore'];

const DAY_COLORS = {
  Monday: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  Tuesday: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
  Wednesday: 'from-pink-500/20 to-pink-600/5 border-pink-500/20',
  Thursday: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
  Friday: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  Saturday: 'from-indigo-500/20 to-indigo-600/5 border-indigo-500/20',
  Sunday: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
};

const DAY_ACCENTS = {
  Monday: 'text-blue-400',
  Tuesday: 'text-violet-400',
  Wednesday: 'text-emerald-400',
  Thursday: 'text-amber-400',
  Friday: 'text-rose-400',
  Saturday: 'text-cyan-400',
  Sunday: 'text-orange-400',
};

/* ------------------ UPGRADED SCORE BADGE (MEMOIZED) ------------------ */
const ScoreBadge = memo(function ScoreBadge({ score = 0, isSuggested = false }) {
  let color = '';
  let glow = '';

  if (score >= 80) {
    color = 'text-green-400 border-green-400/30 bg-green-400/10';
    glow = 'shadow-[0_0_12px_rgba(0,255,150,0.25)]';
  } else if (score >= 60) {
    color = 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
  } else if (score >= 40) {
    color = 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  } else {
    color = 'text-neutral-500 border-border-subtle bg-card';
  }

  return (
    <div className="flex flex-col items-end">
      <motion.span
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full border ${color} ${glow} flex items-center gap-1.5 transition-all duration-300`}
      >
        {isSuggested && <Sparkles className="w-3 h-3 text-primary animate-pulse" />}
        {score}%
      </motion.span>
    </div>
  );
});

/* ------------------ UPGRADED OUTFIT SLOT (MEMOIZED + SMOOTH ZOOM) ------------------ */
const OutfitSlot = memo(function OutfitSlot({ item, label }) {
  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center gap-3 p-3 bg-card backdrop-blur-md rounded-2xl border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item min-h-[80px]"
    >
      <div className="w-16 h-16 bg-card rounded-xl overflow-hidden shrink-0 p-1">
        <img
          src={item.image_url}
          alt={item.type || label}
          className="w-full h-full object-contain transition-transform duration-500 ease-[0.22,1,0.36,1] group-hover/item:scale-110"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5 whitespace-nowrap overflow-hidden">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest shrink-0 truncate">{label}</span>
          {(item.wear_count || 0) > 0 && (
            <span className="text-[9px] text-primary/60 font-medium truncate">worn {item.wear_count}x</span>
          )}
        </div>
        <div className="capitalize text-sm font-semibold text-text truncate group-hover/item:text-primary transition-colors">
          {item.type?.replace('_', ' ') || 'Item'}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {item.colors?.slice(0, 3).map((c, i) => (
            <div
              key={`${label}-${i}`}
              className="w-3.5 h-3.5 rounded-full border border-border-subtle shadow-sm"
              style={{ backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})` }}
            />
          ))}
          {item.color_name && <span className="text-[10px] text-text-muted font-medium ml-1 truncate">{item.color_name}</span>}
        </div>
      </div>
    </motion.div>
  );
});

/* ------------------ MAIN PLANNER COMPONENT ------------------ */
export default function Planner() {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSavedPlan, setIsSavedPlan] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState(localStorage.getItem('city') || 'Hyderabad');
  const [weather, setWeather] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [occasions, setOccasions] = useState({
    Monday: 'Work', Tuesday: 'Casual', Wednesday: 'Casual', Thursday: 'Casual',
    Friday: 'Party', Saturday: 'Casual', Sunday: 'Casual',
  });

  const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const savedRes = await api.get('/outfits/plan/saved');
      if (savedRes.data.plan) {
        setPlan(savedRes.data.plan);
        setIsSavedPlan(true);
        if (savedRes.data.city) setCity(savedRes.data.city);
        if (savedRes.data.occasions) setOccasions(savedRes.data.occasions);
        const weatherRes = await api.get('/weather/', { params: { city: savedRes.data.city || city } });
        setWeather(weatherRes.data);
      } else {
        const generated = await api.post('/outfits/plan', { city, occasions });
        setPlan(generated.data.plan || []);
        setWeather(generated.data.weather_context || null);
        setIsSavedPlan(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load weekly plan.');
    } finally {
      setLoading(false);
    }
  }, [city, occasions]);

  const fetchCalendarEvents = useCallback(async () => {
    try {
      const res = await api.get('/calendar/events');
      setCalendarEvents(res.data.events || []);
      setIsCalendarConnected(true);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 404) {
        setIsCalendarConnected(false);
      }
      setCalendarEvents([]);
    }
  }, []);

  useEffect(() => {
    const savedOccasions = localStorage.getItem('planner_occasions');
    if (savedOccasions) {
      try {
        const parsed = JSON.parse(savedOccasions);
        setOccasions((prev) => ({ ...prev, ...parsed }));
      } catch {
        localStorage.removeItem('planner_occasions');
      }
    }
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    setIsSavedPlan(false);
    localStorage.setItem('planner_occasions', JSON.stringify(occasions));
    try {
      const res = await api.post('/outfits/plan', { city, occasions });
      setPlan(res.data.plan || []);
      setWeather(res.data.weather_context || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate new plan.');
    } finally {
      setLoading(false);
    }
  }, [city, occasions]);

  const handleSavePlan = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/outfits/plan/save', { plan, city, occasions });
      setIsSavedPlan(true);
    } catch {
      setError('Failed to save the plan.');
    } finally {
      setSaving(false);
    }
  }, [plan, city, occasions]);

  const updateOccasion = useCallback(async (day, value) => {
    const nextOccasions = { ...occasions, [day]: value };
    setOccasions(nextOccasions);
    localStorage.setItem('planner_occasions', JSON.stringify(nextOccasions));
    setError('');
    try {
      const res = await api.post('/outfits/plan/day', { day, occasion: value, city });
      const newOutfit = res.data.day_plan || res.data.outfit;
      setPlan((prev) => prev.map((p) => (p.day === day ? newOutfit : p)));
      setIsSavedPlan(false);
    } catch (err) {
      setError('Failed to update outfit for ' + day);
    }
  }, [city, occasions]);

  const handleRegenerateDay = useCallback(async (day) => {
    setError('');
    const currentDayPlan = plan.find((p) => p.day === day);
    const excludeIds = [];
    if (currentDayPlan) {
      ['top', 'bottom', 'shoes', 'outerwear'].forEach((slot) => {
        const item = currentDayPlan[slot];
        if (item?._id || item?.id) excludeIds.push(item._id || item.id);
      });
    }
    try {
      const res = await api.post('/outfits/plan/day', { day, occasion: occasions[day], exclude_ids: excludeIds, city });
      const newOutfit = res.data.day_plan || res.data.outfit;
      setPlan((prev) => prev.map((p) => (p.day === day ? newOutfit : p)));
      setIsSavedPlan(false);
    } catch (err) {
      setError('Failed to regenerate outfit.');
    }
  }, [city, occasions, plan]);

  const adoptStyle = useCallback(async (day, occasion) => {
    await updateOccasion(day, occasion);
    const element = document.getElementById(`day-card-${day}`);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [updateOccasion]);

  const handleSaveToCollection = useCallback((dayPlan) => {
    setSelectedOutfit(dayPlan);
    setIsModalOpen(true);
  }, []);

  const handleMarkAsWorn = useCallback(async (dayPlan) => {
    try {
      setPlan((prev) =>
        prev.map((p) => {
          if (p.day !== dayPlan.day) return p;
          const updateItem = (item) => (item ? { ...item, wear_count: (item.wear_count || 0) + 1 } : item);
          return {
            ...p, isWorn: true, top: updateItem(p.top), bottom: updateItem(p.bottom),
            shoes: updateItem(p.shoes), outerwear: updateItem(p.outerwear),
            accessories: Array.isArray(p.accessories) ? p.accessories.map(updateItem) : p.accessories,
          };
        }),
      );
      await api.post('/outfits/wear', { outfit: dayPlan });
    } catch (err) {
      setError('Failed to mark as worn.');
    }
  }, []);

  const connectCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const userId = localStorage.getItem('user_id');
      const baseApi = api.defaults.baseURL || `${window.location.origin}/api`;
      window.open(`${baseApi.replace(/\/$/, '')}/calendar/connect?user_id=${userId}`, '_blank');
    } catch {
      setError('Failed to start calendar connection.');
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  return (
    <div className="pt-24 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 bg-background min-h-screen text-text">
      <div className="relative mt-6 mb-12 p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent border border-border-subtle backdrop-blur-sm">
        <div className="absolute top-0 right-0 p-8 opacity-20 hidden lg:block">
          <CalendarIcon className="w-32 h-32 text-primary" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/30">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-text">Smart Planner</h1>
              <p className="text-text-muted mt-1 max-w-xl">
                Set your city and occasions, then generate weekly outfits from your wardrobe.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-4 mt-8">
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted ml-1">Location Context</label>
              <div className="relative group">
                <select
                  value={city}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCity(value);
                    localStorage.setItem('city', value);
                  }}
                  className="w-full pl-10 pr-10 py-3 bg-card border border-border-subtle text-text rounded-2xl focus:outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer hover:bg-primary/10 font-medium"
                >
                  {POPULAR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-primary" />
              </div>
            </div>

            <button
              onClick={connectCalendar}
              disabled={calendarLoading}
              className={`px-5 py-3 font-bold rounded-2xl transition-all disabled:opacity-60 flex items-center gap-2 ${isCalendarConnected
                ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10'
                : 'bg-emerald-500/90 text-black hover:bg-emerald-400'
                }`}
            >
              {calendarLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              {isCalendarConnected ? 'Calendar Synced' : 'Connect Calendar'}
            </button>

            <button
              onClick={handleGenerate}
              disabled={loading || saving}
              className="px-6 py-3 bg-card border border-border-subtle text-text font-bold rounded-2xl hover:bg-primary/10 hover:border-primary/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 text-primary" />}
              {loading ? 'Analyzing...' : 'Generate New Plan'}
            </button>

            {plan.length > 0 && !isSavedPlan && (
              <button
                onClick={handleSavePlan}
                disabled={saving || loading}
                className="px-6 py-3 bg-primary text-darker font-black rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving...' : 'Save Weekly Plan'}
              </button>
            )}

            {isSavedPlan && (
              <div className="flex items-center gap-2 px-4 py-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Saved Plan
              </div>
            )}
          </div>

          {weather && !loading && (
            <div className="mt-6 flex flex-wrap items-center gap-6 p-4 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase">Temperature</div>
                  <div className="text-lg font-bold text-text">{weather.temp_c}C</div>
                </div>
              </div>
              <div className="w-px h-8 bg-border-subtle hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${weather.is_raining ? 'bg-blue-400/10' : 'bg-yellow-400/10'} flex items-center justify-center`}>
                  {weather.is_raining ? <CloudRain className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
                </div>
                <div>
                  <div className="text-[10px] font-bold text-text-muted uppercase">Outlook</div>
                  <div className="text-lg font-bold text-text capitalize">{weather.condition}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isCalendarConnected && calendarEvents.length > 0 && (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-text">Calendar Insights</h2>
            <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
              {calendarEvents.length} Events Found
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {calendarEvents.map((event, idx) => (
              <div
                key={event.id || idx}
                className="flex-shrink-0 w-[280px] p-4 rounded-2xl bg-card border border-border-subtle hover:border-primary/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <Sparkles className="w-12 h-12 text-primary" />
                </div>

                <div className="flex items-center justify-between mb-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  <span>{event.day}</span>
                  <span className="text-primary/70">{event.start_time}</span>
                </div>

                <h3 className="font-bold text-text truncate mb-1 group-hover:text-primary transition-colors">
                  {event.summary}
                </h3>

                <p className="text-xs text-text-muted mb-4 line-clamp-1 italic">
                  Suggested: <span className="text-text font-semibold">{event.suggested_occasion}</span>
                </p>

                <button
                  onClick={() => adoptStyle(event.day, event.suggested_occasion)}
                  className="w-full py-2 bg-primary/10 hover:bg-primary text-primary hover:text-darker text-[11px] font-black uppercase tracking-widest rounded-xl border border-primary/20 hover:border-primary transition-all flex items-center justify-center gap-2"
                >
                  Adopt Style
                  <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="p-5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl mb-8 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6">
          <Loader2 className="w-20 h-20 text-primary animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-text tracking-tight">Curating your week</p>
            <p className="text-text-muted">Matching color palettes and weather conditions...</p>
          </div>
        </div>
      ) : plan.length === 0 ? (
        <div className="text-center py-32 rounded-3xl border border-border-subtle bg-card backdrop-blur-sm">
          <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border-subtle">
            <Sparkles className="w-10 h-10 text-text-muted/50" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-text">Your wardrobe is empty</h3>
          <p className="text-text-muted max-w-sm mx-auto">
            Upload a few items first and then come back to generate your weekly outfits.
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {DAYS.map((day) => {
            const dayPlan = plan.find((p) => p.day === day);
            if (!dayPlan) return null;

            const isToday = dayPlan.day === today;
            const dayColor = DAY_COLORS[dayPlan.day] || DAY_COLORS.Monday;
            const dayAccent = DAY_ACCENTS[dayPlan.day] || DAY_ACCENTS.Monday;

            return (
              <motion.div
                key={dayPlan.day}
                id={`day-card-${dayPlan.day}`}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1 }
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                layout
                className={`group relative rounded-[2.5rem] border overflow-hidden bg-gradient-to-b ${dayColor} ${isToday ? 'ring-2 ring-primary/40 shadow-2xl shadow-primary/10' : ''} transition-shadow duration-500 hover:shadow-2xl`}
              >
                {/* --- 1. HEADER & SCORE BADGE COMPACTED --- */}
                <div className="px-6 pt-6 pb-4 flex flex-col gap-3 relative z-10">
                  {/* Top Row: Name + Score */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-2xl tracking-tight ${isToday ? 'text-primary' : dayAccent}`}>{dayPlan.day}</span>
                      {isToday && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-darker bg-primary px-2.5 py-1 rounded-lg">
                          Today
                        </span>
                      )}
                    </div>
                    {/* Score sits here now! */}
                    <ScoreBadge score={dayPlan.confidenceScore || dayPlan.score} isSuggested={dayPlan.isSuggested} />
                  </div>

                  {/* Bottom Row: Buttons */}
                  <div className="flex items-center gap-2">
                    <select
                      value={occasions[dayPlan.day] || 'Casual'}
                      onChange={(e) => updateOccasion(dayPlan.day, e.target.value)}
                      className="text-[11px] font-bold uppercase tracking-widest bg-card border border-border-subtle text-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer"
                    >
                      {OCCASIONS.map((oc) => (
                        <option key={oc} value={oc} className="bg-card text-text">{oc}</option>
                      ))}
                    </select>

                    <button onClick={() => handleRegenerateDay(dayPlan.day)} className="p-1.5 bg-card border border-border-subtle hover:bg-primary/10 rounded-lg hover:border-primary/30 text-text-muted hover:text-primary transition-all">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button onClick={() => handleMarkAsWorn(dayPlan)} disabled={dayPlan.isWorn} className={`p-1.5 border rounded-lg transition-all flex items-center justify-center ${dayPlan.isWorn ? 'bg-primary border-primary text-darker' : 'bg-card border-border-subtle text-text-muted hover:bg-green-500/20 hover:border-green-500/30 hover:text-green-400'}`}>
                      {dayPlan.isWorn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                    </button>

                    <button onClick={() => handleSaveToCollection(dayPlan)} className="p-1.5 bg-card border border-border-subtle hover:bg-primary/10 rounded-lg  hover:border-primary/30 text-text-muted hover:text-primary transition-all">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* --- 2. CONTENT AREA --- */}
                {/* Notice 'pb-8' to give room for the info icon at the bottom */}
                <div className="px-5 pb-8 space-y-3 relative z-10">
                  <OutfitSlot item={dayPlan.top} label="Top" />
                  <OutfitSlot item={dayPlan.bottom} label="Bottom" />

                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    {/* Changed 'Footwear' to 'Shoes' to stop the truncation conflict! */}
                    <OutfitSlot item={dayPlan.shoes} label="Shoes" />
                    <OutfitSlot item={dayPlan.outerwear} label="Outerwear" />
                  </div>

                  {Array.isArray(dayPlan.accessories) && dayPlan.accessories.length > 0 && (
                    <div className="p-3 bg-card backdrop-blur-md rounded-2xl border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Accessories</span>
                        <span className="text-[9px] text-primary/60 font-medium">{dayPlan.accessories.length} items</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dayPlan.accessories.map((acc, i) => (
                          <div key={`${dayPlan.day}-acc-${i}`} className="flex items-center gap-2 p-1.5 bg-card rounded-xl border border-border-subtle hover:border-primary/20 transition-all" title={acc.type}>
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-darker/50 p-0.5">
                              <img src={acc.image_url} alt={acc.type} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[11px] font-semibold text-text/80 max-w-[100px] truncate capitalize">
                              {acc.type?.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* --- 3. THE ⓘ TOOLTIP POPUP --- */}
                {dayPlan.explanation && (
                  <div className="absolute bottom-4 right-4 z-30 group/info">
                    {/* The Trigger Icon */}
                    <div className="cursor-help w-6 h-6 flex items-center justify-center rounded-full bg-card border border-border-subtle text-text-muted hover:text-primary hover:border-primary/50 transition-all shadow-lg backdrop-blur-sm">
                      <span className="text-[10px] font-serif italic font-bold">i</span>
                    </div>

                    {/* The Hidden Popup Box */}
                    <div className="invisible opacity-0 group-hover/info:visible group-hover/info:opacity-100 absolute bottom-full right-0 mb-3 w-[260px] p-4 bg-darker/95 backdrop-blur-xl border border-primary/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 transform scale-95 group-hover/info:scale-100 origin-bottom-right">
                      <div className="flex gap-3">
                        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed text-text font-medium italic">
                          "{dayPlan.explanation}"
                        </p>
                      </div>
                      {/* Little Arrow Pointing down to the i */}
                      <div className="absolute top-full right-2 w-3 h-3 bg-darker/95 border-r border-b border-primary/20 rotate-45 -translate-y-1.5" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AddToCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        outfit={selectedOutfit}
        onAdd={fetchPlan}
      />
    </div>
  );
}
