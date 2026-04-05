import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to register');
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

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white/[0.02] backdrop-blur-2xl p-8 rounded-3xl border border-white/5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <h2 className="text-3xl font-black mb-2 tracking-tight">Create Account</h2>
        <p className="text-gray-400 mb-8 font-inter">Start your AI wardrobe today</p>

        {error && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 text-white transition-all font-inter"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 text-white transition-all font-inter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            disabled={loading}
            className="w-full py-4 bg-primary text-darker font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 mt-6 shadow-[0_0_20px_-5px] shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">or</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign-up failed')}
            theme="filled_black"
            size="large"
            width="100%"
            text="signup_with"
          />
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
