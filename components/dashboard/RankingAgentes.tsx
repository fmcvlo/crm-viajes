"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RankingItem } from "@/hooks/useDashboard";

interface Props {
  items: RankingItem[];
}

const MEDAL_COLORS = ["text-amber-500", "text-neutral-400", "text-orange-600"];

function getInitials(nombre: string, apellido: string) {
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
}

function fmtUSD(n: number) {
  return n >= 1000
    ? `$${(n / 1000).toFixed(1)}k`
    : `$${n}`;
}

interface BarProps {
  pct: number;
}

function ObjetivoBar({ pct }: BarProps) {
  const capped = Math.min(pct, 100);
  const over = pct > 100;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : "bg-amber-400"
          )}
          style={{ width: `${capped}%` }}
        />
      </div>
      <span
        className={cn(
          "text-xs font-medium tabular-nums w-8 text-right",
          over ? "text-emerald-600" : "text-neutral-600"
        )}
      >
        {pct}%
      </span>
    </div>
  );
}

const AVATAR_BG = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
];

export function RankingAgentes({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-neutral-800">Ranking de agentes</h3>
        <span className="text-xs text-neutral-400 ml-auto">Mayo 2025</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left pb-2 pr-3 text-xs font-medium text-neutral-400 w-6">#</th>
              <th className="text-left pb-2 pr-4 text-xs font-medium text-neutral-400">Agente</th>
              <th className="text-right pb-2 px-3 text-xs font-medium text-neutral-400 whitespace-nowrap">Leads activos</th>
              <th className="text-right pb-2 px-3 text-xs font-medium text-neutral-400 whitespace-nowrap">Reservas</th>
              <th className="text-right pb-2 px-3 text-xs font-medium text-neutral-400 whitespace-nowrap">Ingresos</th>
              <th className="text-right pb-2 pl-3 text-xs font-medium text-neutral-400 whitespace-nowrap">Comisión pend.</th>
              <th className="pb-2 pl-4 text-xs font-medium text-neutral-400 whitespace-nowrap">% Objetivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {items.map((item, idx) => (
              <tr
                key={item.agente.id}
                className={cn(
                  "hover:bg-neutral-50 transition-colors",
                  idx === 0 && "bg-amber-50/40"
                )}
              >
                <td className="py-3 pr-3 text-xs font-bold">
                  <span className={cn(MEDAL_COLORS[idx] ?? "text-neutral-400")}>
                    {item.pos}
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0",
                        AVATAR_BG[idx % AVATAR_BG.length]
                      )}
                    >
                      {getInitials(item.agente.nombre, item.agente.apellido)}
                    </div>
                    <span className="font-medium text-neutral-800 whitespace-nowrap">
                      {item.agente.nombre} {item.agente.apellido}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-neutral-700">
                  {item.leadsActivos}
                </td>
                <td className="py-3 px-3 text-right tabular-nums text-neutral-700">
                  {item.reservasAceptadas}
                </td>
                <td className="py-3 px-3 text-right tabular-nums font-semibold text-neutral-900">
                  {fmtUSD(item.ingresoUSD)}
                </td>
                <td className="py-3 pl-3 text-right tabular-nums text-emerald-700 font-medium">
                  {fmtUSD(item.comisionPendienteUSD)}
                </td>
                <td className="py-3 pl-4">
                  <ObjetivoBar pct={item.objetivoPct} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
