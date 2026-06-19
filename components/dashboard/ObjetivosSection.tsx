"use client";

import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ObjetivoConProgreso } from "@/hooks/useDashboard";
import { useData } from "@/contexts/DataContext";

interface Props {
  objetivos: ObjetivoConProgreso[];
  singleAgente?: boolean;
}

function fmtMonto(n: number, moneda: string) {
  if (moneda === "ARS") {
    return n >= 1000000
      ? `$${(n / 1000000).toFixed(1)}M`
      : n >= 1000
      ? `$${(n / 1000).toFixed(0)}k`
      : `$${n}`;
  }
  return n >= 1000 ? `USD ${(n / 1000).toFixed(1)}k` : `USD ${n}`;
}

function ProgressBar({
  actual,
  meta,
  colorClass,
}: {
  actual: number;
  meta: number;
  colorClass: string;
}) {
  const pct = meta > 0 ? Math.min((actual / meta) * 100, 100) : 0;
  return (
    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", colorClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ObjetivoCard({ objetivo, nombre }: { objetivo: ObjetivoConProgreso; nombre: string }) {
  const montoPct =
    objetivo.metaMonto > 0
      ? Math.min(Math.round((objetivo.montoActual / objetivo.metaMonto) * 100), 150)
      : 0;
  const reservasPct =
    objetivo.metaReservas && objetivo.metaReservas > 0
      ? Math.min(Math.round((objetivo.reservasActuales / objetivo.metaReservas) * 100), 150)
      : 0;

  const superado = montoPct >= 100;

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm p-4 flex flex-col gap-3",
        superado ? "border-emerald-200 bg-emerald-50/50" : "border-neutral-100 bg-white"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">{nombre}</span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            superado
              ? "bg-emerald-100 text-emerald-700"
              : montoPct >= 70
              ? "bg-blue-50 text-blue-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          {montoPct}%
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Ingresos</span>
          <span className="font-medium text-neutral-700">
            {fmtMonto(objetivo.montoActual, objetivo.moneda)}{" "}
            <span className="text-neutral-400">/ {fmtMonto(objetivo.metaMonto, objetivo.moneda)}</span>
          </span>
        </div>
        <ProgressBar
          actual={objetivo.montoActual}
          meta={objetivo.metaMonto}
          colorClass={superado ? "bg-emerald-500" : montoPct >= 70 ? "bg-blue-500" : "bg-amber-400"}
        />
      </div>

      {objetivo.metaReservas != null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Reservas</span>
            <span className="font-medium text-neutral-700">
              {objetivo.reservasActuales}
              <span className="text-neutral-400"> / {objetivo.metaReservas}</span>
            </span>
          </div>
          <ProgressBar
            actual={objetivo.reservasActuales}
            meta={objetivo.metaReservas}
            colorClass={
              reservasPct >= 100 ? "bg-emerald-500" : reservasPct >= 70 ? "bg-blue-500" : "bg-amber-400"
            }
          />
        </div>
      )}
    </div>
  );
}

export function ObjetivosSection({ objetivos, singleAgente = false }: Props) {
  const { usuarios } = useData();

  if (objetivos.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-neutral-400" />
        <h3 className="text-sm font-semibold text-neutral-800">
          {singleAgente ? "Mi objetivo de mayo" : "Objetivos de mayo"}
        </h3>
      </div>

      <div
        className={cn(
          "grid gap-3",
          singleAgente ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {objetivos.map((obj) => {
          const usuario = usuarios.find((u) => u.id === obj.agenteId);
          const nombre = usuario ? `${usuario.nombre} ${usuario.apellido}` : obj.descripcion;
          return <ObjetivoCard key={obj.id} objetivo={obj} nombre={nombre} />;
        })}
      </div>
    </div>
  );
}
