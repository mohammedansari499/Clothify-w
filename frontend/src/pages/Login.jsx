import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Shirt, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const hasGoogleAuth = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/wardrobe');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
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
      setError(err.response?.data?.error || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 bg-background relative overflow-hidden">
      {/* Dynamic background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-card backdrop-blur-xl p-6 md:p-7 rounded-[2.5rem] border border-border-subtle shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Accent glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5 border border-primary/20 shadow-inner"
            >
              <Shirt className="w-8 h-8 text-primary" />
            </motion.div>

            <h2 className="text-4xl font-black mb-2 tracking-tighter text-text">Welcome Back</h2>
            <p className="text-text-muted mb-6 font-medium">Elevate your personal style with Clothify.</p>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 mb-5 bg-error/10 border border-error/20 text-error rounded-2xl text-sm font-medium flex items-center gap-3 overflow-hidden"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">Email Address</label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-primary transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-14 pr-6 py-3.5 bg-card border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text placeholder:text-text-muted/30 transition-all font-medium backdrop-blur-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black text-text-muted/70 ml-1 uppercase tracking-[0.2em]">Password</label>
                  <Link to="#" className="text-[10px] font-black text-primary hover:text-primary-hover transition-colors uppercase tracking-widest">Forgot?</Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/50 group-focus-within:text-primary transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full pl-14 pr-6 py-3.5 bg-card border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 text-text placeholder:text-text-muted/30 transition-all font-medium backdrop-blur-md"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full py-3.5 bg-primary text-background font-black text-lg rounded-2xl hover:bg-primary-hover transition-all disabled:opacity-50 mt-8 shadow-lg hover:shadow-lg flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {hasGoogleAuth && (
              <>
                <div className="mt-10 flex items-center gap-4">
                  <div className="flex-1 h-px bg-border-subtle" />
                  <span className="text-[10px] font-black text-text-muted/40 uppercase tracking-[0.3em]">Or Continue With</span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="w-full relative theme-google-login">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google login failed')}
                      theme="outline"
                      size="large"
                      shape="pill"
                      width="100%"
                      text="signin_with"
                    />
                  </div>
                </div>
              </>
            )}

            {!hasGoogleAuth && (
              <div className="mt-8 p-3 bg-darker/50 rounded-xl border border-border-subtle text-center">
                <p className="text-[10px] text-text-muted/50 font-bold uppercase tracking-widest leading-relaxed">
                  Google Sign-In is unavailable
                </p>
              </div>
            )}

            <p className="mt-10 text-center text-sm font-medium text-text-muted">
              New to Clothify? <Link to="/register" className="text-primary font-bold hover:text-primary-hover transition-colors underline decoration-primary/30 underline-offset-8 decoration-2 hover:decoration-primary">Create an account</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
