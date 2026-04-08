import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Shirt } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-darker/60 backdrop-blur-xl border-b border-border-subtle shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Shirt className="w-8 h-8 text-primary" />
            <span className="font-bold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-text to-text-muted">Clothify</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/wardrobe" className="text-text-muted hover:text-text transition-colors">Wardrobe</Link>
                <Link to="/planner" className="text-text-muted hover:text-text transition-colors">Planner</Link>
                <Link to="/collections" className="text-text-muted hover:text-text transition-colors">Collections</Link>
                <div className="h-4 w-px bg-border-subtle" />
                <ThemeToggle />
                <button onClick={handleLogout} className="text-sm text-text-muted hover:text-text transition-colors">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-text-muted hover:text-text transition-colors">Sign In</Link>
                <Link to="/register" className="bg-primary hover:bg-primary/90 text-dark px-4 py-2 rounded-lg font-medium transition-colors">Get Started</Link>
                <ThemeToggle />
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button onClick={() => setIsOpen(!isOpen)} className="text-text-muted">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-card border-t border-border-subtle px-4 pt-2 pb-4 space-y-2 shadow-2xl">
          {user ? (
            <>
              <Link to="/wardrobe" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-md">Wardrobe</Link>
              <Link to="/planner" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-md">Planner</Link>
              <Link to="/collections" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-md">Collections</Link>
              <button onClick={() => { handleLogout(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-base font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-md">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-text-muted hover:text-text hover:bg-white/5 rounded-md">Sign In</Link>
              <Link to="/register" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-base font-medium text-primary hover:bg-white/5 rounded-md">Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
