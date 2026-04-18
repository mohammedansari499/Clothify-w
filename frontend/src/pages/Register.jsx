import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shirt, Mail, Lock, User, AtSign, Phone, 
  Briefcase, MapPin, Tag, ArrowRight, ArrowLeft, 
  Check, Loader2, AlertCircle 
} from 'lucide-react';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    phone: '',
    occupation: '',
    location: { city: '', state: '', country: '' },
    stylePreference: []
  });
  
  const [error, setError] = useState('');
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hasGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const styleOptions = [
    "Minimalist", "Streetwear", "Old Money", "Bohemian", 
    "Vintage", "Avant-Garde", "Preppy", "Grunge", "Business Casual"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleStyle = (style) => {
    setFormData(prev => ({
      ...prev,
      stylePreference: prev.stylePreference.includes(style)
        ? prev.stylePreference.filter(s => s !== style)
        : [...prev.stylePreference, style]
    }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.email || !formData.password)) {
      setError('Please fill in email and password');
      return;
    }
    setError('');
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/wardrobe');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
      if (err.response?.data?.error?.includes('Email') || err.response?.data?.error?.includes('User already exists')) {
        setStep(1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/wardrobe');
    } catch (err) {
      setError(err.response?.data?.error || 'Google sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { title: 'Identity', icon: User },
    { title: 'Social', icon: MapPin },
    { title: 'Style', icon: Tag }
  ];

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center px-4 py-20 bg-darker relative overflow-hidden">
      {/* Background Orbs */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] -z-10" 
      />

      <div className="w-full max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/40 backdrop-blur-3xl p-8 md:p-12 rounded-[3rem] border border-border-subtle shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-12 max-w-md mx-auto relative px-4">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-subtle -translate-y-1/2 -z-10" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <motion.div 
                  animate={{ 
                    backgroundColor: step >= i ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: step >= i ? 'var(--color-darker)' : 'var(--color-text-muted)',
                    scale: step === i ? 1.1 : 1
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all border-2 ${
                    step >= i ? 'border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]' : 'border-border-subtle'
                  }`}
                >
                  {step > i ? <Check className="w-5 h-5" /> : i}
                </motion.div>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 mb-8 bg-error/10 border border-error/20 text-error rounded-2xl text-sm font-bold flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
              >
                <header className="mb-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6 border border-primary/20 shadow-inner">
                    <Shirt className="w-7 h-7 text-primary" />
                  </div>
                  <h2 className="text-4xl font-black mb-2 tracking-tighter text-text">Create Account</h2>
                  <p className="text-text-muted font-medium">Elevate your digital wardrobe experience.</p>
                </header>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-4.5 bg-darker/40 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text placeholder:text-text-muted/30 transition-all font-medium backdrop-blur-md"
                        placeholder="fashion@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-14 pr-6 py-4.5 bg-darker/40 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text placeholder:text-text-muted/30 transition-all font-medium backdrop-blur-md"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    className="w-full py-4.5 bg-primary text-darker font-black text-lg rounded-2xl hover:bg-primary-hover shadow-[0_10px_30px_rgba(var(--primary-rgb),0.3)] flex items-center justify-center gap-3 mt-8 group"
                  >
                    Continue <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  {hasGoogleAuth && (
                    <div className="mt-10">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex-1 h-px bg-border-subtle" />
                        <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Easy Access</span>
                        <div className="flex-1 h-px bg-border-subtle" />
                      </div>
                      <div className="flex justify-center theme-google-login">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError('Google sign-up failed')}
                          theme="outline" size="large" shape="pill" width="100%"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-4xl font-black mb-2 tracking-tighter text-text">Identity</h2>
                  <p className="text-text-muted font-medium">Tell us about the person behind the style.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name', name: 'name', icon: User, placeholder: 'Alexander Queen' },
                    { label: 'Username', name: 'username', icon: AtSign, placeholder: 'alex_style' },
                    { label: 'Phone', name: 'phone', icon: Phone, placeholder: '+1 (555) 000-0000' },
                    { label: 'Occupation', name: 'occupation', icon: Briefcase, placeholder: 'Visual Artist' }
                  ].map((field) => (
                    <div key={field.name} className="space-y-2">
                      <label className="text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">{field.label}</label>
                      <div className="relative group">
                        <field.icon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50 transition-colors" />
                        <input 
                          type="text" 
                          name={field.name}
                          value={formData[field.name]}
                          onChange={handleInputChange}
                          className="w-full pl-14 pr-6 py-4 bg-darker/40 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text font-medium"
                          placeholder={field.placeholder}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4.5 bg-card text-text font-bold rounded-2xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 border border-border-subtle">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-4.5 bg-primary text-darker font-black text-lg rounded-2xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <header>
                  <h2 className="text-4xl font-black mb-2 tracking-tighter text-text">Social Context</h2>
                  <p className="text-text-muted font-medium">Where in the world are you defining trends?</p>
                </header>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {['city', 'country'].map((loc) => (
                      <div key={loc} className="space-y-2">
                        <label className="text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">{loc}</label>
                        <div className="relative group">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50 transition-colors" />
                          <input 
                            type="text" 
                            name={`location.${loc}`}
                            value={formData.location[loc]}
                            onChange={handleInputChange}
                            className="w-full pl-14 pr-6 py-4 bg-darker/40 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text font-medium uppercase tracking-wider"
                            placeholder={loc === 'city' ? 'Paris' : 'France'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    <div className="flex gap-6 items-center relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                        <MapPin className="text-primary w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-text text-lg mb-1">Local Intelligence</h4>
                        <p className="text-sm text-text-muted leading-relaxed">We'll calibrate your recommendations based on local weather patterns and regional style culture.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={prevStep} className="flex-1 py-4.5 bg-card text-text font-bold rounded-2xl hover:bg-primary/10 transition-all flex items-center justify-center gap-2 border border-border-subtle">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </button>
                  <button onClick={nextStep} className="flex-[2] py-4.5 bg-primary text-darker font-black text-lg rounded-2xl hover:bg-primary-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                    Next <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                <header className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 mb-6 border border-primary/20 shadow-inner">
                    <Tag className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-4xl font-black mb-2 tracking-tighter text-text">Style DNA</h2>
                  <p className="text-text-muted font-medium">Select your core aesthetic vibrations.</p>
                </header>

                <div className="flex flex-wrap gap-3 justify-center max-w-lg mx-auto">
                  {styleOptions.map((style) => (
                    <motion.button
                      key={style}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`px-6 py-3 rounded-2xl text-[11px] font-black transition-all duration-300 border-2 uppercase tracking-widest ${
                        formData.stylePreference.includes(style)
                          ? 'bg-primary border-primary text-darker shadow-xl shadow-primary/30'
                          : 'bg-card border-border-subtle text-text-muted hover:border-primary/30'
                      }`}
                    >
                      {style}
                    </motion.button>
                  ))}
                </div>

                <div className="pt-8 space-y-4">
                  <div className="flex gap-4">
                    <button onClick={prevStep} className="flex-1 py-4.5 bg-card text-text font-bold rounded-2xl hover:bg-primary/10 transition-all border border-border-subtle">
                      Back
                    </button>
                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-[2] py-4.5 bg-primary text-darker font-black text-xl rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/40 flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finish Setup <Check className="w-6 h-6" /></>}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-12 text-center text-sm font-medium text-text-muted">
            Already a member? <Link to="/login" className="text-primary font-bold hover:text-primary-hover transition-colors underline decoration-primary/30 underline-offset-8 decoration-2 hover:decoration-primary">Sign in instead</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
