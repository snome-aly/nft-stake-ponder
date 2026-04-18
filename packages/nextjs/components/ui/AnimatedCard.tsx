"use client";

import { ReactNode } from "react";
import { Variants, motion } from "framer-motion";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  glow?: "cyan" | "purple" | "pink" | "green" | "yellow";
}

const glowStyles = {
  cyan: "hover:shadow-cyan-500/30",
  purple: "hover:shadow-purple-500/30",
  pink: "hover:shadow-pink-500/30",
  green: "hover:shadow-green-500/30",
  yellow: "hover:shadow-yellow-500/30",
};

const borderStyles = {
  cyan: "hover:border-cyan-500/60",
  purple: "hover:border-purple-500/60",
  pink: "hover:border-pink-500/60",
  green: "hover:border-green-500/60",
  yellow: "hover:border-yellow-500/60",
};

export function AnimatedCard({ children, className = "", delay = 0, glow = "cyan" }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={`
        bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6
        border border-gray-700/50
        transition-all duration-300
        hover:shadow-xl ${glowStyles[glow]} ${borderStyles[glow]}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedSection({ children, className = "" }: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  variants?: Variants;
}

export function StaggerContainer({ children, className = "", staggerDelay = 0.05, variants }: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={
        variants || {
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: staggerDelay,
            },
          },
        }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
