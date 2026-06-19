"use client";

import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AutomatizacionEmail, TipoAutomatizacion } from "@/lib/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<TipoAutomatizacion, string> = {
  bienvenida: "Bienvenida",
  cotizacion: "Cotización",
  recordatorio_pago: "Recordatorio de pago",
  post_viaje: "Post viaje",
  cumpleanios: "Cumpleaños",
};

const TIPO_BADGE_CLASS: Record<TipoAutomatizacion, string> = {
  bienvenida: "bg-blue-100 text-blue-700 border-blue-200",
  cotizacion: "bg-violet-100 text-violet-700 border-violet-200",
  recordatorio_pago: "bg-amber-100 text-amber-700 border-amber-200",
  post_viaje: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cumpleanios: "bg-pink-100 text-pink-700 border-pink-200",
};

// ─── Sub-component ────────────────────────────────────────────────────────────

function AutomatizacionCard({
  item,
  onToggle,
}: {
  item: AutomatizacionEmail;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 flex flex-col gap-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-neutral-900 truncate">
              {item.nombre}
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0.5 border",
                TIPO_BADGE_CLASS[item.tipo]
              )}
            >
              {TIPO_LABEL[item.tipo]}
            </Badge>
          </div>

          <span className="text-sm text-neutral-500 truncate">
            Asunto: <span className="text-neutral-700">{item.asunto}</span>
          </span>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-neutral-500">
            {item.activa ? "Activa" : "Inactiva"}
          </span>
          <Switch
            checked={item.activa}
            onCheckedChange={() => onToggle(item.id)}
          />
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-neutral-500 flex-wrap">
        <span>
          <span className="font-medium text-neutral-700">
            {item.enviosTotales}
          </span>{" "}
          envíos totales
        </span>
        {item.disparadorDias !== undefined && (
          <span>
            Dispara a los{" "}
            <span className="font-medium text-neutral-700">
              {item.disparadorDias}
            </span>{" "}
            días
          </span>
        )}
      </div>

      {/* Body preview toggle */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-blue-600 hover:text-blue-700 px-0 h-auto"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Ocultar vista previa" : "Ver cuerpo del email"}
        </Button>

        {expanded && (
          <div className="mt-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
            {item.cuerpo}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function AutomatizacionesView() {
  const { automatizaciones, toggleAutomatizacion } = useData();
  const { rol } = useRole();

  if (rol !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center p-8">
        <span className="text-4xl">🔒</span>
        <p className="text-lg font-semibold text-neutral-800">
          Acceso restringido
        </p>
        <p className="text-sm text-neutral-500">
          Solo los administradores pueden ver las automatizaciones de email.
        </p>
      </div>
    );
  }

  const activas = automatizaciones.filter((a) => a.activa).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-neutral-900">
          Automatizaciones de Email
        </h1>
        <p className="text-sm text-neutral-500">
          {activas} de {automatizaciones.length} activas
        </p>
      </div>

      {/* Card list */}
      {automatizaciones.length === 0 ? (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-10 text-center text-neutral-500 text-sm">
          No hay automatizaciones configuradas.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {automatizaciones.map((item) => (
            <AutomatizacionCard
              key={item.id}
              item={item}
              onToggle={toggleAutomatizacion}
            />
          ))}
        </div>
      )}
    </div>
  );
}
