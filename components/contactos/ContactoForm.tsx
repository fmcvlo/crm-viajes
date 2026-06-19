"use client";

import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import type {
  Contacto,
  EtapaLead,
  OrigenContacto,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";

// ── Label maps ────────────────────────────────────────────────────────────────

const ORIGEN_OPTIONS: { value: OrigenContacto; label: string }[] = [
  { value: "instagram_agencia", label: "Instagram Agencia" },
  { value: "facebook", label: "Facebook" },
  { value: "recomendado", label: "Recomendado" },
  { value: "web", label: "Web" },
  { value: "instagram_agente", label: "Instagram Agente" },
  { value: "otros", label: "Otros" },
];

const ETAPA_OPTIONS: { value: EtapaLead; label: string }[] = [
  { value: "sin_contactar", label: "Sin contactar" },
  { value: "contactado", label: "Contactado" },
  { value: "cotizacion", label: "Cotización" },
  { value: "en_pausa", label: "En pausa" },
  { value: "ganado", label: "Ganado" },
  { value: "perdido", label: "Perdido" },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContactoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacto?: Contacto;
}

type FormState = {
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  pais: string;
  origen: OrigenContacto;
  destinoInteres: string;
  agenteId: string;
  etapa: EtapaLead;
  notas: string;
  // Cliente fields
  fechaNacimiento: string;
  pasaporteNumero: string;
  pasaporteVencimiento: string;
  restricciones: string;
  aerolineas: string;
  hoteles: string;
};

function buildInitial(contacto: Contacto | undefined, defaultAgenteId: string): FormState {
  return {
    nombre: contacto?.nombre ?? "",
    apellido: contacto?.apellido ?? "",
    telefono: contacto?.telefono ?? "",
    email: contacto?.email ?? "",
    pais: contacto?.pais ?? "",
    origen: contacto?.origen ?? "instagram_agencia",
    destinoInteres: contacto?.destinoInteres ?? "",
    agenteId: contacto?.agenteId ?? defaultAgenteId,
    etapa: contacto?.etapa ?? "sin_contactar",
    notas: contacto?.notas ?? "",
    fechaNacimiento: contacto?.fechaNacimiento ?? "",
    pasaporteNumero: contacto?.pasaporteNumero ?? "",
    pasaporteVencimiento: contacto?.pasaporteVencimiento ?? "",
    restricciones: contacto?.preferencias?.restricciones ?? "",
    aerolineas: contacto?.preferencias?.aerolineas ?? "",
    hoteles: contacto?.preferencias?.hoteles ?? "",
  };
}

// ── Shared select style ───────────────────────────────────────────────────────

const selectClass =
  "flex h-9 w-full rounded-md border border-neutral-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50";

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactoForm({ open, onOpenChange, contacto }: ContactoFormProps) {
  const { addContacto, updateContacto, usuarios } = useData();
  const { rol, usuario } = useRole();

  const isEdit = !!contacto;
  const isCliente = contacto?.tipo === "cliente";

  const agentes = usuarios.filter((u) => u.rol === "agente" && u.activo);

  const [form, setForm] = useState<FormState>(() =>
    buildInitial(contacto, usuario.id)
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens/target changes
  useEffect(() => {
    if (open) {
      setForm(buildInitial(contacto, usuario.id));
      setErrors({});
    }
  }, [open, contacto, usuario.id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.nombre.trim()) next.nombre = "Requerido";
    if (!form.apellido.trim()) next.apellido = "Requerido";
    if (!form.telefono.trim()) next.telefono = "Requerido";
    if (!form.email.trim()) next.email = "Requerido";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload: Omit<Contacto, "id" | "fechaCreacion"> = {
      tipo: contacto?.tipo ?? "lead",
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      pais: form.pais.trim() || undefined,
      origen: form.origen,
      destinoInteres: form.destinoInteres.trim() || undefined,
      agenteId: rol === "admin" ? form.agenteId : usuario.id,
      etapa: form.etapa,
      notas: form.notas.trim() || undefined,
      ...(isCliente && {
        fechaNacimiento: form.fechaNacimiento || undefined,
        pasaporteNumero: form.pasaporteNumero.trim() || undefined,
        pasaporteVencimiento: form.pasaporteVencimiento || undefined,
        preferencias: {
          restricciones: form.restricciones.trim() || undefined,
          aerolineas: form.aerolineas.trim() || undefined,
          hoteles: form.hoteles.trim() || undefined,
        },
      }),
    };

    if (isEdit && contacto) {
      updateContacto(contacto.id, payload);
    } else {
      addContacto(payload);
    }

    setLoading(false);
    onOpenChange(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogBody className="space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Row: nombre + apellido */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-nombre"
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Juan"
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && <p className="text-xs text-red-500">{errors.nombre}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-apellido">
              Apellido <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-apellido"
              value={form.apellido}
              onChange={(e) => set("apellido", e.target.value)}
              placeholder="García"
              aria-invalid={!!errors.apellido}
            />
            {errors.apellido && <p className="text-xs text-red-500">{errors.apellido}</p>}
          </div>
        </div>

        {/* Row: telefono + email */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-telefono">
              Teléfono <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="+54 11 1234-5678"
              aria-invalid={!!errors.telefono}
            />
            {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cf-email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="juan@ejemplo.com"
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        {/* Row: pais + destino */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-pais">País</Label>
            <Input
              id="cf-pais"
              value={form.pais}
              onChange={(e) => set("pais", e.target.value)}
              placeholder="Argentina"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-destino">Destino de interés</Label>
            <Input
              id="cf-destino"
              value={form.destinoInteres}
              onChange={(e) => set("destinoInteres", e.target.value)}
              placeholder="Orlando, USA"
            />
          </div>
        </div>

        {/* Row: origen + etapa */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cf-origen">Origen</Label>
            <select
              id="cf-origen"
              className={selectClass}
              value={form.origen}
              onChange={(e) => set("origen", e.target.value as OrigenContacto)}
            >
              {ORIGEN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cf-etapa">Etapa</Label>
            <select
              id="cf-etapa"
              className={selectClass}
              value={form.etapa}
              onChange={(e) => set("etapa", e.target.value as EtapaLead)}
            >
              {ETAPA_OPTIONS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Agente (admin only) */}
        {rol === "admin" && (
          <div className="space-y-1.5">
            <Label htmlFor="cf-agente">Agente asignado</Label>
            <select
              id="cf-agente"
              className={selectClass}
              value={form.agenteId}
              onChange={(e) => set("agenteId", e.target.value)}
            >
              <option value="">Sin asignar</option>
              {agentes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre} {a.apellido}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notas */}
        <div className="space-y-1.5">
          <Label htmlFor="cf-notas">Notas</Label>
          <Textarea
            id="cf-notas"
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={3}
          />
        </div>

        {/* ── Cliente fields ── */}
        {isCliente && (
          <>
            <hr className="border-neutral-100" />
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
              Datos de cliente
            </p>

            {/* Row: fecha nacimiento + pasaporte */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cf-fnac">Fecha de nacimiento</Label>
                <Input
                  id="cf-fnac"
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => set("fechaNacimiento", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cf-pasaporte">N° Pasaporte</Label>
                <Input
                  id="cf-pasaporte"
                  value={form.pasaporteNumero}
                  onChange={(e) => set("pasaporteNumero", e.target.value)}
                  placeholder="AAA123456"
                />
              </div>
            </div>

            {/* Pasaporte vencimiento */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-pasaporte-vto">Vencimiento de pasaporte</Label>
              <Input
                id="cf-pasaporte-vto"
                type="date"
                value={form.pasaporteVencimiento}
                onChange={(e) => set("pasaporteVencimiento", e.target.value)}
              />
            </div>

            {/* Preferencias */}
            <div className="space-y-1.5">
              <Label htmlFor="cf-restricciones">Restricciones alimentarias</Label>
              <Input
                id="cf-restricciones"
                value={form.restricciones}
                onChange={(e) => set("restricciones", e.target.value)}
                placeholder="Celíaco, vegetariano..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-aerolineas">Aerolíneas preferidas</Label>
              <Input
                id="cf-aerolineas"
                value={form.aerolineas}
                onChange={(e) => set("aerolineas", e.target.value)}
                placeholder="American Airlines, Aerolíneas Argentinas..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cf-hoteles">Hoteles preferidos</Label>
              <Input
                id="cf-hoteles"
                value={form.hoteles}
                onChange={(e) => set("hoteles", e.target.value)}
                placeholder="Disney resorts, cadenas Marriott..."
              />
            </div>
          </>
        )}
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={loading}
        >
          {isEdit ? "Guardar cambios" : "Crear contacto"}
        </Button>
      </DialogFooter>
    </form>
  );
}
