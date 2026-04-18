import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring
} from 'framer-motion';
import {
  Zap, ArrowRight, Database, Command,
  Layers, Palette, Terminal, Search
} from 'lucide-react';
import { useRef } from 'react';
import { NeuralButton, NeuralCard, NeuralBadge } from '../components/NeuralUI';

export default function Home() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  // 🔥 smooth physics (key upgrade)
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.35
  });

  const heroScale = useTransform(smooth, [0, 0.2], [1, 0.95]);
  const heroOpacity = useTransform(smooth, [0, 0.25], [1, 0]);
  const glowY = useTransform(smooth, [0, 1], [0, -150]);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full flex flex-col items-center bg-transparent"
    >

      {/* ================= HERO ================= */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center pt-32 pb-24 px-4 overflow-hidden">

        {/* dynamic glow */}
        <motion.div
          style={{ y: glowY }}
          className="absolute w-[700px] h-[700px] bg-primary/5 rounded-full blur-[140px] -z-10"
        />

        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="w-full max-w-7xl mx-auto text-center z-10"
        >
          <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black tracking-tighter mb-6 leading-[0.85] text-text">
            NEURAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-azure to-accent bg-[length:200%_auto] animate-gradient-x italic">
              WARDROBE.
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.85, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-2xl text-text-muted mb-16 leading-relaxed max-w-4xl mx-auto font-medium uppercase tracking-[0.15em]"
          >
            Hyper-personalized style orchestration powered by recursive visual analysis.
          </motion.p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/register">
              <NeuralButton variant="primary" size="lg" icon={ArrowRight}>
                INITIALIZE CONNECTION
              </NeuralButton>
            </Link>

            <Link to="/login">
              <NeuralButton variant="secondary" size="lg" icon={Command}>
                SYSTEM ACCESS
              </NeuralButton>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ================= INTERFACE ================= */}
      <section className="w-full max-w-7xl mx-auto px-4 py-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true }}
          className="w-full relative group"
        >
          <NeuralCard className="overflow-hidden p-0 border-border-subtle shadow-2xl">

            <div className="grid lg:grid-cols-12 min-h-[600px]">

              {/* LEFT PANEL */}
              <div className="lg:col-span-4 border-r border-border-subtle bg-card p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 text-primary mb-12">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Database className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">
                      Metadata_Stream
                    </span>
                  </div>

                  <h3 className="text-4xl font-black mb-8 tracking-tight leading-none text-text">
                    Dynamic <br />
                    <span className="text-primary italic font-serif">
                      Aesthetics.
                    </span>
                  </h3>

                  {/* BENTO GRID */}
                  <div className="grid grid-cols-2 gap-4">

                    {/* BOX 1 */}
                    <motion.div
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="col-span-2 p-4 rounded-xl bg-card border border-border-subtle hover:border-primary/20 transition-all duration-300"
                    >
                      <p className="text-[10px] uppercase tracking-[0.3em] text-text-muted/40 mb-2">
                        SYSTEM
                      </p>
                      <p className="text-sm font-semibold text-text">
                        Adaptive wardrobe intelligence syncing with your daily context.
                      </p>
                    </motion.div>

                    {/* BOX 2 */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-card border border-border-subtle hover:border-primary/20 transition-all"
                    >
                      <p className="text-[9px] text-text-muted/40 uppercase tracking-widest mb-2">
                        AI CORE
                      </p>
                      <p className="text-xs text-text/80">
                        Visual learning
                      </p>
                    </motion.div>

                    {/* BOX 3 */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-xl bg-card border border-border-subtle hover:border-primary/20 transition-all"
                    >
                      <p className="text-[9px] text-text-muted/40 uppercase tracking-widest mb-2">
                        ENGINE
                      </p>
                      <p className="text-xs text-text/80">
                        Color synthesis
                      </p>
                    </motion.div>

                    {/* BOX 4 */}
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      className="col-span-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:shadow-[0_0_25px_rgba(0,255,150,0.15)] transition-all"
                    >
                      <p className="text-[9px] uppercase tracking-widest text-primary mb-2">
                        OUTPUT
                      </p>
                      <p className="text-sm font-semibold text-text">
                        Real-time outfit recommendations with contextual awareness.
                      </p>
                    </motion.div>

                  </div>
                </div>
              </div>

              {/* RIGHT PANEL */}
              <div className="lg:col-span-8 relative overflow-hidden bg-darker group">

                {/* image with smoother zoom */}
                <motion.img
                  src="/uploads/wp9337752-dark-neon-wallpapers.JPG"
                  alt="Fashion UI"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-darker via-darker/40 to-transparent" />

                {/* HUD */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute top-10 right-10 flex flex-col items-end gap-3"
                >
                  <div className="px-4 py-2 bg-surface border border-border-subtle rounded-xl text-[10px] font-bold tracking-widest text-primary flex items-center gap-2">
                    <Search className="w-3 h-3" />
                    OBJ_IDENTIFIED
                  </div>
                </motion.div>

                {/* scanning line (SMOOTHER) */}
                <div className="absolute inset-0 pointer-events-none border border-primary/10 m-6 rounded-2xl overflow-hidden">
                  <motion.div
                    animate={{ y: ['0%', '100%'] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent blur-sm"
                  />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-end p-12">
                  <NeuralBadge className="mb-6">
                    CORE_RECOMMENDATION
                  </NeuralBadge>

                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <h4 className="text-6xl font-black tracking-tighter text-text leading-none uppercase italic">
                      CYBER_PUNK <br />
                      NOIR <span className="text-primary">v.2</span>
                    </h4>

                    <NeuralButton variant="primary" size="lg" icon={Zap}>
                      DEPLOY CONFIG
                    </NeuralButton>
                  </div>
                </div>

              </div>
            </div>
          </NeuralCard>
        </motion.div>
      </section>

      {/* ================= FEATURES ================= */}
      <section className="w-full py-40 border-t border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-10">

          <FeatureItem icon={<Layers />} title="Semantic Archetyping" />
          <FeatureItem icon={<Palette />} title="Chroma Engineering" />
          <FeatureItem icon={<Terminal />} title="Predictive Logic" />

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="w-full py-20 border-t border-border-subtle text-center text-text-muted/40 text-xs tracking-widest">
        © 2026 CLOTHIFY
      </footer>
    </div>
  );
}

/* ================= FEATURE ================= */

function FeatureItem({ icon, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <NeuralCard className="p-10 border-border-subtle hover:border-primary/30 transition-all duration-500">

        <motion.div
          className="mb-8 text-text-muted group-hover:text-primary"
          whileHover={{ scale: 1.15 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {icon}
        </motion.div>

        <h3 className="text-2xl font-black text-text">
          {title}
        </h3>

      </NeuralCard>
    </motion.div>
  );
}