import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Shirt, Cpu, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'WARDROBE', path: '/wardrobe' },
    { name: 'PLANNER', path: '/planner' },
    { name: 'COLLECTIONS', path: '/collections' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border-subtle">
      <div className={`max-w-7xl mx-auto bg-transparent transition-all duration-500 ${scrolled ? 'py-2 px-6 shadow-2xl scale-[0.98]' : 'py-4 px-8'
        }`}>
        <div className="flex items-center justify-between h-12">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative flex items-center justify-center">
              <Shirt className="w-8 h-8 text-primary group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 blur-md rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-xl tracking-tighter text-text">
                CLOTHIFY<span className="text-primary italic">.AI</span>
              </span>
              <span className="text-[8px] text-text-muted tracking-[0.4em] font-medium uppercase -mt-1">
                Neural Core v4.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-10">
            {user ? (
              <>
                <div className="flex items-center gap-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-[10px] tracking-[0.2em] font-bold transition-all relative py-1 hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-text-muted'
                        }`}
                    >
                      {link.name}
                      {location.pathname === link.path && (
                        <motion.div
                          layoutId="nav-glow"
                          className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#00ff88] rounded-full"
                        />
                      )}
                    </Link>
                  ))}
                </div>

                <div className="h-4 w-px bg-border-subtle" />

                <div className="flex items-center gap-2 text-text-muted">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/20 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest text-primary">STABLE</span>
                  </div>
                  <ThemeToggle />
                  <Link to="/profile" className="p-2 hover:bg-primary/10 rounded-lg transition-colors hover:text-text">
                    <User className="w-4 h-4" />
                  </Link>
                  <button onClick={handleLogout} className="p-2 hover:bg-error/10 hover:text-error rounded-lg transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <Link to="/login" className="text-[10px] tracking-widest font-bold text-text-muted hover:text-text transition-colors">LOGIN</Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-primary text-background rounded-xl font-bold text-[10px] tracking-widest hover:shadow-[0_0_20px_#00ff88] transition-all"
                >
                  INITIALIZE
                </Link>
                <ThemeToggle />
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-text-muted hover:text-primary transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="lg:hidden absolute top-full left-4 right-4 mt-2"
          >
            <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
              {user ? (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between text-[10px] tracking-[0.2em] font-bold text-text-muted hover:text-primary transition-all p-3 hover:bg-primary/10"
                    >
                      {link.name}
                      <Cpu className="w-4 h-4 opacity-50" />
                    </Link>
                  ))}
                  <div className="h-px bg-border-subtle mx-2" />
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="text-[10px] tracking-[.2em] font-bold text-text-muted p-3">PROFILE</Link>
                  <button onClick={handleLogout} className="text-[10px] tracking-[.2em] font-bold text-error p-3 text-left">DISCONNECT</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)} className="text-center font-bold text-text tracking-widest py-3 border border-border-subtle rounded-xl hover:bg-primary/10">LOGIN</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="text-center font-bold text-background bg-primary tracking-widest py-3 rounded-xl shadow-[0_0_20px_#00ff88]">INITIALIZE</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
