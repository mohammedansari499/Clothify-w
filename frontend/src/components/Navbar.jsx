import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Shirt } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-darker/60 backdrop-blur-xl border-b border-white/5 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shirt className="w-8 h-8 text-primary" />
            <span className="font-bold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Clothify</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/wardrobe" className="text-gray-300 hover:text-white transition-colors">Wardrobe</Link>
                <Link to="/planner" className="text-gray-300 hover:text-white transition-colors">Planner</Link>
                <div className="h-4 w-px bg-gray-700" />
                <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-white transition-colors">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="bg-primary hover:bg-primary/90 text-darker px-4 py-2 rounded-lg font-medium transition-colors">Get Started</Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-300">
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-darker border-t border-white/5 px-4 pt-2 pb-4 space-y-2 shadow-2xl">
          {user ? (
            <>
              <Link to="/wardrobe" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md">Wardrobe</Link>
              <Link to="/planner" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md">Planner</Link>
              <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-md">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-md">Sign In</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-primary hover:bg-white/5 rounded-md">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
