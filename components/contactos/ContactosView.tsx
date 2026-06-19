"use client";

import { useState } from "react";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { filtrarPorRol } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Contacto, EtapaLead, OrigenContacto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadsKanban } from "@/components/contactos/LeadsKanban";
import { ContactoForm } from "@/components/contactos/ContactoForm";
import { Pencil, Plus } from "lucide-react";

// ── Labels ────────────────────────────────────────────────────────────────────

const ETAPA_LABEL: Record<EtapaLead, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  cotizacion: "Cotización",
  en_pausa: "En pausa",
  ganado: "Ganado",
  perdido: "Perdido",
};

const ORIGEN_LABEL: Record<OrigenContacto, string> = {
  instagram_agencia: "Instagram Agencia",
  facebook: "Facebook",
  recomendado: "Recomendado",
  web: "Web",
  instagram_agente: "Instagram Agente",
  otros: "Otros",
};

// ── Badge variants per etapa ──────────────────────────────────────────────────

function etapaBadgeClass(etapa: EtapaLead): string {
  return cn(
    "text-xs font-medium px-2 py-0.5 rounded-full border",
    {
      sin_contactar: "bg-neutral-100 text-neutral-600 border-neutral-200",
      contactado: "bg-blue-100 text-blue-700 border-blue-200",
      cotizacion: "bg-violet-100 text-violet-700 border-violet-200",
      en_pausa: "bg-amber-100 text-amber-700 border-amber-200",
      ganado: "bg-emerald-100 text-emerald-700 border-emerald-200",
      perdido: "bg-red-100 text-red-700 border-red-200",
    }[etapa]
  );
}

function formatFecha(fecha?: string): string {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContactosView() {
  const { contactos, usuarios } = useData();
  const { rol, usuario } = useRole();
  const [tab, setTab] = useState<"lista" | "kanban">("lista");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contacto | undefined>(undefined);
  const [filtroAgente, setFiltroAgente] = useState<string>("todos");

  const agentes = usuarios.filter((u) => u.rol === "agente" && u.activo);

  // Filter by role first, then optionally by selected agente (admin only)
  let lista = filtrarPorRol(contactos, rol, usuario.id);
  if (rol === "admin" && filtroAgente !== "todos") {
    lista = lista.filter((c) => c.agenteId === filtroAgente);
  }

  function handleNuevo() {
    setEditTarget(undefined);
    setDialogOpen(true);
  }

  function handleEditar(c: Contacto) {
    setEditTarget(c);
    setDialogOpen(true);
  }

  function getAgenteName(agenteId: string): string {
    const a = usuarios.find((u) => u.id === agenteId);
    return a ? `${a.nombre} ${a.apellido}` : "—";
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Contactos</h1>
        <div className="flex items-center gap-3">
          {rol === "admin" && (
            <select
              value={filtroAgente}
              onChange={(e) => setFiltroAgente(e.target.value)}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos los agentes</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          )}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
            onClick={handleNuevo}
          >
            <Plus size={15} />
            Nuevo Contacto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "lista" | "kanban")}>
        <TabsList>
          <TabsTrigger value="lista">Lista</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* ── Lista tab ── */}
        <TabsContent value="lista" className="mt-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Etapa</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Origen</th>
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Destino</th>
                    {rol === "admin" && (
                      <th className="text-left px-4 py-3 font-medium text-neutral-600">Agente</th>
                    )}
                    <th className="text-left px-4 py-3 font-medium text-neutral-600">Último contacto</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {lista.length === 0 && (
                    <tr>
                      <td
                        colSpan={rol === "admin" ? 7 : 6}
                        className="px-4 py-10 text-center text-neutral-400"
                      >
                        No hay contactos para mostrar.
                      </td>
                    </tr>
                  )}
                  {lista.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                    >
                      {/* Nombre + avatar */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${c.id}`}
                          className="flex items-center gap-2.5 hover:underline"
                        >
                          <Avatar size="sm">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                              {c.nombre[0]}{c.apellido[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-neutral-900">
                            {c.nombre} {c.apellido}
                          </span>
                        </Link>
                      </td>

                      {/* Etapa */}
                      <td className="px-4 py-3">
                        <span className={etapaBadgeClass(c.etapa)}>
                          {ETAPA_LABEL[c.etapa]}
                        </span>
                      </td>

                      {/* Origen */}
                      <td className="px-4 py-3 text-neutral-600">
                        {ORIGEN_LABEL[c.origen]}
                      </td>

                      {/* Destino */}
                      <td className="px-4 py-3 text-neutral-600">
                        {c.destinoInteres ?? "—"}
                      </td>

                      {/* Agente (admin only) */}
                      {rol === "admin" && (
                        <td className="px-4 py-3 text-neutral-600">
                          {getAgenteName(c.agenteId)}
                        </td>
                      )}

                      {/* Último contacto */}
                      <td className="px-4 py-3 text-neutral-500">
                        {formatFecha(c.fechaUltimoContacto)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEditar(c)}
                          aria-label="Editar contacto"
                        >
                          <Pencil size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ── Kanban tab ── */}
        <TabsContent value="kanban" className="mt-4">
          <LeadsKanban contactos={lista} />
        </TabsContent>
      </Tabs>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "Editar contacto" : "Nuevo contacto"}
            </DialogTitle>
          </DialogHeader>
          <ContactoForm
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            contacto={editTarget}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
