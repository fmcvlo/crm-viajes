"use client";

import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Target,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { useRole } from "@/contexts/RoleContext";
import { KpiCard } from "./KpiCard";
import { EmbudioLeads } from "./EmbudioLeads";
import { ReservasPorMes } from "./ReservasPorMes";
import { RankingAgentes } from "./RankingAgentes";
import { ObjetivosSection } from "./ObjetivosSection";
import { VentaPorProveedor } from "./VentaPorProveedor";

function fmtUSD(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

export function DashboardView() {
  const { rol, usuario } = useRole();
  const { kpis, embudo, reservasPorMes, objetivos, ranking, ventaPorProveedor } = useDashboard();

  const isAdmin = rol === "admin";
  const greeting = `Hola, ${usuario.nombre}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{greeting}</h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          {isAdmin ? "Vista general de la agencia · Mayo 2025" : "Tu cartera · Mayo 2025"}
        </p>
      </div>

      {/* ── KPIs fila 1 ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={isAdmin ? "Leads activos" : "Mis leads activos"}
          value={kpis.leadsActivos}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          sublabel={`${kpis.leadsNuevosEsteMes} nuevos este mes`}
        />
        <KpiCard
          label={isAdmin ? "Reservas aceptadas" : "Mis reservas aceptadas"}
          value={kpis.reservasAceptadas}
          icon={FileText}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <KpiCard
          label={isAdmin ? "Ingresos (estimado)" : "Mis ingresos"}
          value={fmtUSD(kpis.ingresosTotalesUSD)}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          sublabel="Reservas aceptadas"
        />
        <KpiCard
          label={isAdmin ? "Comisiones pendientes" : "Mis comisiones pendientes"}
          value={fmtUSD(kpis.comisionesPendientesUSD)}
          icon={DollarSign}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* ── KPIs fila 2 ───────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="% Objetivo global (mayo)"
            value={`${kpis.objetivoGlobalPct}%`}
            icon={Target}
            iconBg={kpis.objetivoGlobalPct >= 100 ? "bg-emerald-50" : "bg-orange-50"}
            iconColor={kpis.objetivoGlobalPct >= 100 ? "text-emerald-600" : "text-orange-600"}
            sublabel="Promedio de todos los agentes"
          />
          <KpiCard
            label="Leads nuevos este mes"
            value={kpis.leadsNuevosEsteMes}
            icon={PlusCircle}
            iconBg="bg-sky-50"
            iconColor="text-sky-600"
            sublabel={`De ${kpis.leadsActivos} leads activos totales`}
          />
        </div>
      )}

      {!isAdmin && (
        <div className="grid grid-cols-2 gap-4">
          <KpiCard
            label="Mi objetivo (mayo)"
            value={`${kpis.objetivoGlobalPct}%`}
            icon={Target}
            iconBg={kpis.objetivoGlobalPct >= 100 ? "bg-emerald-50" : "bg-orange-50"}
            iconColor={kpis.objetivoGlobalPct >= 100 ? "text-emerald-600" : "text-orange-600"}
          />
        </div>
      )}

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <EmbudioLeads data={embudo} />
        <ReservasPorMes data={reservasPorMes} />
      </div>

      {/* ── Venta por proveedor (admin) ──────────────────────────────────── */}
      {isAdmin && ventaPorProveedor.length > 0 && (
        <VentaPorProveedor data={ventaPorProveedor} />
      )}

      {/* ── Objetivos + Ranking ──────────────────────────────────────────── */}
      {isAdmin ? (
        <div className="grid grid-cols-1 gap-4">
          <ObjetivosSection objetivos={objetivos} />
          <RankingAgentes items={ranking} />
        </div>
      ) : (
        <ObjetivosSection objetivos={objetivos} singleAgente />
      )}
    </div>
  );
}
