import { useCallback, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/axios';
import { FolderHeart, Trash2, Loader2, Bookmark, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const OutfitCard = memo(function OutfitCard({ outfitData, collectionId, outfitIndex, onRemove }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className="relative bg-surface border border-border-subtle rounded-3xl p-6 hover:bg-surface/80 hover:shadow-2xl transition-all duration-300 group/card"
        >
            <button
                onClick={() => onRemove(collectionId, outfitIndex)}
                className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 opacity-0 group-hover/card:opacity-100 rounded-xl hover:bg-red-500 hover:text-white transition-all z-10"
            >
                <Trash2 size={16} />
            </button>

            <div className="space-y-4">
                {/* Structured outfit slots */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {['top', 'bottom', 'shoes', 'footwear', 'outerwear'].map((slot, i) => {
                        const item = outfitData[slot] || (outfitData.items && outfitData.items[slot]);
                        if (!item) return null;
                        const label = slot === 'shoes' || slot === 'footwear' ? 'Footwear' : slot.charAt(0).toUpperCase() + slot.slice(1);
                        return (
                            <motion.div
                                key={slot}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex flex-col gap-2 p-3 bg-card rounded-2xl border border-border-subtle hover:border-primary/20 transition-all"
                            >
                                {item.image_url && (
                                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface">
                                        <img src={item.image_url} alt={label} className="w-full h-full object-contain" />
                                    </div>
                                )}
                                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{label}</span>
                                <span className="text-sm font-medium text-text truncate">
                                    {item.name || item.type?.replace('_', ' ') || `${item.color_name || ''} ${item.category || ''}`.trim() || 'Outfit item'}
                                </span>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Accessories */}
                {(outfitData.accessories || (outfitData.items && outfitData.items.accessories)) && (() => {
                    const acc = outfitData.accessories || outfitData.items.accessories;
                    const accList = Array.isArray(acc) ? acc : [acc];
                    return accList.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {accList.map((a, i) => a && (
                                <div key={i} className="flex items-center gap-2 p-2 bg-card rounded-xl border border-border-subtle">
                                    {a.image_url && (
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-surface">
                                            <img src={a.image_url} alt={a.type || 'accessory'} className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <span className="text-xs text-text capitalize truncate">{a.type?.replace('_', ' ') || 'Accessory'}</span>
                                </div>
                            ))}
                        </div>
                    );
                })()}

                <div className="pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-text-muted italic">
                    <span>Saved {new Date(outfitData.saved_at).toLocaleDateString()}</span>
                </div>
            </div>
        </motion.div>
    );
});

const Collections = () => {
    const [collections, setCollections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCollections = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/collections/');
            setCollections(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching collections:', err);
            setError('Failed to load collections. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleDeleteCollection = useCallback(async (id) => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;

        try {
            await api.delete(`/collections/${id}`);
            setCollections(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            console.error('Error deleting collection:', err);
            alert('Failed to delete collection');
        }
    }, []);

    const handleRemoveOutfit = useCallback(async (collectionId, outfitIndex) => {
        try {
            await api.delete(`/collections/${collectionId}/outfit/${outfitIndex}`);

            setCollections(prev => prev.map(c => {
                if (c._id === collectionId) {
                    const newOutfits = [...c.outfits];
                    newOutfits.splice(outfitIndex, 1);
                    return { ...c, outfits: newOutfits };
                }
                return c;
            }));
        } catch (err) {
            console.error('Error removing outfit:', err);
            alert('Failed to remove outfit');
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full"
                    />
                    <p className="text-text-muted text-sm font-black uppercase tracking-widest animate-pulse">Loading collections...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/30">
                            <FolderHeart size={28} className="text-primary" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-text">My Collections</h1>
                    </div>
                    <p className="text-text-muted text-lg">Curated sets of your favorite outfit combinations</p>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Link to="/planner" className="flex items-center gap-2 px-6 py-3 bg-card hover:bg-primary/10 border border-border-subtle rounded-2xl text-text transition-all active:scale-95 hover:-translate-y-1 hover:shadow-lg">
                        <Sparkles size={18} className="text-primary" />
                        <span className="font-bold">Generate New Outfits</span>
                    </Link>
                </motion.div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 flex items-center gap-3"
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {collections.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="flex flex-col items-center justify-center py-20 bg-surface border border-border-subtle rounded-3xl relative overflow-hidden"
                >
                    <div className="absolute top-1/2 left-1/2 -z-10 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                    <div className="w-20 h-20 bg-card rounded-3xl flex items-center justify-center mb-6 border border-border-subtle">
                        <Bookmark size={40} className="text-text/20" />
                    </div>
                    <h2 className="text-2xl font-black text-text mb-2 tracking-tight">No collections yet</h2>
                    <p className="text-text-muted mb-8 text-center max-w-sm">Save your favorite outfit suggestions from the AI Planner to see them here.</p>
                    <Link to="/planner" className="px-8 py-3 bg-primary text-darker font-black rounded-2xl hover:scale-105 transition-transform active:scale-95 shadow-glow">
                        Go to Planner
                    </Link>
                </motion.div>
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12 } }
                    }}
                    className="space-y-12"
                >
                    <AnimatePresence mode="popLayout">
                        {collections.map((collection) => (
                            <motion.div
                                key={collection._id}
                                layout
                                variants={{
                                    hidden: { opacity: 0, y: 30 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                                className="group"
                            >
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-4">
                                        <h2 className="text-2xl font-black text-text group-hover:text-primary transition-colors tracking-tight">{collection.name}</h2>
                                        <span className="px-3 py-1 bg-card border border-border-subtle rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            {collection.outfits.length} {collection.outfits.length === 1 ? 'Outfit' : 'Outfits'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCollection(collection._id)}
                                        className="p-2.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                                        title="Delete Collection"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {collection.outfits.length === 0 ? (
                                    <div className="p-12 border-2 border-dashed border-border-subtle rounded-3xl flex flex-col items-center justify-center">
                                        <p className="text-text-muted italic">This collection is empty.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <AnimatePresence mode="popLayout">
                                            {collection.outfits.map((outfitData, idx) => (
                                                <OutfitCard
                                                    key={`${collection._id}-${idx}`}
                                                    outfitData={outfitData}
                                                    collectionId={collection._id}
                                                    outfitIndex={idx}
                                                    onRemove={handleRemoveOutfit}
                                                />
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </motion.div>
    );
};

export default Collections;
