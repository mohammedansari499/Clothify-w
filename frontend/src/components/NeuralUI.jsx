import { motion } from 'framer-motion';

export const NeuralButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) => {

  const baseStyles =
    "px-5 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 font-display relative overflow-hidden group cursor-pointer";

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-sm"
  };

  const variants = {
    primary:
      "bg-primary text-background shadow-sm hover:shadow-md hover:shadow-primary/20 hover:scale-[1.02] border border-primary/20",

    secondary:
      "bg-surface border border-border-subtle text-text hover:border-primary/30 hover:scale-[1.02]",

    glass:
      "bg-surface shadow-sm border border-border-subtle text-text hover:border-primary/50 hover:shadow-md",

    outline:
      "bg-transparent border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary",

    ghost:
      "text-text-muted hover:text-text hover:bg-surface"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>

      {Icon && (
        <Icon className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </motion.button>
  );
};

export const NeuralCard = ({ children, className = '', glow = false, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-surface shadow-sm border border-border-subtle hover:border-primary/30 hover:shadow-md transition-all rounded-2xl overflow-hidden ${glow ? 'shadow-primary/10' : ''} ${className}`}
    >
      <div className="relative z-10 h-full">
        {children}
      </div>
    </motion.div>
  );
};

export const NeuralInput = ({ className = '', ...props }) => {
  return (
    <input
      className={`w-full bg-card border border-border-subtle rounded-xl px-4 py-3 text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:bg-card transition-all duration-300 ${className}`}
      {...props}
    />
  );
};

export const NeuralBadge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: "bg-card text-text-muted border border-border-subtle",
    primary: "bg-primary/10 text-primary border border-primary/20",
    secondary: "bg-secondary/10 text-secondary border border-secondary/20"
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
