import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiUser, FiMail, FiMapPin, FiBriefcase, FiPhone, FiEdit2, 
  FiCheck, FiX, FiActivity, FiTag, FiCamera 
} from "react-icons/fi";

const Profile = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    username: "",
    bio: "",
    phone: "",
    occupation: "",
    location: { city: "", state: "", country: "" },
    stylePreference: []
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        displayName: user.displayName || "",
        username: user.username || "",
        bio: user.bio || "",
        phone: user.phone || "",
        occupation: user.occupation || "",
        location: user.location || { city: "", state: "", country: "" },
        stylePreference: user.stylePreference || []
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes("location.")) {
      const field = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [field]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStyleToggle = (style) => {
    setFormData(prev => {
      const current = prev.stylePreference;
      if (current.includes(style)) {
        return { ...prev, stylePreference: current.filter(s => s !== style) };
      } else {
        return { ...prev, stylePreference: [...current, style] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await updateProfile(formData);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  const styleOptions = ["Minimalist", "Bohemian", "Vintage", "Streetwear", "Formal", "Casual", "Eclectic"];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-surface to-background">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header Banner */}
          <div className="h-48 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 relative">
            <div className="absolute inset-0 bg-grid-white/[0.05]" />
          </div>

          <div className="px-8 pb-8">
            {/* Profile Picture & Main Info */}
            <div className="relative -mt-20 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
              <div className="relative group">
                <div className="w-40 h-40 rounded-3xl overflow-hidden border-4 border-[#0f172a] bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-6xl shadow-xl">
                  {user?.picture ? (
                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser className="text-text/80" />
                  )}
                </div>
                {isEditing && (
                  <button className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                    <FiCamera className="text-text text-2xl" />
                  </button>
                )}
              </div>

              <div className="flex-1 text-center md:text-left pt-4">
                <h1 className="text-4xl font-bold text-text mb-2">
                  {user?.name || "Member"}
                </h1>
                <p className="text-text-muted flex items-center justify-center md:justify-start gap-2">
                  <FiMail className="text-indigo-400" /> {user?.email}
                </p>
                {user?.username && (
                  <p className="text-indigo-400 mt-1 font-mono">@{user.username}</p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 font-medium ${
                    isEditing 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-indigo-600 text-text hover:bg-indigo-500 shadow-lg shadow-indigo-500/20"
                  }`}
                >
                  {isEditing ? <><FiX /> Cancel</> : <><FiEdit2 /> Edit Profile</>}
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isEditing ? (
                <motion.form 
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text/90 border-b border-white/10 pb-2">Basic Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono"
                            placeholder="johndoe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Bio</label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            rows="4"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Professional & Contact */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-text/90 border-b border-white/10 pb-2">Details & Contact</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Occupation</label>
                          <div className="relative">
                            <FiBriefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                              type="text"
                              name="occupation"
                              value={formData.occupation}
                              onChange={handleChange}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              placeholder="Fashion Designer"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-muted mb-1">Phone Number</label>
                          <div className="relative">
                            <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              placeholder="+1 234 567 890"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">City</label>
                            <input
                              type="text"
                              name="location.city"
                              value={formData.location.city}
                              onChange={handleChange}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-text-muted mb-1">Country</label>
                            <input
                              type="text"
                              name="location.country"
                              value={formData.location.country}
                              onChange={handleChange}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                              placeholder="USA"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Style Preferences */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-semibold text-text/90 border-b border-white/10 pb-2">Style Preferences</h3>
                    <div className="flex flex-wrap gap-3">
                      {styleOptions.map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleStyleToggle(option)}
                          className={`px-4 py-2 rounded-full border transition-all duration-300 ${
                            formData.stylePreference.includes(option)
                            ? "bg-indigo-600 border-indigo-500 text-text shadow-lg shadow-indigo-600/20"
                            : "bg-white/5 border-white/10 text-text-muted hover:border-indigo-500/50"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-text px-8 py-3 rounded-2xl font-bold hover:shadow-xl hover:shadow-indigo-500/20 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <><FiCheck /> Save Changes</>
                      )}
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div 
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-12"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left: Bio & Stats */}
                    <div className="md:col-span-2 space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold text-text mb-4 flex items-center gap-2">
                          <FiActivity className="text-indigo-400" /> About
                        </h3>
                        <p className="text-text-muted leading-relaxed text-lg italic">
                          "{user?.bio || "No bio added yet. Tell the world about your style journey!"}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                          <span className="block text-2xl font-bold text-text mb-1">24</span>
                          <span className="text-sm text-text-muted uppercase tracking-wider">Outfits</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                          <span className="block text-2xl font-bold text-text mb-1">128</span>
                          <span className="text-sm text-text-muted uppercase tracking-wider">Items</span>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                          <span className="block text-2xl font-bold text-text mb-1">12</span>
                          <span className="text-sm text-text-muted uppercase tracking-wider">Collections</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Details */}
                    <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-background shadow-inner border border-white/5">
                        <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Identity</h4>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-text-muted">
                            <FiMapPin className="text-indigo-500" />
                            <span>{user?.location?.city ? `${user.location.city}, ${user.location.country}` : "Location not set"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-text-muted">
                            <FiBriefcase className="text-indigo-500" />
                            <span>{user?.occupation || "Profession not set"}</span>
                          </div>
                          <div className="flex items-center gap-3 text-text-muted">
                            <FiPhone className="text-indigo-500" />
                            <span>{user?.phone || "Phone not set"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-background shadow-inner border border-white/5">
                        <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-4">Style DNA</h4>
                        <div className="flex flex-wrap gap-2">
                          {user?.stylePreference?.length > 0 ? (
                            user.stylePreference.map(style => (
                              <span key={style} className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm">
                                {style}
                              </span>
                            ))
                          ) : (
                            <span className="text-text-muted italic text-sm">No preferences set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Success Notification */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 right-8 bg-green-500 text-text px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 z-50"
            >
              <FiCheck className="text-2xl" />
              <span className="font-bold">Profile updated successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
