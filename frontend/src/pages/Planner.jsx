import { useCallback, useEffect, useMemo, useState } from 'react';
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
const POPULAR_CITIES = [
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Surat',
  'Pune',
  'Jaipur',
  'London',
  'New York',
  'Tokyo',
  'Paris',
  'Dubai',
  'Singapore',
];

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

function ScoreBadge({ score = 0 }) {
  const level = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Mix';
  const color =
    score >= 70
      ? 'text-green-400 bg-green-400/10 border-green-400/20'
      : score >= 50
        ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
        : score >= 30
          ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
          : 'text-gray-400 bg-gray-400/10 border-gray-400/20';

  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${color}`}>
      {level} ({score})
    </span>
  );
}

function OutfitSlot({ item, label }) {
  if (!item) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-card backdrop-blur-md rounded-2xl border border-border-subtle hover:border-primary/30 transition-all duration-300 group/item">
      <div className="w-16 h-16 bg-white/5 rounded-xl overflow-hidden shrink-0 p-1 group-hover/item:scale-105 transition-transform">
        <img src={item.image_url} alt={item.type || label} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{label}</span>
          {(item.wear_count || 0) > 0 && <span className="text-[9px] text-primary/60 font-medium">worn {item.wear_count}x</span>}
        </div>
        <div className="capitalize text-sm font-semibold text-text truncate group-hover/item:text-primary transition-colors">
          {item.type?.replace('_', ' ') || 'Item'}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {item.colors?.slice(0, 3).map((c, i) => (
            <div
              key={`${label}-${i}`}
              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})` }}
            />
          ))}
          {item.color_name && <span className="text-[10px] text-text-muted font-medium ml-1">{item.color_name}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Planner() {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSavedPlan, setIsSavedPlan] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [weather, setWeather] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [occasions, setOccasions] = useState({
    Monday: 'Work',
    Tuesday: 'Casual',
    Wednesday: 'Casual',
    Thursday: 'Casual',
    Friday: 'Party',
    Saturday: 'Casual',
    Sunday: 'Casual',
  });

  const today = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    [],
  );

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const savedRes = await api.get('/outfits/plan/saved');
      if (savedRes.data.plan) {
        setPlan(savedRes.data.plan);
        setIsSavedPlan(true);
        const weatherRes = await api.get('/weather/', { params: { city } });
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
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  const handleGenerateNew = useCallback(async () => {
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
      await api.post('/outfits/plan/save', { plan });
      setIsSavedPlan(true);
    } catch {
      setError('Failed to save the plan.');
    } finally {
      setSaving(false);
    }
  }, [plan]);

  const handleRegenerateDay = useCallback(
    async (day) => {
      setError('');
      const currentDayPlan = plan.find((p) => p.day === day);
      const excludeIds = [];

      if (currentDayPlan) {
        ['top', 'bottom', 'shoes', 'outerwear'].forEach((slot) => {
          const item = currentDayPlan[slot];
          if (item?._id || item?.id) {
            excludeIds.push(item._id || item.id);
          }
        });
        if (Array.isArray(currentDayPlan.accessories)) {
          currentDayPlan.accessories.forEach((acc) => {
            if (acc?._id || acc?.id) excludeIds.push(acc._id || acc.id);
          });
        }
      }

      try {
        const res = await api.post('/outfits/plan/day', {
          day,
          occasion: occasions[day],
          exclude_ids: excludeIds,
          city,
        });
        setPlan((prev) => prev.map((p) => (p.day === day ? res.data.outfit : p)));
        setIsSavedPlan(false);
      } catch (err) {
        setError(err.response?.data?.error || `Failed to regenerate outfit for ${day}.`);
      }
    },
    [city, occasions, plan],
  );

  const updateOccasion = useCallback(
    async (day, value) => {
      const nextOccasions = { ...occasions, [day]: value };
      setOccasions(nextOccasions);
      localStorage.setItem('planner_occasions', JSON.stringify(nextOccasions));
      setError('');

      try {
        const res = await api.post('/outfits/plan/day', {
          day,
          occasion: value,
          city,
        });
        setPlan((prev) => prev.map((p) => (p.day === day ? res.data.outfit : p)));
        setIsSavedPlan(false);
      } catch (err) {
        setError(err.response?.data?.error || `Failed to update outfit for ${day}.`);
      }
    },
    [city, occasions],
  );

  const handleMarkAsWorn = useCallback(async (dayPlan) => {
    try {
      setPlan((prev) =>
        prev.map((p) => {
          if (p.day !== dayPlan.day) return p;

          const updateItem = (item) => (item ? { ...item, wear_count: (item.wear_count || 0) + 1 } : item);
          return {
            ...p,
            isWorn: true,
            top: updateItem(p.top),
            bottom: updateItem(p.bottom),
            shoes: updateItem(p.shoes),
            outerwear: updateItem(p.outerwear),
            accessories: Array.isArray(p.accessories) ? p.accessories.map(updateItem) : p.accessories,
          };
        }),
      );
      await api.post('/outfits/wear', { outfit: dayPlan });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to mark outfit as worn.');
    }
  }, []);

  const handleSaveToCollection = useCallback((dayOutfit) => {
    setSelectedOutfit(dayOutfit);
    setIsModalOpen(true);
  }, []);

  const connectCalendar = useCallback(async () => {
    setCalendarLoading(true);
    setError('');
    try {
      const userId = localStorage.getItem('user_id');
      const baseApi = api.defaults.baseURL || `${window.location.origin}/api`;
      const query = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
      window.open(`${baseApi.replace(/\/$/, '')}/calendar/connect${query}`, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Failed to start calendar connection.');
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
      <div className="relative mb-10 p-8 rounded-3xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent border border-border-subtle backdrop-blur-sm">
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
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-card border border-border-subtle text-text rounded-2xl focus:outline-none focus:border-primary/50 transition-all text-sm appearance-none cursor-pointer hover:bg-white/5 font-medium"
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
              className="px-5 py-3 bg-emerald-500/90 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {calendarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarIcon className="w-4 h-4" />}
              Connect Calendar
            </button>

            <button
              onClick={handleGenerateNew}
              disabled={loading || saving}
              className="px-6 py-3 bg-card border border-border-subtle text-text font-bold rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2.5"
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
              <div className="w-px h-8 bg-white/10 hidden sm:block" />
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
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-border-subtle">
            <Sparkles className="w-10 h-10 text-text-muted/50" />
          </div>
          <h3 className="text-2xl font-bold mb-3 text-text">Your wardrobe is empty</h3>
          <p className="text-text-muted max-w-sm mx-auto">
            Upload a few items first and then come back to generate your weekly outfits.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {DAYS.map((day) => {
            const dayPlan = plan.find((p) => p.day === day);
            if (!dayPlan) return null;

            const isToday = dayPlan.day === today;
            const dayColor = DAY_COLORS[dayPlan.day] || DAY_COLORS.Monday;
            const dayAccent = DAY_ACCENTS[dayPlan.day] || DAY_ACCENTS.Monday;

            return (
              <div
                key={dayPlan.day}
                className={`group relative rounded-[2.5rem] border overflow-hidden bg-gradient-to-b ${dayColor} ${isToday ? 'ring-2 ring-primary/40 shadow-2xl shadow-primary/10' : ''} transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="px-6 pt-6 pb-4 flex items-center justify-between relative z-10">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-black text-2xl tracking-tight ${isToday ? 'text-primary' : dayAccent}`}>{dayPlan.day}</span>
                      {isToday && (
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-darker bg-primary px-2.5 py-1 rounded-lg">
                          Today
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={occasions[dayPlan.day] || 'Casual'}
                        onChange={(e) => updateOccasion(dayPlan.day, e.target.value)}
                        className="text-[11px] font-bold uppercase tracking-widest bg-white/10 border border-white/10 text-text rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary/50 cursor-pointer"
                      >
                        {OCCASIONS.map((oc) => (
                          <option key={oc} value={oc} className="bg-card text-text">
                            {oc}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => handleRegenerateDay(dayPlan.day)}
                        className="p-1.5 bg-white/10 border border-white/10 rounded-lg hover:bg-primary/20 hover:border-primary/30 text-text-muted hover:text-primary transition-all"
                        title="Regenerate this day"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMarkAsWorn(dayPlan)}
                        disabled={dayPlan.isWorn}
                        className={`p-1.5 border rounded-lg transition-all flex items-center justify-center ${dayPlan.isWorn ? 'bg-primary border-primary text-darker' : 'bg-white/10 border-white/10 text-text-muted hover:bg-green-500/20 hover:border-green-500/30 hover:text-green-400'}`}
                        title="Mark as worn"
                      >
                        {dayPlan.isWorn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleSaveToCollection(dayPlan)}
                        className="p-1.5 bg-white/10 border border-white/10 rounded-lg hover:bg-primary/20 hover:border-primary/30 text-text-muted hover:text-primary transition-all"
                        title="Save to collection"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <ScoreBadge score={dayPlan.score} />
                </div>

                <div className="px-5 pb-6 space-y-3 relative z-10">
                  <OutfitSlot item={dayPlan.top} label="Top" />
                  <OutfitSlot item={dayPlan.bottom} label="Bottom" />
                  <div className="grid grid-cols-2 gap-3">
                    <OutfitSlot item={dayPlan.shoes} label="Footwear" />
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
                          <div
                            key={`${dayPlan.day}-acc-${i}`}
                            className="flex items-center gap-2 p-1.5 bg-white/5 rounded-xl border border-white/5 hover:border-primary/20 transition-all"
                            title={acc.type}
                          >
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
              </div>
            );
          })}
        </div>
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
