"use client";

import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Trend = { value: number; label?: string };

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  sublabel?: string;
  trend?: Trend;
  size?: "default" | "lg";
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-blue-600",
  iconBg = "bg-blue-50",
  sublabel,
  trend,
  size = "default",
}: KpiCardProps) {
  const isUp = trend && trend.value > 0;
  const isDown = trend && trend.value < 0;

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
              isUp && "bg-emerald-50 text-emerald-700",
              isDown && "bg-red-50 text-red-700",
              !isUp && !isDown && "bg-neutral-100 text-neutral-500"
            )}
          >
            {isUp ? "▲" : isDown ? "▼" : "—"}
            {Math.abs(trend.value)}
            {trend.label ?? ""}
          </span>
        )}
      </div>

      <div>
        <p
          className={cn(
            "font-bold text-neutral-900 leading-none",
            size === "lg" ? "text-3xl" : "text-2xl"
          )}
        >
          {value}
        </p>
        <p className="text-sm text-neutral-500 mt-1">{label}</p>
        {sublabel && (
          <p className="text-xs text-neutral-400 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
