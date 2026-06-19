"use client";

import { useState, useMemo, useCallback } from "react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { filtrarPorRol, toUSD, formatMoneda } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import type { Comision, EstadoComision } from "@/lib/types";
import { Download, Pencil, CheckCircle, DollarSign } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(iso: string | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const ESTADO_BADGE: Record<
  EstadoComision,
  { label: string; className: string }
> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  verificada: {
    label: "Verificada",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  pagada: {
    label: "Pagada",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

function EstadoBadge({ estado }: { estado: EstadoComision }) {
  const { label, className } = ESTADO_BADGE[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        className
      )}
    >
      {label}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "amber" | "blue" | "emerald";
}) {
  const palette = {
    amber: "bg-amber-50 border-amber-200 text-amber-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  }[color];

  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-4 flex flex-col gap-1 min-w-[160px]",
        palette
      )}
    >
      <span className="text-xs font-medium opacity-70 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}

// ─── Edit Monto Dialog ────────────────────────────────────────────────────────

function EditMontoDialog({
  comision,
  onClose,
  onSave,
}: {
  comision: Comision;
  onClose: () => void;
  onSave: (monto: number) => void;
}) {
  const [valor, setValor] = useState(String(comision.monto));
  const parsed = parseFloat(valor);
  const valid = !isNaN(parsed) && parsed >= 0;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Editar monto de comisión</DialogTitle>
          <DialogDescription>
            Modificá el monto en {comision.moneda}.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="monto-input">
              Monto ({comision.moneda})
            </Label>
            <Input
              id="monto-input"
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={!valid}
            onClick={() => {
              if (valid) onSave(parsed);
            }}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Comisiones Table ─────────────────────────────────────────────────────────

interface ComisionesTableProps {
  comisiones: Comision[];
  isAdmin: boolean;
  accionLabel?: string;
  accionEstado?: EstadoComision;
  onAccion?: (id: string) => void;
  onEditMonto?: (comision: Comision) => void;
  reservaNombre: (id: string) => string;
  clienteNombre: (reservaId: string) => string;
  agenteNombre: (id: string) => string;
  proveedorNombre: (id: string | undefined) => string;
}

function ComisionesTable({
  comisiones,
  isAdmin,
  accionLabel,
  accionEstado,
  onAccion,
  onEditMonto,
  reservaNombre,
  clienteNombre,
  agenteNombre,
  proveedorNombre,
}: ComisionesTableProps) {
  if (comisiones.length === 0) {
    return (
      <p className="text-sm text-neutral-400 py-10 text-center">
        No hay comisiones en esta categoría.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            <th className="px-4 py-3">Reserva</th>
            <th className="px-4 py-3">Cliente</th>
            {isAdmin && <th className="px-4 py-3">Agente</th>}
            <th className="px-4 py-3">Proveedor</th>
            <th className="px-4 py-3 text-right">%</th>
            <th className="px-4 py-3 text-right">Monto</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3">Fecha</th>
            {isAdmin && <th className="px-4 py-3 text-right">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {comisiones.map((c) => (
            <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-3 font-medium text-neutral-900 max-w-[160px] truncate">
                {reservaNombre(c.reservaId)}
              </td>
              <td className="px-4 py-3 text-neutral-600">
                {clienteNombre(c.reservaId)}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-neutral-600">
                  {agenteNombre(c.agenteId)}
                </td>
              )}
              <td className="px-4 py-3 text-neutral-500">
                {proveedorNombre(c.proveedorId)}
              </td>
              <td className="px-4 py-3 text-right text-neutral-600">
                {c.porcentaje}%
              </td>
              <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                {formatMoneda(c.monto, c.moneda)}
              </td>
              <td className="px-4 py-3">
                <EstadoBadge estado={c.estado} />
              </td>
              <td className="px-4 py-3 text-neutral-500 whitespace-nowrap">
                {formatFecha(c.fechaCreacion)}
              </td>
              {isAdmin && (
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEditMonto && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditMonto(c)}
                        className="h-7 w-7 p-0 text-neutral-400 hover:text-neutral-700"
                        title="Editar monto"
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                    {accionLabel && onAccion && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAccion(c.id)}
                        className="h-7 text-xs"
                      >
                        {accionLabel}
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function ComisionesView() {
  const {
    comisiones,
    reservas,
    contactos,
    usuarios,
    proveedores,
    setEstadoComision,
    updateComisionMonto,
  } = useData();
  const { rol, usuario } = useRole();

  const isAdmin = rol === "admin";

  const [tab, setTab] = useState<EstadoComision>("pendiente");
  const [editando, setEditando] = useState<Comision | null>(null);

  // ── Lookups ──────────────────────────────────────────────────────────────

  const reservaMap = useMemo(
    () => new Map(reservas.map((r) => [r.id, r])),
    [reservas]
  );

  const contactoMap = useMemo(
    () => new Map(contactos.map((c) => [c.id, c])),
    [contactos]
  );

  const usuarioMap = useMemo(
    () => new Map(usuarios.map((u) => [u.id, u])),
    [usuarios]
  );

  const proveedorMap = useMemo(
    () => new Map(proveedores.map((p) => [p.id, p])),
    [proveedores]
  );

  const reservaNombre = useCallback(
    (reservaId: string) => reservaMap.get(reservaId)?.nombre ?? reservaId,
    [reservaMap]
  );

  const clienteNombre = useCallback(
    (reservaId: string) => {
      const r = reservaMap.get(reservaId);
      if (!r) return "—";
      const c = contactoMap.get(r.clienteId);
      return c ? `${c.nombre} ${c.apellido}` : "—";
    },
    [reservaMap, contactoMap]
  );

  const agenteNombre = useCallback(
    (agenteId: string) => {
      const u = usuarioMap.get(agenteId);
      return u ? `${u.nombre} ${u.apellido}` : agenteId;
    },
    [usuarioMap]
  );

  const proveedorNombre = useCallback(
    (proveedorId: string | undefined) =>
      proveedorId ? (proveedorMap.get(proveedorId)?.nombre ?? "—") : "—",
    [proveedorMap]
  );

  // ── Filtered lists ────────────────────────────────────────────────────────

  const filtradas = useMemo(
    () => filtrarPorRol(comisiones, rol, usuario.id),
    [comisiones, rol, usuario.id]
  );

  const porEstado = useCallback(
    (estado: EstadoComision) => filtradas.filter((c) => c.estado === estado),
    [filtradas]
  );

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpi = useMemo(() => {
    const sum = (estado: EstadoComision) =>
      filtradas
        .filter((c) => c.estado === estado)
        .reduce((acc, c) => acc + toUSD(c.monto, c.moneda), 0);

    return {
      pendiente: sum("pendiente"),
      verificada: sum("verificada"),
      pagada: sum("pagada"),
    };
  }, [filtradas]);

  // ── CSV Export ────────────────────────────────────────────────────────────

  function exportarCSV() {
    const headers = [
      "ID",
      "Reserva",
      "Cliente",
      "Agente",
      "Proveedor",
      "Porcentaje",
      "Monto",
      "Moneda",
      "Estado",
      "Fecha Creación",
      "Fecha Verificación",
      "Fecha Pago",
    ];

    const rows = filtradas.map((c) => [
      c.id,
      reservaNombre(c.reservaId),
      clienteNombre(c.reservaId),
      agenteNombre(c.agenteId),
      proveedorNombre(c.proveedorId),
      c.porcentaje,
      c.monto,
      c.moneda,
      c.estado,
      c.fechaCreacion,
      c.fechaVerificacion ?? "",
      c.fechaPago ?? "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comisiones_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const tableProps = {
    isAdmin,
    reservaNombre,
    clienteNombre,
    agenteNombre,
    proveedorNombre,
    onEditMonto: isAdmin ? (c: Comision) => setEditando(c) : undefined,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Comisiones</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isAdmin
              ? "Gestioná y verificá las comisiones de todos los agentes."
              : "Seguí el estado de tus comisiones."}
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={exportarCSV}>
            <Download size={15} className="mr-1.5" />
            Exportar CSV
          </Button>
        )}
      </div>

      {/* KPIs */}
      <div className="flex flex-wrap gap-3">
        <KpiCard
          label="Pendiente"
          value={formatMoneda(kpi.pendiente, "USD", true)}
          color="amber"
        />
        <KpiCard
          label="Verificada"
          value={formatMoneda(kpi.verificada, "USD", true)}
          color="blue"
        />
        <KpiCard
          label="Pagada"
          value={formatMoneda(kpi.pagada, "USD", true)}
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as EstadoComision)}>
        <div className="flex items-center gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="pendiente">
              Pendientes&nbsp;
              <span className="ml-1 tabular-nums text-xs text-neutral-400">
                ({porEstado("pendiente").length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="verificada">
              Verificadas&nbsp;
              <span className="ml-1 tabular-nums text-xs text-neutral-400">
                ({porEstado("verificada").length})
              </span>
            </TabsTrigger>
            <TabsTrigger value="pagada">
              Pagadas&nbsp;
              <span className="ml-1 tabular-nums text-xs text-neutral-400">
                ({porEstado("pagada").length})
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="pendiente" className="mt-4">
          <ComisionesTable
            {...tableProps}
            comisiones={porEstado("pendiente")}
            accionLabel={isAdmin ? "Marcar Verificada" : undefined}
            onAccion={
              isAdmin
                ? (id) => setEstadoComision(id, "verificada")
                : undefined
            }
          />
        </TabsContent>

        <TabsContent value="verificada" className="mt-4">
          <ComisionesTable
            {...tableProps}
            comisiones={porEstado("verificada")}
            accionLabel={isAdmin ? "Marcar Pagada" : undefined}
            onAccion={
              isAdmin
                ? (id) => setEstadoComision(id, "pagada")
                : undefined
            }
          />
        </TabsContent>

        <TabsContent value="pagada" className="mt-4">
          <ComisionesTable
            {...tableProps}
            comisiones={porEstado("pagada")}
          />
        </TabsContent>
      </Tabs>

      {/* Edit monto dialog */}
      {editando && (
        <EditMontoDialog
          comision={editando}
          onClose={() => setEditando(null)}
          onSave={(monto) => {
            updateComisionMonto(editando.id, monto);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
}
