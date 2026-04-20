import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import api from '../utils/axios';
import UploadDropzone from '../components/UploadDropzone';
import {
  Trash2, Eye, RotateCcw, Filter, Search,
  Grid, List as ListIcon, Plus, ChevronDown,
  Info, Sparkles, Shirt, Layers, Palette
} from 'lucide-react';

const CATEGORY_CONFIG = {
  tshirt: { label: 'T-Shirts', icon: <Shirt className="w-4 h-4" />, group: 'Tops' },
  shirt: { label: 'Shirts', icon: <Shirt className="w-4 h-4" />, group: 'Tops' },
  formal_shirt: { label: 'Formal Shirts', icon: <Shirt className="w-4 h-4" />, group: 'Tops' },
  jacket: { label: 'Jackets', icon: <Layers className="w-4 h-4" />, group: 'Outerwear' },
  coat: { label: 'Coats', icon: <Layers className="w-4 h-4" />, group: 'Outerwear' },
  hoodie: { label: 'Hoodies', icon: <Layers className="w-4 h-4" />, group: 'Outerwear' },
  sweater: { label: 'Sweaters', icon: <Layers className="w-4 h-4" />, group: 'Outerwear' },
  blazer: { label: 'Blazers', icon: <Layers className="w-4 h-4" />, group: 'Outerwear' },
  kurta: { label: 'Kurtas', icon: <Sparkles className="w-4 h-4" />, group: 'Traditional' },
  sherwani: { label: 'Sherwanis', icon: <Sparkles className="w-4 h-4" />, group: 'Traditional' },
  jeans: { label: 'Jeans', icon: <Layers className="w-4 h-4" />, group: 'Bottoms' },
  formal_pants: { label: 'Formal Pants', icon: <Layers className="w-4 h-4" />, group: 'Bottoms' },
  cargo_pants: { label: 'Cargo Pants', icon: <Layers className="w-4 h-4" />, group: 'Bottoms' },
  shorts: { label: 'Shorts', icon: <Layers className="w-4 h-4" />, group: 'Bottoms' },
  track_pants: { label: 'Track Pants', icon: <Layers className="w-4 h-4" />, group: 'Bottoms' },
  pyjama: { label: 'Kurta', icon: <Layers className="w-4 h-4" />, group: 'Traditional' },
  dress: { label: 'Dresses', icon: <Palette className="w-4 h-4" />, group: 'Dresses' },
  skirt: { label: 'Skirts', icon: <Palette className="w-4 h-4" />, group: 'Dresses' },
  sneakers: { label: 'Sneakers', icon: <Plus className="w-4 h-4" />, group: 'Footwear' },
  shoes: { label: 'Shoes', icon: <Plus className="w-4 h-4" />, group: 'Footwear' },
  loafers: { label: 'Shoes', icon: <Plus className="w-4 h-4" />, group: 'Footwear' },
  sandals: { label: 'Sandals', icon: <Plus className="w-4 h-4" />, group: 'Footwear' },
  slippers: { label: 'Slippers', icon: <Plus className="w-4 h-4" />, group: 'Footwear' },
  watch: { label: 'Watches', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  belt: { label: 'Belts', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  cap: { label: 'Caps', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  socks: { label: 'Socks', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  ring: { label: 'Rings', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  chain: { label: 'Chains', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  bracelet: { label: 'Bracelets', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  tie: { label: 'Ties', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  scarf: { label: 'Scarf', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  bag: { label: 'Bags', icon: <Plus className="w-4 h-4" />, group: 'Accessories' },
  sportswear: { label: 'Sportswear', icon: <Plus className="w-4 h-4" />, group: 'Sportswear' },
  tracksuit: { label: 'Tracksuits', icon: <Plus className="w-4 h-4" />, group: 'Sportswear' },
  unknown: { label: 'Other', icon: <Info className="w-4 h-4" />, group: 'Other' },
};

const GROUP_ORDER = ['Tops', 'Bottoms', 'Outerwear', 'Traditional', 'Dresses', 'Footwear', 'Accessories', 'Sportswear', 'Other'];

const STYLE_COLORS = {
  formal: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  semiformal: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
  casual: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  traditional: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  athletic: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
  accessory: 'from-fuchsia-500/20 to-pink-500/20 text-fuchsia-400 border-fuchsia-500/30',
};

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

const ItemCard = memo(({ item, onDelete, onMarkWorn, onResetWorn }) => {
  const styleClass = STYLE_COLORS[item.style] || STYLE_COLORS.casual;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -8 }}
      className="group relative bg-surface border border-border-subtle hover:bg-surface/80 rounded-2xl overflow-hidden transition-all duration-500 flex flex-col h-full"
    >
      <div className="aspect-[4/5] bg-gradient-to-b from-white/5 to-transparent w-full overflow-hidden flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />

        <motion.img
          src={item.image_url}
          alt={item.type}
          className="object-contain w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10"
          whileHover={{ scale: 1.1, rotate: 2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 z-20">
          <button
            onClick={() => onDelete(item._id)}
            className="p-2.5 bg-red-500/10 text-red-500 backdrop-blur-md rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-text transition-all transform hover:scale-110"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onMarkWorn(item._id)}
            className="p-2.5 bg-blue-500/10 text-blue-400 backdrop-blur-md rounded-xl border border-blue-500/20 hover:bg-blue-500 hover:text-text transition-all transform hover:scale-110"
            title="Mark as worn today"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(item.wear_count || 0) > 0 && (
            <button
              onClick={() => onResetWorn(item._id)}
              className="p-2.5 bg-amber-500/10 text-amber-400 backdrop-blur-md rounded-xl border border-amber-500/20 hover:bg-amber-500 hover:text-text transition-all transform hover:scale-110"
              title="Reset wear count"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {(item.wear_count || 0) > 0 && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="px-3 py-1.5 bg-surface border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted">
              Worn {item.wear_count}x
            </div>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <h4 className="capitalize font-black text-sm tracking-tight text-text truncate pr-4">
            {item.type?.replace('_', ' ')}
          </h4>
          {item.color_name && (
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter shrink-0">{item.color_name}</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-lg border bg-gradient-to-br transition-all duration-500 ${styleClass}`}>
            {item.style}
          </div>

          {item.colors && item.colors.length > 0 && (
            <div className="flex -space-x-1.5">
              {item.colors.slice(0, 3).map((color, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-darker shadow-lg cursor-pointer hover:scale-125 transition-transform z-[1]"
                  style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                  title={rgbToHex(color[0], color[1], color[2])}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';

export default function Wardrobe() {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('All');

  const fetchClothes = useCallback(async () => {
    try {
      const res = await api.get('/clothes/');
      setClothes(res.data);
    } catch (error) {
      console.error('Error fetching clothes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClothes(); }, [fetchClothes]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/clothes/${id}`);
      setClothes(prev => prev.filter(c => c._id !== id));
    } catch (error) {
      console.error('Error deleting item', error);
    }
  }, []);

  const handleUploadSuccess = useCallback((newItem) => {
    setClothes(prev => [newItem, ...prev]);
  }, []);

  const handleMarkWorn = useCallback(async (id) => {
    try {
      setClothes(prev => prev.map(c =>
        c._id === id ? { ...c, wear_count: (c.wear_count || 0) + 1, last_worn: new Date().toISOString() } : c
      ));
      await api.patch(`/clothes/${id}/wear`);
    } catch (e) { console.error(e); }
  }, []);

  const handleResetWorn = useCallback(async (id) => {
    try {
      setClothes(prev => prev.map(c =>
        c._id === id ? { ...c, wear_count: 0, last_worn: null } : c
      ));
      await api.patch(`/clothes/${id}/reset-wear`);
    } catch (e) { console.error(e); }
  }, []);

  const filteredClothes = useMemo(() => {
    return clothes.filter(item => {
      const matchesSearch = (item.type + item.style + (item.color_name || '')).toLowerCase().includes(searchQuery.toLowerCase());
      const config = CATEGORY_CONFIG[item.type] || CATEGORY_CONFIG.unknown;
      const matchesGroup = activeGroup === 'All' || config.group === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [clothes, searchQuery, activeGroup]);

  const groupedBySection = useMemo(() => {
    const grouped = {};
    filteredClothes.forEach(item => {
      const type = item.type || 'unknown';
      const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.unknown;
      const group = config.group;
      if (!grouped[group]) grouped[group] = {};
      if (!grouped[group][type]) grouped[group][type] = [];
      grouped[group][type].push(item);
    });
    return grouped;
  }, [filteredClothes]);

  const stats = useMemo(() => ({
    totalItems: clothes.length,
    totalCategories: new Set(clothes.map(c => c.type)).size,
    groups: GROUP_ORDER.filter(g => clothes.some(c => (CATEGORY_CONFIG[c.type] || CATEGORY_CONFIG.unknown).group === g))
  }), [clothes]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 bg-background text-text"
    >
      {/* Header Dashboard */}
      <div className="relative mb-20">
        <div className="absolute top-[-100%] left-[-10%] w-[30%] h-[200%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between relative z-10">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-border-subtle rounded-2xl text-primary mb-6 text-[10px] font-black uppercase tracking-widest"
            >
              <Layers className="w-3 h-3" /> Digital Archive
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-6 text-text leading-[0.9]">
              Wardrobe <span className="text-primary italic">Intelligence</span>
            </h1>
            <p className="text-lg text-text-muted font-medium mb-10 leading-relaxed">
              Explore your collection through our neural classification system. Every fiber, color, and silhouette indexed for perfect coordination.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="Total Assets" value={stats.totalItems} icon={<Shirt />} />
              <StatCard label="Classifications" value={stats.totalCategories} icon={<Layers />} />
              <StatCard label="Style Vectors" value={stats.groups.length} icon={<Palette />} />
            </div>
          </div>

          <div className="w-full lg:w-[400px]">
            <UploadDropzone onUploadSuccess={handleUploadSuccess} />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12 sticky top-24 z-30 py-4 bg-surface border border-border-subtle rounded-2xl px-6 shadow-2xl">
        <div className="flex flex-wrap gap-2">
          <FilterButton
            active={activeGroup === 'All'}
            onClick={() => setActiveGroup('All')}
            label="All Assets"
          />
          {stats.groups.map(group => (
            <FilterButton
              key={group}
              active={activeGroup === group}
              onClick={() => setActiveGroup(group)}
              label={group}
            />
          ))}
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search silhouettes, styles, colors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-primary/50 text-sm font-medium transition-all"
          />
        </div>
      </div>

      {/* Content Grid */}
      <LayoutGroup>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4 text-text-muted">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
            />
            <span className="text-sm font-black uppercase tracking-widest animate-pulse">Synchronizing Data...</span>
          </div>
        ) : filteredClothes.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-32 bg-surface border border-border-subtle rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -z-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
            <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-text-muted border border-white/10">
              <Search className="w-10 h-10" />
            </div>
            <h3 className="text-3xl font-black mb-4 tracking-tight">No matching assets found</h3>
            <p className="text-text-muted max-w-md mx-auto font-medium">Your search criteria didn't yield any results from our neural indexing.</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveGroup('All'); }}
              className="mt-8 px-8 py-4 bg-primary text-darker font-black rounded-2xl hover:scale-105 transition-transform active:scale-95"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <div className="space-y-24">
            {GROUP_ORDER.filter(g => groupedBySection[g]).map(groupName => (
              <motion.div
                layout
                key={groupName}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="relative"
              >
                {/* Section Header */}
                <div className="flex items-end gap-6 mb-12">
                  <div className="shrink-0">
                    <h2 className="text-4xl font-black tracking-tighter text-text">{groupName}</h2>
                    <div className="h-1.5 w-12 bg-primary mt-2 rounded-full" />
                  </div>
                  <div className="flex-1 h-px bg-white/5 mb-4" />
                  <div className="mb-2 px-4 py-1.5 bg-surface border border-border-subtle rounded-2xl text-[10px] font-black uppercase tracking-widest text-text-muted">
                    {Object.values(groupedBySection[groupName]).flat().length} Units
                  </div>
                </div>

                <div className="space-y-16">
                  {Object.keys(groupedBySection[groupName]).map(type => {
                    const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.unknown;
                    const items = groupedBySection[groupName][type];

                    return (
                      <div key={type} className="relative">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 bg-surface border border-border-subtle rounded-2xl flex items-center justify-center text-primary">
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-text-muted uppercase tracking-[0.2em]">{config.label}</h3>
                            <div className="text-[10px] font-bold text-primary/50">{items.length} Variations Indexed</div>
                          </div>
                        </div>

                        <motion.div
                          layout
                          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                        >
                          <AnimatePresence mode="popLayout">
                            {items.map(item => (
                              <ItemCard
                                key={item._id}
                                item={item}
                                onDelete={handleDelete}
                                onMarkWorn={handleMarkWorn}
                                onResetWorn={handleResetWorn}
                              />
                            ))}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </LayoutGroup>
    </motion.div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="p-6 bg-surface border border-border-subtle rounded-2xl relative overflow-hidden group">
      <div className="absolute top-[-20%] right-[-10%] text-white/5 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none transform rotate-12 scale-150">
        {icon}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">{label}</div>
      <div className="text-3xl font-black text-text">{value}</div>
    </div>
  );
}

function FilterButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active
        ? 'bg-primary text-darker shadow-glow'
        : 'bg-transparent text-text-muted hover:text-text hover:bg-white/5 border border-white/10 hover:border-white/20'
        }`}
    >
      {label}
    </button>
  );
}
