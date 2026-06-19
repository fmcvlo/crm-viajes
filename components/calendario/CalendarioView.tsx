"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Phone,
  Users,
  Bell,
  Calendar,
  Clock,
  Trash2,
  Check,
  LogIn,
  LogOut,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { filtrarPorRol } from "@/lib/filters";
import { cn } from "@/lib/utils";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EventoCalendario, TipoEvento } from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPO_CONFIG: Record<TipoEvento, { label: string; color: string; dot: string; Icon: React.ElementType }> = {
  llamada:      { label: "Llamada",      color: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",   Icon: Phone },
  seguimiento:  { label: "Seguimiento",  color: "bg-amber-100 text-amber-700",  dot: "bg-amber-500",  Icon: Clock },
  vencimiento:  { label: "Vencimiento",  color: "bg-red-100 text-red-700",      dot: "bg-red-500",    Icon: Bell },
  reunion:      { label: "Reunión",      color: "bg-violet-100 text-violet-700",dot: "bg-violet-500", Icon: Users },
  recordatorio: { label: "Recordatorio", color: "bg-neutral-100 text-neutral-600", dot: "bg-neutral-400", Icon: Bell },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatShort(iso: string): string {
  const d = parseLocalDate(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getDaysInGrid(year: number, month: number): Date[] {
  // month is 0-indexed
  const first = new Date(year, month, 1);
  // JS: 0=Sunday → map to Mon-based: Mon=0 … Sun=6
  const dayOfWeek = (first.getDay() + 6) % 7;
  const grid: Date[] = [];
  for (let i = -dayOfWeek; i < 42 - dayOfWeek; i++) {
    grid.push(new Date(year, month, 1 + i));
  }
  // Trim trailing row if fully outside month
  while (
    grid.length > 35 &&
    grid.slice(-7).every((d) => d.getMonth() !== month)
  ) {
    grid.splice(-7);
  }
  return grid;
}

// ─── EventoForm ──────────────────────────────────────────────────────────────

interface EventoFormProps {
  open: boolean;
  onClose: () => void;
  defaultFecha?: string;
  agenteId: string;
}

function EventoForm({ open, onClose, defaultFecha, agenteId }: EventoFormProps) {
  const { addEvento, contactos, reservas } = useData();
  const { rol } = useRole();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEvento>("recordatorio");
  const [fecha, setFecha] = useState(defaultFecha ?? "");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [contactoId, setContactoId] = useState("");
  const [reservaId, setReservaId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState("");

  const contactosFiltrados = useMemo(
    () => (rol === "admin" ? contactos : contactos.filter((c) => c.agenteId === agenteId)),
    [contactos, rol, agenteId]
  );

  const reservasFiltradas = useMemo(
    () => (rol === "admin" ? reservas : reservas.filter((r) => r.agenteId === agenteId)),
    [reservas, rol, agenteId]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) { setError("El título es requerido."); return; }
    if (!fecha) { setError("La fecha es requerida."); return; }
    addEvento({
      titulo: titulo.trim(),
      tipo,
      fecha,
      horaInicio: horaInicio || undefined,
      horaFin: horaFin || undefined,
      contactoId: contactoId || undefined,
      reservaId: reservaId || undefined,
      descripcion: descripcion.trim() || undefined,
      agenteId,
      completado: false,
      esAutoGenerado: false,
    });
    handleClose();
  }

  function handleClose() {
    setTitulo(""); setTipo("recordatorio"); setFecha(defaultFecha ?? "");
    setHoraInicio(""); setHoraFin(""); setContactoId(""); setReservaId("");
    setDescripcion(""); setError("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg w-full" onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Agregar recordatorio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="space-y-1.5">
              <Label htmlFor="ef-titulo">Título *</Label>
              <Input
                id="ef-titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Llamar a cliente"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoEvento)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TIPO_CONFIG) as TipoEvento[]).map((t) => (
                      <SelectItem key={t} value={t}>{TIPO_CONFIG[t].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ef-fecha">Fecha *</Label>
                <Input
                  id="ef-fecha"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ef-hora-inicio">Hora inicio</Label>
                <Input
                  id="ef-hora-inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ef-hora-fin">Hora fin</Label>
                <Input
                  id="ef-hora-fin"
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Select value={contactoId} onValueChange={(v) => setContactoId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin contacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin contacto</SelectItem>
                  {contactosFiltrados.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre} {c.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Reserva</Label>
              <Select value={reservaId} onValueChange={(v) => setReservaId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin reserva" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin reserva</SelectItem>
                  {reservasFiltradas.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ef-desc">Descripción</Label>
              <Textarea
                id="ef-desc"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                placeholder="Detalles opcionales..."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

interface DayPanelProps {
  open: boolean;
  fecha: Date | null;
  eventos: (EventoCalendario & { _isAuto?: boolean })[];
  onClose: () => void;
  onAddEvento: (fecha: string) => void;
}

function DayPanel({ open, fecha, eventos, onClose, onAddEvento }: DayPanelProps) {
  const { toggleEvento, deleteEvento, contactos, reservas } = useData();

  if (!fecha) return null;

  const label = `${String(fecha.getDate()).padStart(2, "0")}/${String(fecha.getMonth() + 1).padStart(2, "0")}/${fecha.getFullYear()}`;

  function getContactoNombre(id?: string) {
    if (!id) return null;
    const c = contactos.find((x) => x.id === id);
    return c ? `${c.nombre} ${c.apellido}` : null;
  }

  function getReservaNombre(id?: string) {
    if (!id) return null;
    return reservas.find((x) => x.id === id)?.nombre ?? null;
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md w-full" onClose={onClose}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar size={16} className="text-blue-600" />
            {label}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-2 min-h-[120px]">
          {eventos.length === 0 && (
            <p className="text-sm text-neutral-400 py-6 text-center">Sin eventos este día.</p>
          )}
          {eventos.map((ev) => {
            const cfg = TIPO_CONFIG[ev.tipo];
            const Icon = ev._isAuto ? (ev.titulo.startsWith("Check-out") ? LogOut : LogIn) : cfg.Icon;
            return (
              <div
                key={ev.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border",
                  ev.completado ? "bg-neutral-50 opacity-60" : "bg-white",
                  ev._isAuto ? "border-dashed border-neutral-300" : "border-neutral-200"
                )}
              >
                <span className={cn("mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center", cfg.color)}>
                  <Icon size={12} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-neutral-800 leading-tight", ev.completado && "line-through text-neutral-400")}>
                    {ev.titulo}
                  </p>
                  {(ev.horaInicio || ev.horaFin) && (
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {ev.horaInicio}{ev.horaFin ? ` → ${ev.horaFin}` : ""}
                    </p>
                  )}
                  {ev.descripcion && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{ev.descripcion}</p>
                  )}
                  {getContactoNombre(ev.contactoId) && (
                    <p className="text-xs text-blue-600 mt-0.5">{getContactoNombre(ev.contactoId)}</p>
                  )}
                  {getReservaNombre(ev.reservaId) && (
                    <p className="text-xs text-violet-600 mt-0.5">{getReservaNombre(ev.reservaId)}</p>
                  )}
                  {ev._isAuto && (
                    <Badge variant="outline" className="mt-1 text-[10px] py-0 h-4">Auto-generado</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!ev._isAuto && (
                    <button
                      onClick={() => toggleEvento(ev.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                        ev.completado
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-neutral-300 hover:border-emerald-400"
                      )}
                      title={ev.completado ? "Marcar pendiente" : "Marcar completado"}
                    >
                      {ev.completado && <Check size={10} />}
                    </button>
                  )}
                  {!ev._isAuto && !ev.esAutoGenerado && (
                    <button
                      onClick={() => deleteEvento(ev.id)}
                      className="w-6 h-6 rounded flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </DialogBody>
        <DialogFooter className="justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddEvento(toDateKey(fecha))}
            className="gap-1"
          >
            <Plus size={14} />
            Agregar
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── CalendarioView ───────────────────────────────────────────────────────────

export function CalendarioView() {
  const { eventos, reservas, usuarios } = useData();
  const { rol, usuario } = useRole();

  const [currentMonth, setCurrentMonth] = useState(() => new Date(2025, 4, 1)); // May 2025
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filterAgenteId, setFilterAgenteId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [formFecha, setFormFecha] = useState<string>("");

  const today = useMemo(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }, []);

  const agentes = useMemo(
    () => usuarios.filter((u) => u.activo),
    [usuarios]
  );

  // Auto-generated check-in / check-out from aceptada reservas
  const autoEventos = useMemo((): EventoCalendario[] => {
    const result: EventoCalendario[] = [];
    const source = rol === "admin"
      ? reservas
      : reservas.filter((r) => r.agenteId === usuario.id);
    for (const reserva of source) {
      if (reserva.estado !== "aceptada") continue;
      for (const item of reserva.items) {
        if (item.checkIn) {
          result.push({
            id: `auto-ci-${reserva.id}-${item.id}`,
            titulo: `Check-in: ${item.producto} (${reserva.nombre})`,
            tipo: "vencimiento",
            fecha: item.checkIn,
            agenteId: reserva.agenteId,
            reservaId: reserva.id,
            completado: false,
            esAutoGenerado: true,
          });
        }
        if (item.checkOut) {
          result.push({
            id: `auto-co-${reserva.id}-${item.id}`,
            titulo: `Check-out: ${item.producto} (${reserva.nombre})`,
            tipo: "vencimiento",
            fecha: item.checkOut,
            agenteId: reserva.agenteId,
            reservaId: reserva.id,
            completado: false,
            esAutoGenerado: true,
          });
        }
      }
    }
    return result;
  }, [reservas, rol, usuario.id]);

  // Merge + filter events
  const allEventos = useMemo(() => {
    const base = filtrarPorRol([...eventos, ...autoEventos], rol, usuario.id);
    if (rol === "admin" && filterAgenteId) {
      return base.filter((e) => e.agenteId === filterAgenteId);
    }
    return base;
  }, [eventos, autoEventos, rol, usuario.id, filterAgenteId]);

  // Map date-key → events
  const eventosByDay = useMemo(() => {
    const map = new Map<string, (EventoCalendario & { _isAuto?: boolean })[]>();
    for (const ev of allEventos) {
      const key = ev.fecha;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...ev, _isAuto: ev.esAutoGenerado });
    }
    return map;
  }, [allEventos]);

  const gridDays = useMemo(
    () => getDaysInGrid(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const prevMonth = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }, []);

  const goToday = useCallback(() => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  }, [today]);

  function openAddForm(fecha?: string) {
    setFormFecha(fecha ?? "");
    setShowForm(true);
  }

  const selectedDayEventos = useMemo(() => {
    if (!selectedDay) return [];
    return eventosByDay.get(toDateKey(selectedDay)) ?? [];
  }, [selectedDay, eventosByDay]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Calendario</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {rol === "admin" && (
              <Select value={filterAgenteId} onValueChange={(v) => setFilterAgenteId(v ?? "")}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todos los agentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los agentes</SelectItem>
                  {agentes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nombre} {a.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={prevMonth} className="px-2">
                <ChevronLeft size={16} />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday}>Hoy</Button>
              <Button variant="outline" size="sm" onClick={nextMonth} className="px-2">
                <ChevronRight size={16} />
              </Button>
            </div>

            <Button size="sm" onClick={() => openAddForm()} className="gap-1">
              <Plus size={14} />
              Agregar recordatorio
            </Button>
          </div>
        </div>

        {/* Calendar grid */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          {/* Day-of-week header */}
          <div className="grid grid-cols-7 border-b border-neutral-200">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-neutral-100">
            {gridDays.map((day, idx) => {
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isToday = toDateKey(day) === toDateKey(today);
              const dayKey = toDateKey(day);
              const dayEvts = eventosByDay.get(dayKey) ?? [];
              const isSelected = selectedDay && toDateKey(selectedDay) === dayKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "min-h-[100px] p-2 cursor-pointer transition-colors",
                    isCurrentMonth ? "bg-white hover:bg-blue-50/40" : "bg-neutral-50/60",
                    isSelected && "ring-2 ring-inset ring-blue-400"
                  )}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium",
                        isToday
                          ? "bg-blue-600 text-white"
                          : isCurrentMonth
                          ? "text-neutral-800"
                          : "text-neutral-300"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvts.length > 0 && (
                      <span className="text-[10px] text-neutral-400 font-medium">
                        {dayEvts.length}
                      </span>
                    )}
                  </div>

                  {/* Event chips — show up to 3, then "+N más" */}
                  <div className="space-y-0.5">
                    {dayEvts.slice(0, 3).map((ev) => {
                      const cfg = TIPO_CONFIG[ev.tipo];
                      return (
                        <div
                          key={ev.id}
                          className={cn(
                            "flex items-center gap-1 rounded px-1 py-0.5 text-[11px] font-medium leading-tight truncate",
                            cfg.color,
                            ev.completado && "opacity-50 line-through"
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      );
                    })}
                    {dayEvts.length > 3 && (
                      <p className="text-[10px] text-neutral-400 pl-1">
                        +{dayEvts.length - 3} más
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {(Object.entries(TIPO_CONFIG) as [TipoEvento, typeof TIPO_CONFIG[TipoEvento]][]).map(([tipo, cfg]) => (
            <div key={tipo} className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
              <span className="text-xs text-neutral-500">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day panel */}
      <DayPanel
        open={selectedDay !== null}
        fecha={selectedDay}
        eventos={selectedDayEventos}
        onClose={() => setSelectedDay(null)}
        onAddEvento={(fecha) => {
          setSelectedDay(null);
          openAddForm(fecha);
        }}
      />

      {/* New event form */}
      <EventoForm
        open={showForm}
        onClose={() => setShowForm(false)}
        defaultFecha={formFecha}
        agenteId={usuario.id}
      />
    </div>
  );
}
