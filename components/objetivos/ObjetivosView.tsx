"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Target } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { toUSD, formatMoneda } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { Objetivo, TipoObjetivo, Moneda } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function periodoLabel(o: Objetivo): string {
  if (o.mes) return `${MESES[o.mes - 1]} ${o.anio}`;
  return `Anual ${o.anio}`;
}

function calcProgress(objetivo: Objetivo, reservas: ReturnType<typeof useData>["reservas"]) {
  const reservasAceptadas = reservas.filter((r) => {
    if (r.estado !== "aceptada") return false;
    if (objetivo.tipo === "agente" && objetivo.agenteId) {
      if (r.agenteId !== objetivo.agenteId) return false;
    }
    if (objetivo.mes) {
      const mes = new Date(r.fechaCreacion).getMonth() + 1;
      const anio = new Date(r.fechaCreacion).getFullYear();
      if (mes !== objetivo.mes || anio !== objetivo.anio) return false;
    } else {
      const anio = new Date(r.fechaCreacion).getFullYear();
      if (anio !== objetivo.anio) return false;
    }
    return true;
  });

  const montoActualUSD = reservasAceptadas.reduce(
    (sum, r) => sum + r.items.reduce((s, i) => s + toUSD(i.importe, i.moneda), 0),
    0
  );

  // Compare in same currency as the goal
  const montoActual = objetivo.moneda === "ARS"
    ? montoActualUSD * 1200
    : montoActualUSD;

  return {
    montoActual: Math.round(montoActual),
    reservasActuales: reservasAceptadas.length,
    montoPct: objetivo.metaMonto > 0
      ? Math.min(Math.round((montoActual / objetivo.metaMonto) * 100), 150)
      : 0,
    reservasPct: objetivo.metaReservas && objetivo.metaReservas > 0
      ? Math.min(Math.round((reservasAceptadas.length / objetivo.metaReservas) * 100), 150)
      : 0,
  };
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  const colorClass =
    pct >= 100 ? "bg-emerald-500" : pct >= 70 ? "bg-blue-500" : "bg-amber-400";
  return (
    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all", colorClass)}
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function PctBadge({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        "text-xs font-bold px-2 py-0.5 rounded-full",
        pct >= 100
          ? "bg-emerald-100 text-emerald-700"
          : pct >= 70
          ? "bg-blue-50 text-blue-700"
          : "bg-amber-50 text-amber-700"
      )}
    >
      {pct}%
    </span>
  );
}

// ─── ObjetivoCard ─────────────────────────────────────────────────────────────

interface CardProps {
  objetivo: Objetivo;
  nombre: string;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
  reservas: ReturnType<typeof useData>["reservas"];
}

function ObjetivoCard({ objetivo, nombre, isAdmin, onEdit, onDelete, reservas }: CardProps) {
  const { montoActual, reservasActuales, montoPct, reservasPct } = calcProgress(objetivo, reservas);
  const superado = montoPct >= 100;

  return (
    <div
      className={cn(
        "rounded-xl border shadow-sm p-4 flex flex-col gap-3 bg-white",
        superado && "border-emerald-200 bg-emerald-50/40"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium text-neutral-800 truncate">{nombre}</span>
          <span className="text-xs text-neutral-400">{objetivo.descripcion}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <PctBadge pct={montoPct} />
          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onEdit}
                aria-label="Editar objetivo"
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label="Eliminar objetivo"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Periodo */}
      <Badge variant="outline" className="w-fit text-xs">
        {periodoLabel(objetivo)}
      </Badge>

      {/* Monto progress */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-neutral-500">
          <span>Ingresos</span>
          <span className="font-medium text-neutral-700">
            {formatMoneda(montoActual, objetivo.moneda)}{" "}
            <span className="text-neutral-400">/ {formatMoneda(objetivo.metaMonto, objetivo.moneda)}</span>
          </span>
        </div>
        <ProgressBar pct={montoPct} />
      </div>

      {/* Reservas progress */}
      {objetivo.metaReservas != null && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Reservas</span>
            <span className="font-medium text-neutral-700">
              {reservasActuales}
              <span className="text-neutral-400"> / {objetivo.metaReservas}</span>
            </span>
          </div>
          <ProgressBar pct={reservasPct} />
        </div>
      )}
    </div>
  );
}

// ─── ObjetivoForm ─────────────────────────────────────────────────────────────

interface FormState {
  tipo: TipoObjetivo;
  agenteId: string;
  proveedorId: string;
  anio: string;
  mes: string;
  descripcion: string;
  metaReservas: string;
  metaMonto: string;
  moneda: Moneda;
}

const FORM_EMPTY: FormState = {
  tipo: "agente",
  agenteId: "",
  proveedorId: "",
  anio: String(new Date().getFullYear()),
  mes: "",
  descripcion: "",
  metaReservas: "",
  metaMonto: "",
  moneda: "USD",
};

function objetivoToForm(o: Objetivo): FormState {
  return {
    tipo: o.tipo,
    agenteId: o.agenteId ?? "",
    proveedorId: o.proveedorId ?? "",
    anio: String(o.anio),
    mes: o.mes ? String(o.mes) : "",
    descripcion: o.descripcion,
    metaReservas: o.metaReservas != null ? String(o.metaReservas) : "",
    metaMonto: String(o.metaMonto),
    moneda: o.moneda,
  };
}

interface FormProps {
  open: boolean;
  editing: Objetivo | null;
  onClose: () => void;
  onSubmit: (data: Omit<Objetivo, "id">) => void;
  agentesActivos: { id: string; nombre: string; apellido: string }[];
  proveedores: { id: string; nombre: string }[];
}

function ObjetivoForm({ open, editing, onClose, onSubmit, agentesActivos, proveedores }: FormProps) {
  const [form, setForm] = useState<FormState>(FORM_EMPTY);

  // Re-init whenever the dialog opens or the editing target changes
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setForm(editing ? objetivoToForm(editing) : FORM_EMPTY);
    }
    prevOpenRef.current = open;
  }, [open, editing]);

  const set = (key: keyof FormState, val: string | null) =>
    setForm((prev) => ({ ...prev, [key]: val ?? "" }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const anio = parseInt(form.anio);
    if (!form.descripcion.trim() || !form.metaMonto || isNaN(anio)) return;
    const payload: Omit<Objetivo, "id"> = {
      tipo: form.tipo,
      anio,
      mes: form.mes ? parseInt(form.mes) : undefined,
      descripcion: form.descripcion.trim(),
      metaReservas: form.metaReservas ? parseInt(form.metaReservas) : undefined,
      metaMonto: parseFloat(form.metaMonto),
      moneda: form.moneda,
      agenteId: form.tipo === "agente" ? form.agenteId || undefined : undefined,
      proveedorId: form.tipo === "incentivo" ? form.proveedorId || undefined : undefined,
    };
    onSubmit(payload);
    onClose();
  }

  const title = editing ? "Editar objetivo" : "Nuevo objetivo";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-lg" onClose={onClose}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            {/* Tipo */}
            <div className="flex flex-col gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => set("tipo", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agencia">Agencia</SelectItem>
                  <SelectItem value="agente">Agente</SelectItem>
                  <SelectItem value="incentivo">Incentivo / Proveedor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agente — solo si tipo=agente */}
            {form.tipo === "agente" && (
              <div className="flex flex-col gap-1.5">
                <Label>Agente</Label>
                <Select value={form.agenteId} onValueChange={(v) => set("agenteId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar agente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {agentesActivos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nombre} {a.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Proveedor — solo si tipo=incentivo */}
            {form.tipo === "incentivo" && (
              <div className="flex flex-col gap-1.5">
                <Label>Proveedor</Label>
                <Select value={form.proveedorId} onValueChange={(v) => set("proveedorId", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar proveedor…" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Año y Mes */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="obj-anio">Año *</Label>
                <Input
                  id="obj-anio"
                  type="number"
                  min={2020}
                  max={2099}
                  value={form.anio}
                  onChange={(e) => set("anio", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="obj-mes">Mes (vacío = anual)</Label>
                <Select value={form.mes} onValueChange={(v) => set("mes", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Anual" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Anual</SelectItem>
                    {MESES.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="obj-desc">Descripción *</Label>
              <Input
                id="obj-desc"
                value={form.descripcion}
                onChange={(e) => set("descripcion", e.target.value)}
                placeholder="ej. Objetivo mensual agente"
                required
              />
            </div>

            {/* Meta Reservas + Meta Monto + Moneda */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="obj-meta-res">Meta reservas</Label>
                <Input
                  id="obj-meta-res"
                  type="number"
                  min={0}
                  value={form.metaReservas}
                  onChange={(e) => set("metaReservas", e.target.value)}
                  placeholder="—"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="obj-meta-monto">Meta monto *</Label>
                <Input
                  id="obj-meta-monto"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.metaMonto}
                  onChange={(e) => set("metaMonto", e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Moneda</Label>
                <Select value={form.moneda} onValueChange={(v) => set("moneda", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {editing ? "Guardar cambios" : "Crear objetivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Target className="w-4 h-4 text-neutral-400 shrink-0" />
      <h2 className="text-base font-semibold text-neutral-800">{title}</h2>
      {count > 0 && (
        <Badge variant="outline" className="text-xs">
          {count}
        </Badge>
      )}
    </div>
  );
}

// ─── ObjetivosView ────────────────────────────────────────────────────────────

export function ObjetivosView() {
  const { objetivos, reservas, usuarios, proveedores, addObjetivo, updateObjetivo, deleteObjetivo } =
    useData();
  const { rol, usuario } = useRole();

  const isAdmin = rol === "admin";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Objetivo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Objetivo | null>(null);

  // Active agents for form selects
  const agentesActivos = useMemo(
    () => usuarios.filter((u) => u.rol === "agente" && u.activo),
    [usuarios]
  );

  // Objetivos filtered for current role
  const misObjetivos = useMemo(() => {
    if (isAdmin) return objetivos;
    return objetivos.filter(
      (o) => o.tipo === "agencia" || o.agenteId === usuario.id
    );
  }, [objetivos, isAdmin, usuario.id]);

  const agenciaObjetivos = misObjetivos.filter((o) => o.tipo === "agencia");
  const agenteObjetivos = isAdmin
    ? misObjetivos.filter((o) => o.tipo === "agente")
    : misObjetivos.filter((o) => o.tipo === "agente" && o.agenteId === usuario.id);
  const incentivoObjetivos = misObjetivos.filter((o) => o.tipo === "incentivo");

  function openNew(_tipo?: TipoObjetivo) {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(o: Objetivo) {
    setEditing(o);
    setDialogOpen(true);
  }

  function handleSubmit(data: Omit<Objetivo, "id">) {
    if (editing) {
      updateObjetivo(editing.id, data);
    } else {
      addObjetivo(data);
    }
  }

  function handleDelete(o: Objetivo) {
    setDeleteConfirm(o);
  }

  function confirmDelete() {
    if (deleteConfirm) {
      deleteObjetivo(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  }

  function cardName(o: Objetivo): string {
    if (o.tipo === "agente" && o.agenteId) {
      const u = usuarios.find((u) => u.id === o.agenteId);
      return u ? `${u.nombre} ${u.apellido}` : "Agente";
    }
    if (o.tipo === "incentivo" && o.proveedorId) {
      const p = proveedores.find((p) => p.id === o.proveedorId);
      return p ? p.nombre : "Proveedor";
    }
    return o.tipo === "agencia" ? "Agencia" : o.descripcion;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Objetivos Comerciales</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Seguimiento de metas por agencia, agente y proveedor
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => openNew()}>
            <Plus />
            Nuevo Objetivo
          </Button>
        )}
      </div>

      {/* ── Sección: Objetivo Anual de la Agencia ─────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader title="Objetivo Anual de la Agencia" count={agenciaObjetivos.length} />
        {agenciaObjetivos.length === 0 ? (
          <EmptyState
            mensaje="No hay objetivos de agencia definidos."
            isAdmin={isAdmin}
            onAdd={() => openNew("agencia")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agenciaObjetivos.map((o) => (
              <ObjetivoCard
                key={o.id}
                objetivo={o}
                nombre={cardName(o)}
                isAdmin={isAdmin}
                onEdit={() => openEdit(o)}
                onDelete={() => handleDelete(o)}
                reservas={reservas}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* ── Sección: Objetivos por Agente ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title={isAdmin ? "Objetivos por Agente" : "Mi Objetivo"}
          count={agenteObjetivos.length}
        />
        {agenteObjetivos.length === 0 ? (
          <EmptyState
            mensaje={isAdmin ? "No hay objetivos de agente definidos." : "No tenés objetivos asignados."}
            isAdmin={isAdmin}
            onAdd={() => openNew("agente")}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agenteObjetivos.map((o) => (
              <ObjetivoCard
                key={o.id}
                objetivo={o}
                nombre={cardName(o)}
                isAdmin={isAdmin}
                onEdit={() => openEdit(o)}
                onDelete={() => handleDelete(o)}
                reservas={reservas}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Sección: Objetivos por Incentivo / Proveedor ──────────────────── */}
      {(isAdmin || incentivoObjetivos.length > 0) && (
        <>
          <Separator />
          <section className="flex flex-col gap-4">
            <SectionHeader
              title="Objetivos por Incentivo / Proveedor"
              count={incentivoObjetivos.length}
            />
            {incentivoObjetivos.length === 0 ? (
              <EmptyState
                mensaje="No hay objetivos de incentivo / proveedor definidos."
                isAdmin={isAdmin}
                onAdd={() => openNew("incentivo")}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {incentivoObjetivos.map((o) => (
                  <ObjetivoCard
                    key={o.id}
                    objetivo={o}
                    nombre={cardName(o)}
                    isAdmin={isAdmin}
                    onEdit={() => openEdit(o)}
                    onDelete={() => handleDelete(o)}
                    reservas={reservas}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ── Form Dialog ───────────────────────────────────────────────────── */}
      <ObjetivoForm
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        agentesActivos={agentesActivos}
        proveedores={proveedores}
      />

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="max-w-sm" onClose={() => setDeleteConfirm(null)}>
          <DialogHeader>
            <DialogTitle>Eliminar objetivo</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-neutral-600">
              ¿Confirmás eliminar el objetivo{" "}
              <span className="font-medium text-neutral-800">
                &ldquo;{deleteConfirm?.descripcion}&rdquo;
              </span>
              ? Esta acción no se puede deshacer.
            </p>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({
  mensaje,
  isAdmin,
  onAdd,
}: {
  mensaje: string;
  isAdmin: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-neutral-200 text-center">
      <Target className="w-8 h-8 text-neutral-300" />
      <p className="text-sm text-neutral-400">{mensaje}</p>
      {isAdmin && (
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus />
          Agregar objetivo
        </Button>
      )}
    </div>
  );
}
