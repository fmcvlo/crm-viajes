"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { calcularEdad } from "@/lib/filters";
import { cn } from "@/lib/utils";
import type { EtapaLead, EstadoReserva } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ContactoForm } from "@/components/contactos/ContactoForm";
import { ArrowLeft, Pencil, ChevronDown, User, UserCheck } from "lucide-react";

// ── Label maps ────────────────────────────────────────────────────────────────

const ETAPA_LABEL: Record<EtapaLead, string> = {
  sin_contactar: "Sin contactar",
  contactado: "Contactado",
  cotizacion: "Cotización",
  en_pausa: "En pausa",
  ganado: "Ganado",
  perdido: "Perdido",
};

const ETAPAS: EtapaLead[] = [
  "sin_contactar",
  "contactado",
  "cotizacion",
  "en_pausa",
  "ganado",
  "perdido",
];

const ESTADO_RESERVA_LABEL: Record<EstadoReserva, string> = {
  creada: "Creada",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

function etapaBadgeClass(etapa: EtapaLead): string {
  return cn(
    "inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border",
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

function estadoBadgeClass(estado: EstadoReserva): string {
  return cn(
    "inline-block text-xs font-medium px-2 py-0.5 rounded-full border",
    {
      creada: "bg-neutral-100 text-neutral-600 border-neutral-200",
      enviada: "bg-violet-100 text-violet-700 border-violet-200",
      aceptada: "bg-emerald-100 text-emerald-700 border-emerald-200",
      rechazada: "bg-red-100 text-red-700 border-red-200",
      cancelada: "bg-red-100 text-red-600 border-red-200",
    }[estado]
  );
}

function formatFecha(fecha?: string): string {
  if (!fecha) return "—";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-3">
      <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-sm text-neutral-800">{value || "—"}</p>
    </div>
  );
}

// ── Timeline placeholder ──────────────────────────────────────────────────────

function TimelinePlaceholder({
  fechaCreacion,
  fechaUltimoContacto,
}: {
  fechaCreacion: string;
  fechaUltimoContacto?: string;
}) {
  const events = [
    { fecha: fechaCreacion, label: "Contacto creado", icon: "🟢" },
    ...(fechaUltimoContacto
      ? [{ fecha: fechaUltimoContacto, label: "Último contacto registrado", icon: "📞" }]
      : []),
  ].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <ol className="space-y-3">
      {events.map((ev, i) => (
        <li key={i} className="flex gap-3 items-start">
          <span className="text-base">{ev.icon}</span>
          <div>
            <p className="text-sm text-neutral-800">{ev.label}</p>
            <p className="text-xs text-neutral-400">{formatFecha(ev.fecha)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface ContactoDetailProps {
  id: string;
}

export function ContactoDetail({ id }: ContactoDetailProps) {
  const router = useRouter();
  const { contactos, reservas, usuarios, updateContacto, moveContacto } = useData();
  const { rol, usuario } = useRole();

  const [editOpen, setEditOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  const contacto = contactos.find((c) => c.id === id);

  if (!contacto) {
    return (
      <div className="p-6 flex flex-col items-center gap-4 text-center">
        <p className="text-neutral-500">Contacto no encontrado.</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft size={14} className="mr-1.5" />
          Volver
        </Button>
      </div>
    );
  }

  const isCliente = contacto.tipo === "cliente";
  const agente = usuarios.find((u) => u.id === contacto.agenteId);
  const agentes = usuarios.filter((u) => u.rol === "agente" && u.activo);

  const reservasVinculadas = reservas.filter((r) => r.clienteId === id);

  const familiarContactos = (contacto.grupoFamiliar ?? [])
    .map((fid) => contactos.find((c) => c.id === fid))
    .filter(Boolean);

  function handleConvertir() {
    setConvertLoading(true);
    updateContacto(contacto!.id, { tipo: "cliente" });
    setConvertLoading(false);
  }

  function handleCambiarEtapa(etapa: EtapaLead) {
    moveContacto(contacto!.id, etapa);
  }

  function handleReasignarAgente(agenteId: string) {
    updateContacto(contacto!.id, { agenteId });
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1"
        >
          <ArrowLeft size={14} />
          Volver
        </Button>
      </div>

      {/* Profile header */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">
                {contacto.nombre[0]}{contacto.apellido[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">
                {contacto.nombre} {contacto.apellido}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* Tipo badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                    isCliente
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  )}
                >
                  {isCliente ? <UserCheck size={11} /> : <User size={11} />}
                  {isCliente ? "Cliente" : "Lead"}
                </span>

                {/* Etapa badge + dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={cn(
                      etapaBadgeClass(contacto.etapa),
                      "inline-flex items-center gap-1 cursor-pointer hover:opacity-80"
                    )}
                  >
                    {ETAPA_LABEL[contacto.etapa]}
                    <ChevronDown size={10} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {ETAPAS.map((e) => (
                      <DropdownMenuItem
                        key={e}
                        onClick={() => handleCambiarEtapa(e)}
                        className={cn(e === contacto.etapa && "font-semibold")}
                      >
                        {ETAPA_LABEL[e]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isCliente && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleConvertir}
                disabled={convertLoading}
              >
                <UserCheck size={14} />
                Convertir a cliente
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditOpen(true)}
              className="gap-1.5"
            >
              <Pencil size={13} />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact data */}
        <Section title="Datos de contacto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Teléfono" value={contacto.telefono} />
            <Field label="Email" value={contacto.email} />
            <Field label="País" value={contacto.pais} />
            <Field label="Destino de interés" value={contacto.destinoInteres} />
            <Field
              label="Origen"
              value={{
                instagram_agencia: "Instagram Agencia",
                facebook: "Facebook",
                recomendado: "Recomendado",
                web: "Web",
                instagram_agente: "Instagram Agente",
                otros: "Otros",
              }[contacto.origen]}
            />
            <Field label="Fecha de creación" value={formatFecha(contacto.fechaCreacion)} />
            <Field label="Último contacto" value={formatFecha(contacto.fechaUltimoContacto)} />
          </div>
        </Section>

        {/* Agente */}
        <Section title="Agente asignado">
          {rol === "admin" ? (
            <div className="space-y-2">
              <p className="text-sm text-neutral-700">
                {agente ? `${agente.nombre} ${agente.apellido}` : "Sin asignar"}
              </p>
              <select
                className="flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={contacto.agenteId}
                onChange={(e) => handleReasignarAgente(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} {a.apellido}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Field
              label="Nombre"
              value={agente ? `${agente.nombre} ${agente.apellido}` : "—"}
            />
          )}
        </Section>
      </div>

      {/* Notas */}
      {contacto.notas && (
        <Section title="Notas">
          <p className="text-sm text-neutral-700 whitespace-pre-line">{contacto.notas}</p>
        </Section>
      )}

      {/* Motivo de pausa */}
      {contacto.etapa === "en_pausa" && contacto.motivoPausa && (
        <Section title="Motivo de pausa">
          <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
            {contacto.motivoPausa}
          </p>
        </Section>
      )}

      {/* Timeline */}
      <Section title="Historial">
        <TimelinePlaceholder
          fechaCreacion={contacto.fechaCreacion}
          fechaUltimoContacto={contacto.fechaUltimoContacto}
        />
      </Section>

      {/* ── Cliente-only sections ── */}
      {isCliente && (
        <>
          {/* Personal data */}
          <Section title="Datos personales">
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Fecha de nacimiento"
                value={
                  contacto.fechaNacimiento
                    ? `${formatFecha(contacto.fechaNacimiento)} (${calcularEdad(contacto.fechaNacimiento)} años)`
                    : undefined
                }
              />
              <Field label="N° Pasaporte" value={contacto.pasaporteNumero} />
              <Field
                label="Vencimiento de pasaporte"
                value={formatFecha(contacto.pasaporteVencimiento)}
              />
            </div>
          </Section>

          {/* Preferencias */}
          <Section title="Preferencias">
            <div className="grid grid-cols-1 gap-3">
              <Field
                label="Restricciones alimentarias"
                value={contacto.preferencias?.restricciones}
              />
              <Field
                label="Aerolíneas preferidas"
                value={contacto.preferencias?.aerolineas}
              />
              <Field
                label="Hoteles preferidos"
                value={contacto.preferencias?.hoteles}
              />
            </div>
          </Section>

          {/* Grupo familiar */}
          {(contacto.grupoFamiliar?.length ?? 0) > 0 && (
            <Section title="Grupo familiar">
              <ul className="space-y-1.5">
                {familiarContactos.map((fam) => {
                  if (!fam) return null;
                  return (
                    <li key={fam.id}>
                      <Link
                        href={`/leads/${fam.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {fam.nombre} {fam.apellido}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          {/* Reservas vinculadas */}
          <Section title="Reservas">
            {reservasVinculadas.length === 0 ? (
              <p className="text-sm text-neutral-400">Sin reservas vinculadas.</p>
            ) : (
              <ul className="space-y-2">
                {reservasVinculadas.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0"
                  >
                    <span className="text-sm text-neutral-800">{r.nombre}</span>
                    <span className={estadoBadgeClass(r.estado)}>
                      {ESTADO_RESERVA_LABEL[r.estado]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent onClose={() => setEditOpen(false)} className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          <ContactoForm
            open={editOpen}
            onOpenChange={setEditOpen}
            contacto={contacto}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
