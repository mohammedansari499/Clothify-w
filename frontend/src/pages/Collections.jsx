import React, { useCallback, useEffect, useState } from 'react';
import api from '../utils/axios';
import { FolderHeart, Trash2, Loader2, Bookmark, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

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

    const handleDeleteCollection = async (id) => {
        if (!window.confirm('Are you sure you want to delete this collection?')) return;

        try {
            await api.delete(`/collections/${id}`);
            setCollections(collections.filter(c => c._id !== id));
        } catch (err) {
            console.error('Error deleting collection:', err);
            alert('Failed to delete collection');
        }
    };

    const handleRemoveOutfit = async (collectionId, outfitIndex) => {
        try {
            await api.delete(`/collections/${collectionId}/outfit/${outfitIndex}`);
            
            setCollections(collections.map(c => {
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
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-secondary animate-spin" />
                    <p className="text-text-muted animate-pulse">Loading your collections...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-secondary/20 rounded-xl">
                            <FolderHeart size={28} className="text-secondary" />
                        </div>
                        <h1 className="text-4xl font-bold text-text">My Collections</h1>
                    </div>
                    <p className="text-text-muted text-lg">Curated sets of your favorite outfit combinations</p>
                </div>
                <Link to="/planner" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-text transition-all active:scale-95">
                    <Sparkles size={18} className="text-secondary" />
                    <span>Generate New Outfits</span>
                </Link>
            </div>

            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
                    {error}
                </div>
            )}

            {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-glass-bg border border-white/5 rounded-3xl backdrop-blur-md">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Bookmark size={40} className="text-white/20" />
                    </div>
                    <h2 className="text-2xl font-bold text-text mb-2">No collections yet</h2>
                    <p className="text-text-muted mb-8 text-center max-w-sm">Save your favorite outfit suggestions from the AI Planner to see them here.</p>
                    <Link to="/planner" className="px-8 py-3 bg-secondary hover:bg-secondary-dark rounded-2xl text-white font-semibold transition-all shadow-lg shadow-secondary/20 active:scale-95">
                        Go to Planner
                    </Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {collections.map((collection) => (
                        <div key={collection._id} className="group">
                            <div className="flex items-center justify-between mb-6 px-2">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-bold text-text group-hover:text-secondary transition-colors">{collection.name}</h2>
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-semibold text-text-muted">
                                        {collection.outfits.length} {collection.outfits.length === 1 ? 'Outfit' : 'Outfits'}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteCollection(collection._id)}
                                    className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                    title="Delete Collection"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {collection.outfits.length === 0 ? (
                                <div className="p-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center">
                                    <p className="text-text-muted italic">This collection is empty.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {collection.outfits.map((outfitData, idx) => (
                                        <div key={idx} className="relative bg-glass-bg border border-white/5 rounded-3xl p-6 hover:border-white/20 hover:shadow-2xl transition-all duration-300 group/card">
                                            <button 
                                                onClick={() => handleRemoveOutfit(collection._id, idx)}
                                                className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-500 opacity-0 group-hover/card:opacity-100 rounded-xl hover:bg-red-500 transition-all hover:text-white z-10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            
                                            <div className="space-y-4">
                                                {/* Visual indicator of the outfit items */}
                                                <div className="grid grid-cols-2 gap-3 mb-6">
                                                    {Object.entries(outfitData.items).map(([category, item], i) => (
                                                        item && (
                                                            <div key={i} className="flex flex-col gap-1 p-3 bg-white/5 rounded-2xl border border-white/5">
                                                                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">{category}</span>
                                                                <span className="text-sm font-medium text-text truncate">
                                                                    {item.name || item.type || `${item.color || ''} ${item.category || ''}`.trim() || 'Outfit item'}
                                                                </span>
                                                            </div>
                                                        )
                                                    ))}
                                                </div>
                                                
                                                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-text-muted italic">
                                                    <span>Saved {new Date(outfitData.saved_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Collections;
