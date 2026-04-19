export default function GlassCard({ children, className = "" }) {
    return (
        <div
            className={`
        bg-white/5 backdrop-blur-xl
        border border-white/10
        rounded-2xl
        shadow-[0_10px_40px_rgba(0,0,0,0.4)]
        ${className}
      `}
        >
            {children}
        </div>
    );
}