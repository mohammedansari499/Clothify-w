import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import api from '../utils/axios';
import UploadDropzone from '../components/UploadDropzone';
import { Trash2, Eye, RotateCcw } from 'lucide-react';

const CATEGORY_CONFIG = {
  // Tops
  tshirt: { label: 'T-Shirts', icon: '👕', group: 'Tops' },
  shirt: { label: 'Shirts', icon: '👔', group: 'Tops' },
  formal_shirt: { label: 'Formal Shirts', icon: '👔', group: 'Tops' },
  // Outerwear
  jacket: { label: 'Jackets', icon: '🧥', group: 'Outerwear' },
  coat: { label: 'Coats', icon: '🧥', group: 'Outerwear' },
  hoodie: { label: 'Hoodies', icon: '🧥', group: 'Outerwear' },
  sweater: { label: 'Sweaters & Cardigans', icon: '🧶', group: 'Outerwear' },
  blazer: { label: 'Blazers & Waistcoats', icon: '🤵', group: 'Outerwear' },
  // Indian Wear
  kurta: { label: 'Kurtas', icon: '🪷', group: 'Traditional' },
  sherwani: { label: 'Sherwanis', icon: '🪷', group: 'Traditional' },
  // Bottoms
  jeans: { label: 'Jeans', icon: '👖', group: 'Bottoms' },
  formal_pants: { label: 'Formal Pants', icon: '👖', group: 'Bottoms' },
  cargo_pants: { label: 'Cargo Pants', icon: '👖', group: 'Bottoms' },
  shorts: { label: 'Shorts', icon: '🩳', group: 'Bottoms' },
  track_pants: { label: 'Track Pants & Joggers', icon: '🏃', group: 'Bottoms' },
  pyjama: { label: 'Pyjamas', icon: '😴', group: 'Bottoms' },
  // Dresses
  dress: { label: 'Dresses', icon: '👗', group: 'Dresses' },
  skirt: { label: 'Skirts', icon: '👗', group: 'Dresses' },
  // Footwear
  sneakers: { label: 'Sneakers', icon: '👟', group: 'Footwear' },
  shoes: { label: 'Shoes & Boots', icon: '👞', group: 'Footwear' },
  loafers: { label: 'Loafers', icon: '🥿', group: 'Footwear' },
  sandals: { label: 'Sandals', icon: '🩴', group: 'Footwear' },
  slippers: { label: 'Slippers & Flip-flops', icon: '🩴', group: 'Footwear' },
  // Accessories
  watch: { label: 'Watches', icon: '⌚', group: 'Accessories' },
  belt: { label: 'Belts', icon: '🪢', group: 'Accessories' },
  cap: { label: 'Caps & Hats', icon: '🧢', group: 'Accessories' },
  socks: { label: 'Socks', icon: '🧦', group: 'Accessories' },
  ring: { label: 'Rings', icon: '💍', group: 'Accessories' },
  chain: { label: 'Chains & Necklaces', icon: '📿', group: 'Accessories' },
  bracelet: { label: 'Bracelets', icon: '📿', group: 'Accessories' },
  tie: { label: 'Ties', icon: '👔', group: 'Accessories' },
  scarf: { label: 'Scarves', icon: '🧣', group: 'Accessories' },
  bag: { label: 'Bags', icon: '🎒', group: 'Accessories' },
  // Sportswear
  sportswear: { label: 'Sportswear', icon: '🏋️', group: 'Sportswear' },
  tracksuit: { label: 'Tracksuits', icon: '🏃', group: 'Sportswear' },
  // Fallback
  unknown: { label: 'Other Items', icon: '📦', group: 'Other' },
  pants: { label: 'Pants', icon: '👖', group: 'Bottoms' },
  accessories: { label: 'Accessories', icon: '✨', group: 'Accessories' },
  outerwear: { label: 'Outerwear', icon: '🧥', group: 'Outerwear' },
};

const GROUP_ORDER = ['Tops', 'Bottoms', 'Outerwear', 'Traditional', 'Dresses', 'Footwear', 'Accessories', 'Sportswear', 'Other'];

const STYLE_COLORS = {
  formal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'semi-formal': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  casual: 'bg-green-500/20 text-green-400 border-green-500/30',
  traditional: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  athletic: 'bg-red-500/20 text-red-400 border-red-500/30',
  accessory: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

const ItemCard = memo(({ item, onDelete, onMarkWorn, onResetWorn }) => {
  const styleClass = STYLE_COLORS[item.style] || STYLE_COLORS.casual;
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden hover:border-primary/40 transition-colors shadow-lg flex flex-col h-full"
    >
      {/* Image */}
      <div className="aspect-square bg-gradient-to-b from-white/5 to-transparent w-full overflow-hidden flex items-center justify-center p-3 relative">
        <motion.img 
          src={item.image_url} 
          alt={item.type} 
          className="object-contain w-full h-full drop-shadow-2xl" 
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => onDelete(item._id)}
            className="p-1.5 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onMarkWorn(item._id)}
            className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
            title="Mark as worn today"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {(item.wear_count || 0) > 0 && (
            <button
              onClick={() => onResetWorn(item._id)}
              className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-white transition-colors"
              title="Reset wear count"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Wear count badge */}
        {(item.wear_count || 0) > 0 && (
          <div className="absolute bottom-2 left-2 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">
            Worn {item.wear_count}x
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-2 border-t border-white/5 bg-white/5">
        <div className="flex items-center justify-between">
          <span className="capitalize font-semibold text-sm text-gray-100">{item.type?.replace('_', ' ')}</span>
          {item.color_name && (
            <span className="text-[10px] text-gray-400">{item.color_name}</span>
          )}
        </div>

        {/* Color Swatches */}
        {item.colors && item.colors.length > 0 && (
          <div className="flex items-center gap-1">
            {item.colors.map((color, i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full border border-white/20 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                style={{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }}
                title={rgbToHex(color[0], color[1], color[2])}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-1 items-center">
          {item.style && (
            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${styleClass}`}>
              {item.style}
            </span>
          )}
          {item.occasion_tags && item.occasion_tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-white/5 text-gray-400 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

ItemCard.displayName = 'ItemCard';

export default function Wardrobe() {
  const [clothes, setClothes] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Group by GROUP sections
  const groupedBySection = useMemo(() => {
    const grouped = {};
    clothes.forEach(item => {
      const type = item.type || 'unknown';
      const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.unknown;
      const group = config.group;
      if (!grouped[group]) grouped[group] = {};
      if (!grouped[group][type]) grouped[group][type] = [];
      grouped[group][type].push(item);
    });
    return grouped;
  }, [clothes]);

  const stats = useMemo(() => ({
    totalItems: clothes.length,
    totalCategories: new Set(clothes.map(c => c.type)).size,
    totalGroups: Object.keys(groupedBySection).length
  }), [clothes, groupedBySection]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">My Wardrobe</h1>
          <p className="text-gray-400 mb-4">Your complete digital wardrobe, organized by AI.</p>
          
          {stats.totalItems > 0 && (
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-primary font-bold text-lg">{stats.totalItems}</span>
                <span className="text-gray-400 text-xs">Items</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white font-bold text-lg">{stats.totalCategories}</span>
                <span className="text-gray-400 text-xs">Types</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white font-bold text-lg">{stats.totalGroups}</span>
                <span className="text-gray-400 text-xs">Sections</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="w-full md:w-96 shrink-0">
          <UploadDropzone onUploadSuccess={handleUploadSuccess} />
        </div>
      </div>

      {/* Content */}
      <LayoutGroup>
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400">Loading wardrobe...</div>
        ) : stats.totalItems === 0 ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-24 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -z-10 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
            <h3 className="text-2xl font-bold mb-2 tracking-tight">Your wardrobe is empty</h3>
            <p className="text-gray-400">Upload your first piece of clothing above to get started.</p>
          </motion.div>
        ) : (
          <div className="space-y-12">
            {GROUP_ORDER.filter(g => groupedBySection[g]).map(groupName => (
              <motion.div 
                layout
                key={groupName}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-black tracking-tight text-white">{groupName}</h2>
                  <div className="flex-1 border-t border-white/10" />
                  <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full">
                    {Object.values(groupedBySection[groupName]).flat().length} items
                  </span>
                </div>

                {/* Sub-categories within group */}
                <div className="space-y-6">
                  {Object.keys(groupedBySection[groupName]).map(type => {
                    const config = CATEGORY_CONFIG[type] || CATEGORY_CONFIG.unknown;
                    const items = groupedBySection[groupName][type];

                    return (
                      <div key={type}>
                        {/* Category label */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{config.icon}</span>
                          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{config.label}</h3>
                          <span className="text-xs text-gray-600">({items.length})</span>
                        </div>

                        {/* Items Grid */}
                        <motion.div 
                          layout
                          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
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
