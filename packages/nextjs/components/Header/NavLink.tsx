import Link from "next/link";
import { motion } from "framer-motion";

export const NavLink = ({
  href,
  children,
  active = false,
  icon,
  iconOnly = false,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
  iconOnly?: boolean;
}) => {
  return (
    <Link
      href={href}
      className={`group flex items-center ${iconOnly ? "p-2" : "px-3 py-2"} rounded-lg font-medium text-sm transition-colors duration-150`}
    >
      <span
        className={`
          flex items-center gap-2 transition-all duration-150
          ${active ? "text-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}
        `}
      >
        {icon && (
          <span
            className={
              active ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
            }
          >
            {icon}
          </span>
        )}
        {!iconOnly && <span>{children}</span>}
      </span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
          style={{ backgroundColor: "var(--accent)" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </Link>
  );
};

export const MobileNavLink = ({
  href,
  children,
  active = false,
  icon,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}) => {
  return (
    <Link href={href}>
      <div
        className={`
          px-4 py-3 rounded-lg font-medium flex items-center gap-3 text-sm transition-colors duration-150
          ${active ? "text-[var(--accent)] bg-[var(--accent-muted)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"}
        `}
      >
        {icon && <span className={active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}>{icon}</span>}
        <span>{children}</span>
      </div>
    </Link>
  );
};
