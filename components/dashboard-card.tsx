"use client";

import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface DashboardCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  cta: string;
  /** Navigate to a route (use this OR onClick, not both) */
  href?: string;
  /** Run an action instead of navigating (e.g. opening the chat widget) */
  onClick?: () => void;
}

export default function DashboardCard({ icon: Icon, title, desc, href, cta, onClick }: DashboardCardProps) {
  const content = (
    <>
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
          <Icon size={20} />
        </div>
        <h2 className="mt-3 font-display text-lg text-neutral-900">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{desc}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-700">
        {cta}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="card-interactive group flex w-full flex-col justify-between text-left">
        {content}
      </button>
    );
  }

  return (
    <Link href={href ?? "#"} className="card-interactive group flex flex-col justify-between">
      {content}
    </Link>
  );
}
