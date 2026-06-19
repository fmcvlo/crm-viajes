"use client";

import { useMemo } from "react";
import { useRole } from "@/contexts/RoleContext";
import { useData } from "@/contexts/DataContext";
import { filtrarPorRol, toUSD } from "@/lib/filters";
import type { Contacto, Reserva, Comision, Objetivo, Usuario, Proveedor, Moneda } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const MES_ACTUAL = 5;
const ANIO_ACTUAL = 2025;

const ETAPAS_ACTIVAS = new Set(["sin_contactar", "contactado", "cotizacion", "en_pausa"]);
const ESTADOS_RESERVA_OK = new Set(["aceptada"]);

const ETAPA_ORDER = [
  "sin_contactar",
  "contactado",
  "cotizacion",
  "en_pausa",
  "ganado",
  "perdido",
] as const;

const ETAPA_LABELS: Record<string, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  cotizacion: "Cotización",
  en_pausa: "En pausa",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const ETAPA_COLORS: Record<string, string> = {
  sin_contactar: "#3B82F6",
  contactado: "#EAB308",
  cotizacion: "#F97316",
  en_pausa: "#8B5CF6",
  ganado: "#22C55E",
  perdido: "#EF4444",
};

const MESES_SALIDA = [
  { key: "2025-06", label: "Jun" },
  { key: "2025-07", label: "Jul" },
  { key: "2025-08", label: "Ago" },
  { key: "2025-09", label: "Sep" },
  { key: "2025-10", label: "Oct" },
  { key: "2025-11", label: "Nov" },
  { key: "2025-12", label: "Dic" },
  { key: "2026-01", label: "Ene 26" },
];

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export interface KpiData {
  leadsActivos: number;
  leadsNuevosEsteMes: number;
  reservasAceptadas: number;
  ingresosTotalesUSD: number;
  comisionesPendientesUSD: number;
  objetivoGlobalPct: number;
}

export interface EmbudoItem {
  estado: string;
  label: string;
  count: number;
  fill: string;
}

export interface ReservasMesItem {
  mes: string;
  aceptada: number;
  enviada: number;
  creada: number;
  cancelada: number;
}

export interface RankingItem {
  agente: Usuario;
  pos: number;
  leadsActivos: number;
  reservasAceptadas: number;
  ingresoUSD: number;
  comisionPendienteUSD: number;
  objetivoPct: number;
}

export interface VentaProveedorItem {
  proveedor: string;
  montoUSD: number;
}

export interface ObjetivoConProgreso {
  id: string;
  descripcion: string;
  tipo: string;
  agenteId?: string;
  metaReservas?: number;
  metaMonto: number;
  moneda: Moneda;
  reservasActuales: number;
  montoActual: number;
}

export interface DashboardData {
  kpis: KpiData;
  embudo: EmbudoItem[];
  reservasPorMes: ReservasMesItem[];
  objetivos: ObjetivoConProgreso[];
  ranking: RankingItem[];
  ventaPorProveedor: VentaProveedorItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcMontoReservaUSD(r: Reserva): number {
  return r.items.reduce((s, i) => s + toUSD(i.importe, i.moneda), 0);
}

function buildKpis(
  contactos: Contacto[],
  reservas: Reserva[],
  comisiones: Comision[],
  objetivos: Objetivo[],
  rol: string,
  usuarioId: string
): KpiData {
  const leadsActivos = contactos.filter((c) => ETAPAS_ACTIVAS.has(c.etapa)).length;
  const leadsNuevosEsteMes = contactos.filter(
    (c) => new Date(c.fechaCreacion).getMonth() + 1 === MES_ACTUAL
  ).length;
  const reservasOk = reservas.filter((r) => ESTADOS_RESERVA_OK.has(r.estado));
  const reservasAceptadas = reservasOk.length;
  const ingresosTotalesUSD = Math.round(reservasOk.reduce((s, r) => s + calcMontoReservaUSD(r), 0));
  const comisionesPendientesUSD = Math.round(
    comisiones.filter((c) => c.estado === "pendiente").reduce((s, c) => s + toUSD(c.monto, c.moneda), 0)
  );

  const agenteObjetivos = objetivos.filter(
    (o) => o.tipo === "agente" && (!o.agenteId || o.agenteId === usuarioId || rol === "admin")
  );
  const objetivoGlobalPct =
    agenteObjetivos.length === 0
      ? 0
      : Math.round(
          agenteObjetivos.reduce((sum, o) => {
            const agReservas = reservas.filter(
              (r) => r.agenteId === o.agenteId && r.estado === "aceptada"
            );
            const monto = agReservas.reduce((s, r) => s + calcMontoReservaUSD(r), 0);
            return sum + (o.metaMonto > 0 ? (monto / o.metaMonto) * 100 : 0);
          }, 0) / agenteObjetivos.length
        );

  return {
    leadsActivos,
    leadsNuevosEsteMes,
    reservasAceptadas,
    ingresosTotalesUSD,
    comisionesPendientesUSD,
    objetivoGlobalPct,
  };
}

function buildEmbudo(contactos: Contacto[]): EmbudoItem[] {
  const counts: Record<string, number> = {};
  for (const c of contactos) {
    counts[c.etapa] = (counts[c.etapa] ?? 0) + 1;
  }
  return ETAPA_ORDER.map((etapa) => ({
    estado: etapa,
    label: ETAPA_LABELS[etapa] ?? etapa,
    count: counts[etapa] ?? 0,
    fill: ETAPA_COLORS[etapa] ?? "#6B7280",
  }));
}

function buildReservasPorMes(reservas: Reserva[]): ReservasMesItem[] {
  const map: Record<string, ReservasMesItem> = {};
  for (const m of MESES_SALIDA) {
    map[m.key] = { mes: m.label, aceptada: 0, enviada: 0, creada: 0, cancelada: 0 };
  }
  for (const r of reservas) {
    const firstItem = r.items[0];
    if (!firstItem) continue;
    const key = firstItem.checkIn?.slice(0, 7) ?? r.fechaCreacion.slice(0, 7);
    const item = map[key];
    if (!item) continue;
    if (r.estado === "aceptada") item.aceptada += 1;
    else if (r.estado === "enviada") item.enviada += 1;
    else if (r.estado === "creada") item.creada += 1;
    else if (r.estado === "cancelada") item.cancelada += 1;
  }
  return MESES_SALIDA.map((m) => map[m.key]);
}

function buildRanking(
  usuarios: Usuario[],
  contactos: Contacto[],
  reservas: Reserva[],
  comisiones: Comision[],
  objetivos: Objetivo[]
): RankingItem[] {
  const agentes = usuarios.filter((u) => u.rol === "agente" && u.activo);
  const items = agentes.map((agente) => {
    const aContactos = contactos.filter((c) => c.agenteId === agente.id);
    const aReservas = reservas.filter((r) => r.agenteId === agente.id);
    const aComisiones = comisiones.filter((c) => c.agenteId === agente.id);
    const aObjetivo = objetivos.find((o) => o.tipo === "agente" && o.agenteId === agente.id && o.mes === MES_ACTUAL && o.anio === ANIO_ACTUAL);
    const reservasOk = aReservas.filter((r) => r.estado === "aceptada");
    const ingresoUSD = Math.round(reservasOk.reduce((s, r) => s + calcMontoReservaUSD(r), 0));
    const comisionPendienteUSD = Math.round(
      aComisiones.filter((c) => c.estado === "pendiente").reduce((s, c) => s + toUSD(c.monto, c.moneda), 0)
    );
    const objetivoPct = aObjetivo
      ? Math.min(Math.round((ingresoUSD / aObjetivo.metaMonto) * 100), 150)
      : 0;
    return {
      agente,
      pos: 0,
      leadsActivos: aContactos.filter((c) => ETAPAS_ACTIVAS.has(c.etapa)).length,
      reservasAceptadas: reservasOk.length,
      ingresoUSD,
      comisionPendienteUSD,
      objetivoPct,
    };
  });
  items.sort((a, b) => b.ingresoUSD - a.ingresoUSD);
  return items.map((item, i) => ({ ...item, pos: i + 1 }));
}

function buildObjetivosConProgreso(
  objetivos: Objetivo[],
  reservas: Reserva[]
): ObjetivoConProgreso[] {
  return objetivos
    .filter((o) => o.tipo === "agente")
    .map((o) => {
      const aReservas = reservas.filter(
        (r) => r.agenteId === o.agenteId && r.estado === "aceptada" &&
          (!o.mes || new Date(r.fechaCreacion).getMonth() + 1 === o.mes)
      );
      const montoActual = Math.round(aReservas.reduce((s, r) => s + calcMontoReservaUSD(r), 0));
      return {
        id: o.id,
        descripcion: o.descripcion,
        tipo: o.tipo,
        agenteId: o.agenteId,
        metaReservas: o.metaReservas,
        metaMonto: o.metaMonto,
        moneda: o.moneda,
        reservasActuales: aReservas.length,
        montoActual,
      };
    });
}

function buildVentaPorProveedor(
  reservas: Reserva[],
  proveedores: Proveedor[]
): VentaProveedorItem[] {
  const map: Record<string, number> = {};
  for (const r of reservas.filter((r) => r.estado === "aceptada")) {
    for (const item of r.items) {
      map[item.proveedorId] = (map[item.proveedorId] ?? 0) + toUSD(item.importe, item.moneda);
    }
  }
  return Object.entries(map)
    .map(([provId, montoUSD]) => ({
      proveedor: proveedores.find((p) => p.id === provId)?.nombre ?? provId,
      montoUSD: Math.round(montoUSD),
    }))
    .sort((a, b) => b.montoUSD - a.montoUSD)
    .slice(0, 6);
}

// ─── Hook principal ───────────────────────────────────────────────────────────

const EMPTY_KPIS: KpiData = {
  leadsActivos: 0,
  leadsNuevosEsteMes: 0,
  reservasAceptadas: 0,
  ingresosTotalesUSD: 0,
  comisionesPendientesUSD: 0,
  objetivoGlobalPct: 0,
};

export function useDashboard(): DashboardData {
  const { rol, usuario } = useRole();
  const data = useData();

  return useMemo(() => {
    const contactos = filtrarPorRol(data.contactos, rol, usuario.id);
    const reservas = filtrarPorRol(data.reservas, rol, usuario.id);
    const comisiones = filtrarPorRol(data.comisiones, rol, usuario.id);
    const objetivos =
      rol === "admin"
        ? data.objetivos
        : data.objetivos.filter((o) => !o.agenteId || o.agenteId === usuario.id);

    return {
      kpis: buildKpis(contactos, reservas, comisiones, objetivos, rol, usuario.id),
      embudo: buildEmbudo(contactos),
      reservasPorMes: buildReservasPorMes(reservas),
      objetivos: buildObjetivosConProgreso(objetivos, data.reservas),
      ranking: rol === "admin"
        ? buildRanking(data.usuarios, data.contactos, data.reservas, data.comisiones, data.objetivos)
        : [],
      ventaPorProveedor: buildVentaPorProveedor(data.reservas, data.proveedores),
    };
  }, [data.contactos, data.reservas, data.comisiones, data.objetivos, data.usuarios, data.proveedores, rol, usuario.id]);
}
