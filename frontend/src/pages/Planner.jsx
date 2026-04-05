import { useState, useEffect } from 'react';
import api from '../utils/axios';
import { Loader2, Calendar as CalendarIcon, RefreshCw, CheckCircle2, Sparkles, Save } from 'lucide-react';

const DAY_COLORS = {
  Monday: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
  Tuesday: 'from-violet-500/20 to-violet-600/5 border-violet-500/20',
  Wednesday: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  Thursday: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  Friday: 'from-rose-500/20 to-rose-600/5 border-rose-500/20',
  Saturday: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/20',
  Sunday: 'from-orange-500/20 to-orange-600/5 border-orange-500/20',
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

function ScoreBadge({ score }) {
  const level = score >= 70 ? 'Excellent' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Mix';
  const color = score >= 70 ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : score >= 50 ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    : score >= 30 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
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
    <div className="flex items-center gap-3 p-2.5 bg-black/30 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <div className="w-14 h-14 bg-white/5 rounded-lg overflow-hidden shrink-0 p-1">
        <img src={item.image_url} alt={item.type} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
          {item.wear_count > 0 && (
            <span className="text-[9px] text-gray-600">worn {item.wear_count}x</span>
          )}
        </div>
        <div className="capitalize text-sm font-medium text-gray-200 truncate">{item.type?.replace('_', ' ')}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {item.colors?.slice(0, 3).map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-full border border-white/20"
              style={{ backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})` }} />
          ))}
          {item.color_name && <span className="text-[10px] text-gray-500 ml-1">{item.color_name}</span>}
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

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    setError('');
    try {
      const savedRes = await api.get('/outfits/plan/saved');
      if (savedRes.data.plan) {
        setPlan(savedRes.data.plan);
        setIsSavedPlan(true);
      } else {
        const res = await api.get('/outfits/plan');
        setPlan(res.data);
        setIsSavedPlan(false);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load weekly plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNew = async () => {
    setLoading(true);
    setError('');
    setIsSavedPlan(false);
    try {
      const res = await api.get('/outfits/plan');
      setPlan(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate new plan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    setSaving(true);
    try {
      await api.post('/outfits/plan/save', { plan });
      setIsSavedPlan(true);
    } catch (err) {
      setError('Failed to save the plan.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Weekly Outfit Planner</h1>
          </div>
          <p className="text-gray-400">AI-powered outfits with color contrast matching. Items worn less are prioritized.</p>
          {isSavedPlan && (
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              ✓ Saved to Calendar
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateNew}
            disabled={loading || saving}
            className="px-5 py-2.5 bg-dark border border-white/10 text-white font-medium rounded-xl hover:bg-white/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
            {loading ? 'Generating...' : 'Regenerate'}
          </button>
          
          {plan.length > 0 && !isSavedPlan && (
            <button
              onClick={handleSavePlan}
              disabled={saving || loading}
              className="px-5 py-2.5 bg-primary text-darker font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_-5px] shadow-primary/30 hover:shadow-primary/50 shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save to Calendar'}
            </button>
          )}
        </div>
      </div>

      {error && !loading && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl mb-8">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-gray-400 animate-pulse">Analyzing color harmony and generating outfits...</p>
        </div>
      ) : plan.length === 0 && !error ? (
        <div className="text-center py-20 rounded-2xl border border-white/10 bg-card/50">
          <h3 className="text-xl font-medium mb-2">Not enough clothes</h3>
          <p className="text-gray-400">Upload at least one top and one bottom to your wardrobe to start planning.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plan.map((dayPlan) => {
            const isToday = dayPlan.day === today;
            const dayColor = DAY_COLORS[dayPlan.day] || DAY_COLORS.Monday;
            const dayAccent = DAY_ACCENTS[dayPlan.day] || DAY_ACCENTS.Monday;

            return (
              <div key={dayPlan.day} className={`relative rounded-2xl border overflow-hidden bg-gradient-to-b ${dayColor} ${isToday ? 'ring-2 ring-primary/50 scale-[1.02]' : ''} transition-all duration-300 hover:-translate-y-1`}>
                {/* Day header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isToday && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    <span className={`font-bold text-lg ${isToday ? 'text-primary' : dayAccent}`}>
                      {dayPlan.day}
                    </span>
                    {isToday && <span className="text-[10px] uppercase tracking-wider text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">Today</span>}
                  </div>
                  <ScoreBadge score={dayPlan.score} />
                </div>

                {/* Outfit slots */}
                <div className="px-3 pb-4 space-y-2">
                  <OutfitSlot item={dayPlan.top} label="Top" />
                  <OutfitSlot item={dayPlan.bottom} label="Bottom" />
                  <OutfitSlot item={dayPlan.shoes} label="Shoes" />
                  <OutfitSlot item={dayPlan.outerwear} label="Layer" />
                </div>

                {/* Style suggestion */}
                {dayPlan.suggested_style && (
                  <div className="px-4 pb-3">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500">
                      Suggested: {dayPlan.suggested_style}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
