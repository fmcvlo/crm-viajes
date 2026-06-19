"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { filtrarPorRol, toUSD, formatMoneda } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReservaForm } from "@/components/reservas/ReservaForm";
import type { EstadoReserva } from "@/lib/types";

const ESTADO_BADGE: Record<EstadoReserva, { label: string; className: string }> = {
  creada:    { label: "Creada",    className: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  enviada:   { label: "Enviada",   className: "bg-violet-100 text-violet-700 border-violet-200" },
  aceptada:  { label: "Aceptada",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700 border-red-200" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200" },
};

export function ReservasView() {
  const router = useRouter();
  const { reservas, contactos, usuarios } = useData();
  const { rol, usuario } = useRole();

  const [formOpen, setFormOpen] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoReserva | "todas">("todas");
  const [filtroAgente, setFiltroAgente] = useState<string>("todos");

  const reservasFiltradas = filtrarPorRol(reservas, rol, usuario.id).filter((r) => {
    if (filtroEstado !== "todas" && r.estado !== filtroEstado) return false;
    if (rol === "admin" && filtroAgente !== "todos" && r.agenteId !== filtroAgente) return false;
    return true;
  });

  const agentes = usuarios.filter((u) => u.activo);

  function getNombreContacto(id: string) {
    const c = contactos.find((c) => c.id === id);
    return c ? `${c.nombre} ${c.apellido}` : "—";
  }

  function getNombreAgente(id: string) {
    const u = usuarios.find((u) => u.id === id);
    return u ? `${u.nombre} ${u.apellido}` : "—";
  }

  function calcularMontoUSD(items: { importe: number; moneda: string }[]) {
    return items.reduce((sum, i) => sum + toUSD(i.importe, i.moneda), 0);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900">Reservas</h1>
        <Button onClick={() => setFormOpen(true)}>+ Nueva Reserva</Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoReserva | "todas")}
            className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todos</option>
            <option value="creada">Creada</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
        {rol === "admin" && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Agente:</span>
            <select
              value={filtroAgente}
              onChange={(e) => setFiltroAgente(e.target.value)}
              className="text-sm border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Cliente</th>
                {rol === "admin" && (
                  <th className="text-left px-4 py-3 font-medium text-neutral-600">Agente</th>
                )}
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Pasajeros</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Monto total</th>
                <th className="text-left px-4 py-3 font-medium text-neutral-600">Límite pago</th>
                <th className="text-right px-4 py-3 font-medium text-neutral-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={rol === "admin" ? 8 : 7}
                    className="text-center py-12 text-neutral-400"
                  >
                    No hay reservas que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                reservasFiltradas.map((r) => {
                  const badge = ESTADO_BADGE[r.estado];
                  const montoUSD = calcularMontoUSD(r.items);
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/reservas/${r.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {r.nombre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {getNombreContacto(r.clienteId)}
                      </td>
                      {rol === "admin" && (
                        <td className="px-4 py-3 text-neutral-700">
                          {getNombreAgente(r.agenteId)}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-700">{r.pasajeros}</td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        {formatMoneda(montoUSD, "USD")}
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {r.fechaLimitePago
                          ? new Date(r.fechaLimitePago).toLocaleDateString("es-AR")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/reservas/${r.id}`)}
                        >
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReservaForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
