"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import type { Contacto, EtapaLead, OrigenContacto } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ── Column config ─────────────────────────────────────────────────────────────

interface Column {
  etapa: EtapaLead;
  label: string;
  headerBg: string;
  headerText: string;
  countBg: string;
  countText: string;
  borderColor: string;
}

const COLUMNS: Column[] = [
  {
    etapa: "sin_contactar",
    label: "Sin contactar",
    headerBg: "bg-blue-50",
    headerText: "text-blue-800",
    countBg: "bg-blue-100",
    countText: "text-blue-700",
    borderColor: "border-blue-200",
  },
  {
    etapa: "contactado",
    label: "Contactado",
    headerBg: "bg-yellow-50",
    headerText: "text-yellow-800",
    countBg: "bg-yellow-100",
    countText: "text-yellow-700",
    borderColor: "border-yellow-200",
  },
  {
    etapa: "cotizacion",
    label: "Cotización",
    headerBg: "bg-orange-50",
    headerText: "text-orange-800",
    countBg: "bg-orange-100",
    countText: "text-orange-700",
    borderColor: "border-orange-200",
  },
  {
    etapa: "en_pausa",
    label: "En pausa",
    headerBg: "bg-purple-50",
    headerText: "text-purple-800",
    countBg: "bg-purple-100",
    countText: "text-purple-700",
    borderColor: "border-purple-200",
  },
  {
    etapa: "ganado",
    label: "Ganado",
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-800",
    countBg: "bg-emerald-100",
    countText: "text-emerald-700",
    borderColor: "border-emerald-200",
  },
  {
    etapa: "perdido",
    label: "Perdido",
    headerBg: "bg-red-50",
    headerText: "text-red-800",
    countBg: "bg-red-100",
    countText: "text-red-700",
    borderColor: "border-red-200",
  },
];

const ORIGEN_LABEL: Record<OrigenContacto, string> = {
  instagram_agencia: "Instagram Agencia",
  facebook: "Facebook",
  recomendado: "Recomendado",
  web: "Web",
  instagram_agente: "Instagram Agente",
  otros: "Otros",
};

// ── PausaModal ────────────────────────────────────────────────────────────────

interface PausaModalProps {
  open: boolean;
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}

function PausaModal({ open, onConfirm, onCancel }: PausaModalProps) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(false);

  function handleConfirm() {
    if (!motivo.trim()) {
      setError(true);
      return;
    }
    onConfirm(motivo.trim());
    setMotivo("");
    setError(false);
  }

  function handleCancel() {
    setMotivo("");
    setError(false);
    onCancel();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCancel(); }}>
      <DialogContent onClose={handleCancel} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Motivo de pausa</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="motivo-pausa">
              ¿Por qué se pone en pausa este lead? <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motivo-pausa"
              placeholder="Ej: El cliente viaja en diciembre, retomar en noviembre..."
              value={motivo}
              onChange={(e) => { setMotivo(e.target.value); setError(false); }}
              rows={3}
            />
            {error && (
              <p className="text-xs text-red-500">Este campo es obligatorio.</p>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleConfirm}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  contacto: Contacto;
  canDrag: boolean;
  onDragStart: (id: string) => void;
  onClick: (id: string) => void;
}

function LeadCard({ contacto: c, canDrag, onDragStart, onClick }: CardProps) {
  return (
    <div
      draggable={canDrag}
      onDragStart={() => canDrag && onDragStart(c.id)}
      onClick={() => onClick(c.id)}
      className={cn(
        "bg-white rounded-lg border border-neutral-200 p-3 shadow-sm space-y-1.5",
        "cursor-pointer hover:border-blue-300 hover:shadow-md transition-all",
        canDrag && "active:opacity-70",
        !canDrag && "cursor-not-allowed opacity-60"
      )}
    >
      <p className="font-medium text-sm text-neutral-900 leading-tight">
        {c.nombre} {c.apellido}
      </p>
      {c.destinoInteres && (
        <p className="text-xs text-neutral-500 truncate">{c.destinoInteres}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-block text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded">
          {ORIGEN_LABEL[c.origen]}
        </span>
      </div>
      {c.notas && (
        <p className="text-xs text-neutral-400 line-clamp-2">{c.notas}</p>
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────

interface ColumnProps {
  col: Column;
  cards: Contacto[];
  canDrag: (c: Contacto) => boolean;
  onDragStart: (id: string) => void;
  onDrop: (etapa: EtapaLead) => void;
  onClick: (id: string) => void;
  successId?: string;
}

function KanbanColumn({ col, cards, canDrag, onDragStart, onDrop, onClick, successId }: ColumnProps) {
  const [over, setOver] = useState(false);

  return (
    <div className="flex flex-col min-w-[220px] w-[220px]">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0",
          col.headerBg,
          col.borderColor
        )}
      >
        <span className={cn("text-sm font-semibold", col.headerText)}>
          {col.label}
        </span>
        <span
          className={cn(
            "text-xs font-bold rounded-full px-2 py-0.5",
            col.countBg,
            col.countText
          )}
        >
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "flex-1 min-h-[400px] rounded-b-lg border p-2 space-y-2 overflow-y-auto transition-colors",
          col.borderColor,
          over ? "bg-blue-50/60" : "bg-neutral-50"
        )}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={() => { setOver(false); onDrop(col.etapa); }}
      >
        {cards.map((c) => (
          <div key={c.id} className="space-y-1">
            <LeadCard
              contacto={c}
              canDrag={canDrag(c)}
              onDragStart={onDragStart}
              onClick={onClick}
            />
            {successId === c.id && (
              <p className="text-[10px] text-emerald-600 font-medium text-center">
                Convertido a cliente
              </p>
            )}
          </div>
        ))}
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-neutral-300">
            Sin leads
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface LeadsKanbanProps {
  contactos: Contacto[];
}

export function LeadsKanban({ contactos }: LeadsKanbanProps) {
  const { moveContacto } = useData();
  const { rol, usuario } = useRole();
  const router = useRouter();

  const dragId = useRef<string | null>(null);
  const [pausaOpen, setPausaOpen] = useState(false);
  const [successId, setSuccessId] = useState<string | undefined>(undefined);

  function canDrag(c: Contacto): boolean {
    if (rol === "admin") return true;
    return c.agenteId === usuario.id;
  }

  function handleDragStart(id: string) {
    dragId.current = id;
  }

  // Store the pending contacto id while modal is open
  const pendingId = useRef<string | null>(null);

  function handlePausaConfirm(motivo: string) {
    setPausaOpen(false);
    if (pendingId.current) {
      moveContacto(pendingId.current, "en_pausa", motivo);
      pendingId.current = null;
    }
  }

  function handleDropWithPause(etapa: EtapaLead) {
    const id = dragId.current;
    if (!id) return;

    if (etapa === "en_pausa") {
      pendingId.current = id;
      dragId.current = null;
      setPausaOpen(true);
      return;
    }

    dragId.current = null;
    moveContacto(id, etapa);

    if (etapa === "ganado") {
      setSuccessId(id);
      setTimeout(() => setSuccessId(undefined), 3000);
    }
  }

  function handlePausaCancel() {
    pendingId.current = null;
    setPausaOpen(false);
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const cards = contactos.filter((c) => c.etapa === col.etapa);
          return (
            <KanbanColumn
              key={col.etapa}
              col={col}
              cards={cards}
              canDrag={canDrag}
              onDragStart={handleDragStart}
              onDrop={handleDropWithPause}
              onClick={(id) => router.push(`/leads/${id}`)}
              successId={successId}
            />
          );
        })}
      </div>

      <PausaModal
        open={pausaOpen}
        onConfirm={handlePausaConfirm}
        onCancel={handlePausaCancel}
      />
    </>
  );
}
