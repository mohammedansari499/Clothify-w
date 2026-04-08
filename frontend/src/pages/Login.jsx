import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Shirt } from 'lucide-react';

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
    <div className="flex-1 flex items-center justify-center px-4 py-20 bg-darker relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md bg-card/40 backdrop-blur-2xl p-10 rounded-[2rem] border border-border-subtle shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-8 border border-primary/20">
            <Shirt className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-4xl font-black mb-3 tracking-tighter text-text">Welcome Back</h2>
          <p className="text-text-muted mb-10 font-medium">Elevate your style with Clothify.</p>

          {error && (
            <div className="p-4 mb-8 bg-error/10 border border-error/20 text-error rounded-2xl text-sm font-medium animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-text-muted ml-1 uppercase tracking-widest">Email Address</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  className="w-full px-6 py-4 bg-darker/50 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder:text-text-muted/50 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-text-muted ml-1 uppercase tracking-widest">Password</label>
                <Link to="#" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <input 
                  type="password" 
                  required
                  className="w-full px-6 py-4 bg-darker/50 border border-border-subtle rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-text placeholder:text-text-muted/50 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <button 
              disabled={loading}
              className="w-full py-4.5 bg-primary text-darker font-black text-lg rounded-2xl hover:bg-primary-hover active:scale-[0.98] transition-all disabled:opacity-50 mt-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-darker/30 border-t-darker rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {hasGoogleAuth && (
            <>
              <div className="mt-10 flex items-center gap-4">
                <div className="flex-1 h-px bg-border-subtle" />
                <span className="text-[10px] font-black text-text-muted/50 uppercase tracking-[0.2em]">or continue with</span>
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
            <div className="mt-6 text-xs text-text-muted/70">
              Google sign-in is disabled until <code>VITE_GOOGLE_CLIENT_ID</code> is set.
            </div>
          )}

          <p className="mt-10 text-center text-sm font-medium text-text-muted">
            New to Clothify? <Link to="/register" className="text-primary font-bold hover:underline decoration-2 underline-offset-4">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
