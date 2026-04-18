"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageSectionProps {
  children: ReactNode;
  className?: string;
  background?: "base" | "surface" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  id?: string;
}

const bgMap = {
  base: "var(--bg-base)",
  surface: "var(--bg-surface)",
  elevated: "var(--bg-elevated)",
};

const paddingMap = {
  none: "0",
  sm: "var(--space-8) 0",
  md: "var(--space-10) 0",
  lg: "var(--space-12) 0",
};

export function PageSection({ children, className = "", background = "base", padding = "md", id }: PageSectionProps) {
  return (
    <section
      id={id}
      className={className}
      style={{
        backgroundColor: bgMap[background],
        padding: paddingMap[padding],
      }}
    >
      <div className="container-premium">{children}</div>
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, centered = true, action, className = "" }: PageHeaderProps) {
  return (
    <motion.div
      className={`mb-10 ${centered ? "text-center" : ""} ${className}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1
        className="text-3xl font-bold mb-3"
        style={{
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.02em",
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className="text-base max-w-xl mx-auto"
          style={{
            fontFamily: "var(--font-body)",
            color: "var(--text-tertiary)",
            lineHeight: 1.7,
          }}
        >
          {subtitle}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  centered?: boolean;
}

export function SectionHeader({ title, subtitle, action, centered = false }: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="text-sm mt-1 max-w-lg"
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-tertiary)",
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
