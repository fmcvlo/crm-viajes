"use client";

import { useState, useEffect, useId } from "react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Reserva } from "@/lib/types";

interface ReservaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reserva?: Reserva;
}

const EMPTY: Omit<Reserva, "id" | "fechaCreacion" | "items"> = {
  nombre: "",
  clienteId: "",
  agenteId: "",
  estado: "creada",
  pasajeros: 1,
  fechaLimitePago: "",
  alertaParques: false,
  requiereHotel: false,
  requiereRestaurante: false,
  fechaEnvioGuia: "",
  notas: "",
};

export function ReservaForm({ open, onOpenChange, reserva }: ReservaFormProps) {
  const { contactos, usuarios, addReserva, updateReserva } = useData();
  const { rol, usuario } = useRole();

  const idBase = useId();
  const isEdit = !!reserva;

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      if (reserva) {
        setForm({
          nombre: reserva.nombre,
          clienteId: reserva.clienteId,
          agenteId: reserva.agenteId,
          estado: reserva.estado,
          pasajeros: reserva.pasajeros,
          fechaLimitePago: reserva.fechaLimitePago ?? "",
          alertaParques: reserva.alertaParques,
          requiereHotel: reserva.requiereHotel,
          requiereRestaurante: reserva.requiereRestaurante,
          fechaEnvioGuia: reserva.fechaEnvioGuia ?? "",
          notas: reserva.notas ?? "",
        });
      } else {
        setForm({ ...EMPTY, agenteId: rol === "agente" ? usuario.id : "" });
      }
    }
  }, [open, reserva, rol, usuario.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (!form.clienteId) return setError("Seleccioná un cliente.");
    if (!form.agenteId) return setError("Seleccioná un agente.");
    if (form.pasajeros < 1) return setError("El número de pasajeros debe ser mayor a 0.");

    const payload = {
      ...form,
      pasajeros: Number(form.pasajeros),
      fechaLimitePago: form.fechaLimitePago || undefined,
      fechaEnvioGuia: form.fechaEnvioGuia || undefined,
      notas: form.notas || undefined,
      items: reserva?.items ?? [],
    };

    if (isEdit && reserva) {
      updateReserva(reserva.id, payload);
    } else {
      addReserva(payload);
    }

    onOpenChange(false);
  }

  const clientes = contactos; // show all contacts; filter to tipo="cliente" only if any exist
  const clientesFiltrados =
    contactos.filter((c) => c.tipo === "cliente").length > 0
      ? contactos.filter((c) => c.tipo === "cliente")
      : contactos;

  const agentes = usuarios.filter((u) => u.activo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-nombre`}>
              Nombre de la reserva <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idBase}-nombre`}
              value={form.nombre}
              onChange={(e) => set("nombre", e.target.value)}
              placeholder="Ej: Viaje Orlando Familia García"
            />
          </div>

          {/* Cliente */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-cliente`}>
              Cliente <span className="text-red-500">*</span>
            </Label>
            <select
              id={`${idBase}-cliente`}
              value={form.clienteId}
              onChange={(e) => set("clienteId", e.target.value)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccioná un cliente</option>
              {clientesFiltrados.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>

          {/* Agente */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-agente`}>
              Agente <span className="text-red-500">*</span>
            </Label>
            {rol === "agente" ? (
              <Input
                id={`${idBase}-agente`}
                value={`${usuario.nombre} ${usuario.apellido}`}
                disabled
              />
            ) : (
              <select
                id={`${idBase}-agente`}
                value={form.agenteId}
                onChange={(e) => set("agenteId", e.target.value)}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccioná un agente</option>
                {agentes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} {a.apellido}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Pasajeros */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-pasajeros`}>
              Pasajeros <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idBase}-pasajeros`}
              type="number"
              min={1}
              value={form.pasajeros}
              onChange={(e) => set("pasajeros", Number(e.target.value))}
            />
          </div>

          {/* Fecha límite pago */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-fecha-limite`}>Fecha límite de pago</Label>
            <Input
              id={`${idBase}-fecha-limite`}
              type="date"
              value={form.fechaLimitePago}
              onChange={(e) => set("fechaLimitePago", e.target.value)}
            />
          </div>

          {/* Fecha envío guía */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-fecha-guia`}>Fecha envío de guía</Label>
            <Input
              id={`${idBase}-fecha-guia`}
              type="date"
              value={form.fechaEnvioGuia}
              onChange={(e) => set("fechaEnvioGuia", e.target.value)}
            />
          </div>

          {/* Switches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idBase}-parques`}>Alerta parques</Label>
              <Switch
                id={`${idBase}-parques`}
                checked={form.alertaParques}
                onCheckedChange={(v) => set("alertaParques", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idBase}-hotel`}>Requiere hotel</Label>
              <Switch
                id={`${idBase}-hotel`}
                checked={form.requiereHotel}
                onCheckedChange={(v) => set("requiereHotel", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor={`${idBase}-restaurante`}>Requiere restaurante</Label>
              <Switch
                id={`${idBase}-restaurante`}
                checked={form.requiereRestaurante}
                onCheckedChange={(v) => set("requiereRestaurante", v)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-notas`}>Notas</Label>
            <Textarea
              id={`${idBase}-notas`}
              value={form.notas}
              onChange={(e) => set("notas", e.target.value)}
              rows={3}
              placeholder="Observaciones internas..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "Guardar cambios" : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
