import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Zap, Lock, ArrowRight, Shirt } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 w-full overflow-x-hidden flex flex-col items-center bg-darker">
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-40">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 -z-10 translate-x-1/4 -translate-y-1/4">
          <div className="w-[800px] h-[800px] rounded-full bg-primary/10 blur-[160px] animate-pulse-slow" />
        </div>
        <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/4 translate-y-1/4">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px] animate-pulse-slow" style={{ animationDelay: '3s' }} />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-10 border border-primary/20 text-xs font-black uppercase tracking-widest"
          >
            <Sparkles className="w-4 h-4" /> The future of fashion is here
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9] text-text">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-200 to-indigo-400">
              Daily Style
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-muted mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
            Clothify uses cutting-edge AI to organize your wardrobe and curate perfect outfits tailored to your life.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register" className="group w-full sm:w-auto px-10 py-5 bg-primary text-darker font-black text-lg rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 hover:shadow-primary/40 flex items-center justify-center gap-2 active:scale-95">
              Start Your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-10 py-5 bg-card/40 backdrop-blur-xl text-text font-bold text-lg rounded-2xl hover:bg-card/60 transition-all border border-border-subtle hover:border-text-muted/30 flex items-center justify-center active:scale-95">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="w-full bg-darker/50 border-y border-border-subtle py-32 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black tracking-tight text-text mb-4">Intelligent Features</h2>
            <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Shirt />}
              title="Visual Wardrobe"
              desc="Deep-learning based analysis automatically catalogs your clothes by color, texture, and style."
            />
            <FeatureCard 
              icon={<Calendar />}
              title="Calendar Sync"
              desc="Connects to your life. Get outfit suggestions based on weather, location, and event types."
            />
            <FeatureCard 
              icon={<Zap />}
              title="Insta-Style"
              desc="Generate high-fashion combinations in seconds. Look like you have a personal stylist."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-10 rounded-[2.5rem] bg-card/30 backdrop-blur-2xl border border-border-subtle hover:border-primary/40 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8 border border-primary/20 group-hover:scale-110 group-hover:bg-primary group-hover:text-darker transition-all duration-500">
        {icon}
      </div>
      
      <h3 className="text-2xl font-black mb-4 tracking-tight text-text group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-text-muted leading-relaxed font-medium group-hover:text-text transition-colors">{desc}</p>
    </motion.div>
  )
}
