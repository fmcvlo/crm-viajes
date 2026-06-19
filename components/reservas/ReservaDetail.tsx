"use client";

import { useState, useEffect, useId } from "react";
import Link from "next/link";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { toUSD, formatMoneda } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import type { EstadoReserva, CategoriaItem, ItemReserva, Moneda } from "@/lib/types";

const ESTADO_BADGE: Record<EstadoReserva, { label: string; className: string }> = {
  creada:    { label: "Creada",    className: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  enviada:   { label: "Enviada",   className: "bg-violet-100 text-violet-700 border-violet-200" },
  aceptada:  { label: "Aceptada",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rechazada: { label: "Rechazada", className: "bg-red-100 text-red-700 border-red-200" },
  cancelada: { label: "Cancelada", className: "bg-red-100 text-red-700 border-red-200" },
};

const CATEGORIA_LABELS: Record<CategoriaItem, string> = {
  hotel: "Hotel",
  vuelo: "Vuelo",
  parque: "Parque",
  transfer: "Transfer",
  seguro: "Seguro",
  crucero: "Crucero",
  otro: "Otro",
};

// Transiciones de estado válidas
const TRANSICIONES: Record<EstadoReserva, EstadoReserva[]> = {
  creada:    ["enviada", "cancelada"],
  enviada:   ["aceptada", "rechazada", "cancelada"],
  aceptada:  ["cancelada"],
  rechazada: [],
  cancelada: [],
};

// ─── ItemForm ─────────────────────────────────────────────────────────────────

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservaId: string;
  item?: ItemReserva;
}

const ITEM_EMPTY: Omit<ItemReserva, "id"> = {
  proveedorId: "",
  categoria: "hotel",
  producto: "",
  checkIn: "",
  checkOut: "",
  cantidad: 1,
  importe: 0,
  moneda: "USD",
  comisionEstimada: 0,
};

function ItemForm({ open, onOpenChange, reservaId, item }: ItemFormProps) {
  const { proveedores, addItem, updateItem } = useData();
  const idBase = useId();
  const isEdit = !!item;

  const [form, setForm] = useState<Omit<ItemReserva, "id">>(ITEM_EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setError("");
      setForm(item ? { ...item } : { ...ITEM_EMPTY });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.producto.trim()) return setError("El producto es obligatorio.");
    if (form.importe <= 0) return setError("El importe debe ser mayor a 0.");
    if (form.comisionEstimada < 0) return setError("La comisión estimada no puede ser negativa.");

    const payload = {
      ...form,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      cantidad: Number(form.cantidad),
      importe: Number(form.importe),
      comisionEstimada: Number(form.comisionEstimada),
    };

    if (isEdit && item) {
      updateItem(reservaId, item.id, payload);
    } else {
      addItem(reservaId, payload);
    }

    onOpenChange(false);
  }

  const proveedoresActivos = proveedores.filter((p) => p.activo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar ítem" : "Agregar ítem"}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Proveedor */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-proveedor`}>Proveedor</Label>
            <select
              id={`${idBase}-proveedor`}
              value={form.proveedorId}
              onChange={(e) => set("proveedorId", e.target.value)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin proveedor</option>
              {proveedoresActivos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-categoria`}>Categoría</Label>
            <select
              id={`${idBase}-categoria`}
              value={form.categoria}
              onChange={(e) => set("categoria", e.target.value as CategoriaItem)}
              className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(CATEGORIA_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Producto */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-producto`}>
              Producto <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idBase}-producto`}
              value={form.producto}
              onChange={(e) => set("producto", e.target.value)}
              placeholder="Ej: Hotel Disney All-Star Movies"
            />
          </div>

          {/* Check-in / Check-out */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`${idBase}-checkin`}>Check-in</Label>
              <Input
                id={`${idBase}-checkin`}
                type="date"
                value={form.checkIn ?? ""}
                onChange={(e) => set("checkIn", e.target.value || undefined)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${idBase}-checkout`}>Check-out</Label>
              <Input
                id={`${idBase}-checkout`}
                type="date"
                value={form.checkOut ?? ""}
                onChange={(e) => set("checkOut", e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Cantidad */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-cantidad`}>Cantidad</Label>
            <Input
              id={`${idBase}-cantidad`}
              type="number"
              min={1}
              value={form.cantidad}
              onChange={(e) => set("cantidad", Number(e.target.value))}
            />
          </div>

          {/* Importe + Moneda */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor={`${idBase}-importe`}>
                Importe <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${idBase}-importe`}
                type="number"
                min={0}
                step="0.01"
                value={form.importe}
                onChange={(e) => set("importe", Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${idBase}-moneda`}>Moneda</Label>
              <select
                id={`${idBase}-moneda`}
                value={form.moneda}
                onChange={(e) => set("moneda", e.target.value as Moneda)}
                className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="USD">USD</option>
                <option value="ARS">ARS</option>
              </select>
            </div>
          </div>

          {/* Comisión estimada */}
          <div className="space-y-1">
            <Label htmlFor={`${idBase}-comision`}>
              Comisión estimada <span className="text-red-500">*</span>
            </Label>
            <Input
              id={`${idBase}-comision`}
              type="number"
              min={0}
              step="0.01"
              value={form.comisionEstimada}
              onChange={(e) => set("comisionEstimada", Number(e.target.value))}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>{isEdit ? "Guardar cambios" : "Agregar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ReservaDetail ────────────────────────────────────────────────────────────

interface ReservaDetailProps {
  id: string;
}

export function ReservaDetail({ id }: ReservaDetailProps) {
  const { reservas, contactos, usuarios, proveedores, cambiarEstadoReserva, removeItem, updateReserva } =
    useData();
  const { rol, usuario } = useRole();

  const reserva = reservas.find((r) => r.id === id);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemReserva | undefined>();
  const [notas, setNotas] = useState(reserva?.notas ?? "");
  const [notasGuardadas, setNotasGuardadas] = useState(false);

  if (!reserva) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Reserva no encontrada.</p>
        <Link href="/reservas" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          ← Volver a reservas
        </Link>
      </div>
    );
  }

  const cliente = contactos.find((c) => c.id === reserva.clienteId);
  const agente = usuarios.find((u) => u.id === reserva.agenteId);
  const badge = ESTADO_BADGE[reserva.estado];
  const transiciones = TRANSICIONES[reserva.estado];

  // Montos
  const itemsUSD = reserva.items.filter((i) => i.moneda === "USD");
  const itemsARS = reserva.items.filter((i) => i.moneda === "ARS");
  const totalUSDitems = itemsUSD.reduce((s, i) => s + i.importe, 0);
  const totalARSitems = itemsARS.reduce((s, i) => s + i.importe, 0);
  const totalUSD = reserva.items.reduce((s, i) => s + toUSD(i.importe, i.moneda), 0);
  const totalComision = reserva.items.reduce((s, i) => s + i.comisionEstimada, 0);

  function handleEstado(estado: EstadoReserva) {
    if (estado === "cancelada" && rol === "agente") {
      // warning shown inline; still call the action which sets cancelacionRequiereAprobacion
    }
    cambiarEstadoReserva(id, estado, usuario.id, rol);
  }

  function handleGuardarNotas() {
    updateReserva(id, { notas });
    setNotasGuardadas(true);
    setTimeout(() => setNotasGuardadas(false), 2000);
  }

  function getNombreProveedor(pid: string) {
    return proveedores.find((p) => p.id === pid)?.nombre ?? "—";
  }

  function openAddItem() {
    setEditingItem(undefined);
    setItemFormOpen(true);
  }

  function openEditItem(item: ItemReserva) {
    setEditingItem(item);
    setItemFormOpen(true);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/reservas"
          className="text-sm text-neutral-500 hover:text-neutral-800 mt-1"
        >
          ← Volver
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-neutral-900">{reserva.nombre}</h1>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
                badge.className
              )}
            >
              {badge.label}
            </span>
            {reserva.cancelacionRequiereAprobacion && (
              <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
                Cancelación pendiente aprobación
              </span>
            )}
          </div>
          <div className="mt-1 text-sm text-neutral-500 flex flex-wrap gap-3">
            <span>
              Cliente:{" "}
              <span className="text-neutral-700 font-medium">
                {cliente ? `${cliente.nombre} ${cliente.apellido}` : "—"}
              </span>
            </span>
            <span>
              Agente:{" "}
              <span className="text-neutral-700 font-medium">
                {agente ? `${agente.nombre} ${agente.apellido}` : "—"}
              </span>
            </span>
            <span>
              Creada:{" "}
              <span className="text-neutral-700">
                {new Date(reserva.fechaCreacion).toLocaleDateString("es-AR")}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <InfoCard label="Pasajeros" value={String(reserva.pasajeros)} />
        <InfoCard
          label="Límite de pago"
          value={
            reserva.fechaLimitePago
              ? new Date(reserva.fechaLimitePago).toLocaleDateString("es-AR")
              : "—"
          }
        />
        <InfoCard label="Alerta parques" value={reserva.alertaParques ? "Sí" : "No"} />
        <InfoCard label="Requiere hotel" value={reserva.requiereHotel ? "Sí" : "No"} />
        <InfoCard label="Requiere restaurante" value={reserva.requiereRestaurante ? "Sí" : "No"} />
        <InfoCard
          label="Envío de guía"
          value={
            reserva.fechaEnvioGuia
              ? new Date(reserva.fechaEnvioGuia).toLocaleDateString("es-AR")
              : "—"
          }
        />
      </div>

      {/* Montos */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 flex flex-wrap gap-6">
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Monto total (USD)</p>
          <p className="text-xl font-semibold text-neutral-900">{formatMoneda(totalUSD, "USD")}</p>
          <div className="text-xs text-neutral-500 mt-1 space-y-0.5">
            {totalUSDitems > 0 && <p>USD: {formatMoneda(totalUSDitems, "USD")}</p>}
            {totalARSitems > 0 && <p>ARS: {formatMoneda(totalARSitems, "ARS")}</p>}
          </div>
        </div>
        <div>
          <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Comisión estimada</p>
          <p className="text-xl font-semibold text-blue-600">{formatMoneda(totalComision, "USD")}</p>
        </div>
      </div>

      {/* Cambio de estado */}
      {transiciones.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 space-y-2">
          <p className="text-sm font-medium text-neutral-700">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {transiciones.map((est) => {
              const isCancel = est === "cancelada";
              const isAgenteCancel = isCancel && rol === "agente";
              return (
                <div key={est} className="flex flex-col items-start gap-1">
                  <Button
                    size="sm"
                    variant={est === "aceptada" ? "default" : est === "cancelada" || est === "rechazada" ? "destructive" : "outline"}
                    onClick={() => handleEstado(est)}
                  >
                    {ESTADO_BADGE[est].label}
                  </Button>
                  {isAgenteCancel && (
                    <span className="text-xs text-amber-600">Requiere aprobación del admin</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ítems */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">Ítems de la reserva</h2>
          <Button size="sm" onClick={openAddItem}>
            + Agregar ítem
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Proveedor</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Categoría</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Producto</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Check-in</th>
                <th className="text-left px-4 py-2.5 font-medium text-neutral-600">Check-out</th>
                <th className="text-right px-4 py-2.5 font-medium text-neutral-600">Cant.</th>
                <th className="text-right px-4 py-2.5 font-medium text-neutral-600">Importe</th>
                <th className="text-right px-4 py-2.5 font-medium text-neutral-600">Comisión est.</th>
                <th className="text-right px-4 py-2.5 font-medium text-neutral-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reserva.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-neutral-400">
                    No hay ítems. Agregá el primero.
                  </td>
                </tr>
              ) : (
                reserva.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-neutral-700">
                      {getNombreProveedor(item.proveedorId)}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {CATEGORIA_LABELS[item.categoria]}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-neutral-900">{item.producto}</td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {item.checkIn
                        ? new Date(item.checkIn).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600">
                      {item.checkOut
                        ? new Date(item.checkOut).toLocaleDateString("es-AR")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right text-neutral-700">{item.cantidad}</td>
                    <td className="px-4 py-2.5 text-right text-neutral-900 font-medium">
                      {formatMoneda(item.importe, item.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-blue-600">
                      {formatMoneda(item.comisionEstimada, item.moneda)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditItem(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(reserva.id, item.id)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notas */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4 space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Notas internas</h2>
        <Textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={4}
          placeholder="Observaciones, requerimientos especiales, etc."
        />
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleGuardarNotas}>
            Guardar notas
          </Button>
          {notasGuardadas && (
            <span className="text-sm text-emerald-600">Notas guardadas.</span>
          )}
        </div>
      </div>

      {/* Item Form Dialog */}
      <ItemForm
        open={itemFormOpen}
        onOpenChange={setItemFormOpen}
        reservaId={reserva.id}
        item={editingItem}
      />
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-3">
      <p className="text-xs text-neutral-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  );
}
