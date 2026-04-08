import React, { useCallback, useEffect, useState } from 'react';
import { X, Plus, Check, Loader2, FolderHeart } from 'lucide-react';
import api from '../utils/axios';

const AddToCollectionModal = ({ isOpen, onClose, outfit, onAdd }) => {
    const [collections, setCollections] = useState([]);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState(null);
    const [error, setError] = useState('');

    const fetchCollections = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/collections/');
            setCollections(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching collections:', err);
            setError('Failed to load collections');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchCollections();
        }
    }, [fetchCollections, isOpen]);

    const handleCreateCollection = async (e) => {
        e.preventDefault();
        if (!newCollectionName.trim()) return;

        try {
            setIsCreating(true);
            const response = await api.post('/collections/', { name: newCollectionName.trim() });
            
            const newColl = { _id: response.data.id, name: newCollectionName.trim(), outfits: [] };
            setCollections([...collections, newColl]);
            setNewCollectionName('');
            setSelectedCollectionId(newColl._id);
            setError('');
        } catch (err) {
            console.error('Error creating collection:', err);
            setError('Failed to create collection');
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddToCollection = async () => {
        if (!selectedCollectionId) return;

        try {
            setIsLoading(true);
            await api.post(`/collections/${selectedCollectionId}/add`, { outfit });
            setError('');
            onAdd();
            onClose();
        } catch (err) {
            console.error('Error adding to collection:', err);
            setError('Failed to add outfit to collection');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-glass-bg border border-white/10 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <FolderHeart className="text-secondary" size={24} />
                        <h2 className="text-xl font-semibold text-text">Save to Collection</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                        <X size={20} className="text-text-muted" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-4 mb-6">
                    <p className="text-sm text-text-muted">Choose a collection to save this outfit:</p>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {collections.length === 0 && !isLoading ? (
                            <p className="text-center py-4 text-text-muted text-sm italic">No collections yet. Create your first one below!</p>
                        ) : (
                            collections.map((coll) => (
                                <button
                                    key={coll._id}
                                    onClick={() => setSelectedCollectionId(coll._id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                                        selectedCollectionId === coll._id 
                                        ? 'bg-secondary/20 border-secondary text-text shadow-[0_0_15px_rgba(var(--secondary-rgb),0.3)]' 
                                        : 'bg-white/5 border-white/10 text-text-muted hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <span className="font-medium">{coll.name}</span>
                                    {selectedCollectionId === coll._id && <Check size={18} className="text-secondary" />}
                                </button>
                            ))
                        )}
                    </div>

                    <form onSubmit={handleCreateCollection} className="flex gap-2">
                        <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="New collection name..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-text focus:outline-none focus:border-secondary transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!newCollectionName.trim() || isCreating}
                            className="p-2 bg-secondary/20 border border-secondary/30 rounded-xl text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-50"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                        </button>
                    </form>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-text-muted hover:bg-white/5 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!selectedCollectionId || isLoading}
                        onClick={handleAddToCollection}
                        className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary-dark rounded-xl text-white font-semibold shadow-lg shadow-secondary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin text-white" size={18} /> : 'Save Outfit'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddToCollectionModal;
