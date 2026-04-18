import { Link } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Layers,
  Palette,
  Zap,
  Star,
  ShoppingBag,
  Wind,
  ChevronDown,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { NeuralButton, NeuralCard, NeuralBadge } from '../components/NeuralUI';

/* ─── tiny utility ──────────────────────────────────── */
function useInView(ref, threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return visible;
}

/* ─── stagger container ─────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};

/* ═══════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════ */
export default function Home() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20, mass: 0.3 });

  const heroY = useTransform(smooth, [0, 0.35], [0, -60]);
  const heroOpacity = useTransform(smooth, [0, 0.3], [1, 0]);
  const heroScale = useTransform(smooth, [0, 0.25], [1, 0.96]);
  const blob1Y = useTransform(smooth, [0, 1], [0, -180]);
  const blob2Y = useTransform(smooth, [0, 1], [0, -100]);

  /* scroll-cue fades out after first scroll */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const unsub = scrollYProgress.on('change', v => { if (v > 0.02) setScrolled(true); });
    return unsub;
  }, [scrollYProgress]);

  return (
    <div ref={containerRef} className="flex-1 w-full flex flex-col items-center bg-transparent overflow-x-hidden">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative w-full min-h-[80vh] flex flex-col items-center justify-center px-4 pt-20 pb-12 overflow-hidden">

        {/* ambient blobs (same language as Login) */}
        <motion.div style={{ y: blob1Y }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.18, 0.28, 0.18] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[130px] -z-10 pointer-events-none"
        />
        <motion.div style={{ y: blob2Y }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"
        />

        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="w-full max-w-5xl mx-auto text-center z-10"
        >
          {/* eyebrow badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-card border border-border-subtle mb-10 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-text-muted">
              AI-Powered Style OS
            </span>
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-5 leading-[1] text-text"
          >
            Dress like<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-azure to-accent bg-[length:200%_auto] animate-gradient-x italic">
              yourself.
            </span>
          </motion.h1>

          {/* subhead */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="text-sm md:text-lg text-text-muted mb-10 leading-relaxed max-w-xl mx-auto font-medium"
          >
            Clothify learns your unique aesthetic, curates outfits from your wardrobe,
            and helps you show up as the best version of you — every single day.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to="/register">
              <NeuralButton variant="primary" size="lg" icon={ArrowRight}>
                Get Started — it's free
              </NeuralButton>
            </Link>
            <Link to="/login">
              <NeuralButton variant="secondary" size="lg">
                Sign In
              </NeuralButton>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════ SHOWCASE CARD ══════════════ */}
      <Section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* card matches Login's rounded-[2.5rem] + border-border-subtle style */}
          <div className="bg-card backdrop-blur-xl rounded-[2.5rem] border border-border-subtle shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden relative">

            {/* accent glow (same as Login) */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="grid lg:grid-cols-2 min-h-[520px]">

              {/* left: copy */}
              <div className="relative z-10 p-10 md:p-14 flex flex-col justify-center">
                <NeuralBadge className="mb-6 self-start">Live Recommendation</NeuralBadge>

                <h2 className="text-5xl font-black tracking-tighter leading-none mb-6 text-text">
                  Your outfit,<br />
                  <span className="text-primary italic font-serif">decided.</span>
                </h2>

                <p className="text-text-muted leading-relaxed mb-10 max-w-sm text-base font-medium">
                  Tell us the vibe, the weather, the occasion — Clothify handles the rest,
                  pulling from pieces you already own and love.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-10">
                  {[
                    { label: 'Smart Matching', sub: 'Color & fabric harmony' },
                    { label: 'Context Aware', sub: 'Weather + occasion fit' },
                    { label: 'Your Style DNA', sub: 'Learns over time' },
                    { label: 'Zero Waste', sub: 'Love what you own' },
                  ].map(({ label, sub }, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ type: 'spring', stiffness: 220 }}
                      className="p-4 rounded-2xl bg-card border border-border-subtle hover:border-primary/25 transition-all duration-300"
                    >
                      <p className="text-xs font-black text-text mb-1">{label}</p>
                      <p className="text-[11px] text-text-muted/60">{sub}</p>
                    </motion.div>
                  ))}
                </div>

                <Link to="/register">
                  <NeuralButton variant="primary" icon={Zap}>
                    Build My Wardrobe
                  </NeuralButton>
                </Link>
              </div>

              {/* right: visual panel */}
              <div className="relative overflow-hidden bg-darker rounded-r-[2.5rem]">
                <motion.img
                  src="/uploads/wp9337752-dark-neon-wallpapers.JPG"
                  alt="Style preview"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-darker via-darker/30 to-transparent" />

                {/* scanning line */}
                <div className="absolute inset-0 pointer-events-none border border-primary/10 m-5 rounded-2xl overflow-hidden">
                  <motion.div
                    animate={{ y: ['0%', '100%'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm"
                  />
                </div>

                {/* floating HUD chips */}
                <div className="relative z-10 h-full flex flex-col justify-between p-8">
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    viewport={{ once: true }}
                    className="self-end flex flex-col gap-2 items-end"
                  >
                    <Chip>🌤 19°C · Casual</Chip>
                    <Chip>Analyzing fit…</Chip>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    viewport={{ once: true }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-2">Recommended</p>
                    <h3 className="text-5xl font-black tracking-tighter text-text italic leading-none">
                      Linen<br />Summer <span className="text-primary">Edit</span>
                    </h3>
                  </motion.div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </Section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <Section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <SectionLabel>How Clothify Works</SectionLabel>
        <SectionHeading>Three steps to<br /><em>your best look.</em></SectionHeading>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            {
              num: '01',
              icon: <ShoppingBag className="w-6 h-6" />,
              title: 'Upload your wardrobe',
              body: "Snap or upload photos of your clothes. Clothify catalogs every piece — colors, fabrics, fits — and organizes your closet digitally.",
            },
            {
              num: '02',
              icon: <Sparkles className="w-6 h-6" />,
              title: 'Tell us your vibe',
              body: "Heading to brunch? A big meeting? A first date? Describe the occasion and mood — even just a few words is enough.",
            },
            {
              num: '03',
              icon: <Star className="w-6 h-6" />,
              title: 'Get your outfit',
              body: "Clothify assembles a complete look from pieces you own, explains why it works, and offers alternatives if you want to switch things up.",
            },
          ].map(({ num, icon, title, body }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.13, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              {/* same card style as Login's container */}
              <div className="h-full bg-card backdrop-blur-xl p-8 rounded-[2rem] border border-border-subtle shadow-[0_10px_30px_rgba(0,0,0,0.35)] relative overflow-hidden group hover:border-primary/30 transition-all duration-500">
                <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                      {icon}
                    </div>
                    <span className="text-5xl font-black text-text-muted/10 tracking-tighter select-none">
                      {num}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-text mb-3 tracking-tight">{title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed font-medium">{body}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ══════════════ FEATURE ROW ══════════════ */}
      <Section className="w-full border-t border-border-subtle py-24">
        <div className="max-w-6xl mx-auto px-4">
          <SectionLabel>What's inside</SectionLabel>
          <SectionHeading>Everything you<br /><em>didn't know you needed.</em></SectionHeading>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon={<Layers />}
              title="Style Archetypes"
              body="Clothify maps your taste across 40+ aesthetic archetypes — from quiet luxury to coastal grandma — and keeps learning."
            />
            <FeatureCard
              icon={<Palette />}
              title="Chroma Harmony"
              body="A color-theory engine ensures every combination you wear is balanced, intentional, and flatters your personal palette."
            />
            <FeatureCard
              icon={<Wind />}
              title="Context Intelligence"
              body="Weather, events, and even your calendar sync with Clothify so recommendations are always relevant to your actual day."
            />
          </div>
        </div>
      </Section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <Section className="w-full max-w-6xl mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          viewport={{ once: true, amount: 0.3 }}
          className="relative bg-card backdrop-blur-xl rounded-[2.5rem] border border-border-subtle shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden px-10 md:px-20 py-20 text-center"
        >
          {/* blobs inside the card */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-purple-500/5 blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              viewport={{ once: true }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-8 border border-primary/20 shadow-inner"
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>

            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-5 text-text leading-tight">
              Ready to open<br />
              <span className="text-primary italic">your wardrobe?</span>
            </h2>

            <p className="text-text-muted text-base md:text-lg font-medium mb-10 max-w-xl mx-auto leading-relaxed">
              Join thousands of people who've stopped stressing about what to wear.
              Free forever, no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <NeuralButton variant="primary" size="lg">
                  Create Free Account
                </NeuralButton>
              </Link>
              <Link to="/login">
                <NeuralButton variant="secondary" size="lg">
                  I already have an account
                </NeuralButton>
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="w-full py-16 border-t border-border-subtle text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-text-muted/35">
          © 2026 Clothify — wear yourself
        </p>
      </footer>

    </div>
  );
}

/* ─── layout helpers ────────────────────────────────── */

function Section({ children, className = '' }) {
  return <section className={`w-full ${className}`}>{children}</section>;
}

function SectionLabel({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="flex items-center justify-center gap-2 mb-5"
    >
      <div className="h-px w-10 bg-primary/40" />
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80">
        {children}
      </span>
      <div className="h-px w-10 bg-primary/40" />
    </motion.div>
  );
}

function SectionHeading({ children }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      className="text-4xl md:text-6xl font-black tracking-tighter text-text text-center leading-tight [&_em]:text-primary [&_em]:not-italic [&_em]:italic"
    >
      {children}
    </motion.h2>
  );
}

/* floating HUD chip */
function Chip({ children }) {
  return (
    <div className="px-4 py-1.5 bg-card/80 backdrop-blur border border-border-subtle rounded-full text-[10px] font-bold tracking-widest text-text-muted/80">
      {children}
    </div>
  );
}

/* feature card */
function FeatureCard({ icon, title, body }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      viewport={{ once: true, amount: 0.2 }}
      className="group"
    >
      <div className="h-full bg-card backdrop-blur-xl p-8 rounded-[2rem] border border-border-subtle hover:border-primary/30 shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-500 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/10 transition-all duration-700" />

        <div className="relative z-10">
          <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-7 inline-flex group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="text-xl font-black text-text mb-3 tracking-tight">{title}</h3>
          <p className="text-sm text-text-muted leading-relaxed font-medium">{body}</p>
        </div>
      </div>
    </motion.div>
  );
}