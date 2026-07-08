"use client";

import { useEffect, useRef, useState } from "react";
import {
  Monitor,
  Clock,
  Calendar,
  CalendarCheck,
  Users,
} from "@phosphor-icons/react";

interface StatsCardsProps {
  totalInstances: number;
  active1h: number;
  active24h: number;
  active7d: number;
  totalRunning: number;
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const duration = 800;

    function step(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  delay,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <div
      className="group relative flex-1 min-w-[160px] border border-border p-5 md:p-6 transition-colors duration-150 hover:border-muted-foreground/30"
      style={{
        animation: `fade-in-up 0.5s cubic-bezier(0.25, 0, 0, 1) ${delay}s both`,
      }}
    >
      {/* Accent bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent/0 group-hover:bg-accent transition-colors duration-150" />

      {/* Icon - subtle */}
      <div className="absolute bottom-3 right-3 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors duration-150">
        <Icon size={20} weight="regular" />
      </div>

      {/* Label - mono uppercase */}
      <div className="label-mono text-muted-foreground mb-2">
        {label}
      </div>

      {/* Value - bold heading */}
      <div className="stat-value text-foreground">
        <AnimatedCounter value={value} />
      </div>
    </div>
  );
}

export function StatsCards({
  totalInstances,
  active1h,
  active24h,
  active7d,
  totalRunning,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-border">
      <StatCard label="Total Instances" value={totalInstances} icon={Monitor} delay={0} />
      <StatCard label="Active (1h)" value={active1h} icon={Clock} delay={0.04} />
      <StatCard label="Active (24h)" value={active24h} icon={Calendar} delay={0.08} />
      <StatCard label="Active (7d)" value={active7d} icon={CalendarCheck} delay={0.12} />
      <StatCard label="Running Accounts" value={totalRunning} icon={Users} delay={0.16} />
    </div>
  );
}
