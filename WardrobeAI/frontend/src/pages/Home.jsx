import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, Zap, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 w-full overflow-x-hidden flex flex-col items-center">
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/20 blur-[130px]" />
        </div>
        <div className="absolute top-1/2 left-0 -z-10 -translate-x-1/3 -translate-y-1/2">
          <div className="w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 text-sm font-medium">
            <Sparkles className="w-4 h-4" /> Wait out the "What to wear" blues
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.1]">
            Your Wardrobe, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-teal-200 to-indigo-400 drop-shadow-sm">
              Powered by AI
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
            Clothify organizes your clothes and plans your weekly outfits based on your actual calendar events. Upload a photo, and let AI do the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-primary text-darker font-bold rounded-xl hover:bg-primary/80 transition-all shadow-[0_0_30px_-5px] shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1">
              Start Free Trial
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-md text-white font-medium rounded-xl hover:bg-white/10 transition-all border border-white/10 hover:border-white/20 hover:-translate-y-1">
              Login to Account
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="w-full bg-dark border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap />}
              title="Automated Parsing"
              desc="Drop a photo of your clothes. We automatically extract colors and guess what type of item it is using ML."
            />
            <FeatureCard 
              icon={<Calendar />}
              title="Smart Scheduling"
              desc="Sync your Google Calendar so Clothify knows whether you have a gym day or an important executive meeting."
            />
            <FeatureCard 
              icon={<Lock />}
              title="Outfit Generation"
              desc="Our proprietary algorithm matches styles and colors so you always look your absolute best."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] backdrop-blur-xl border border-white/5 hover:border-primary/30 transition-all duration-300 group hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_rgba(0,255,178,0.1)]">
      <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-6 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-400/90 leading-relaxed text-sm font-inter">{desc}</p>
    </div>
  )
}
