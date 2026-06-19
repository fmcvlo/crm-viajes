"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Usuario,
  Contacto,
  Reserva,
  ItemReserva,
  Proveedor,
  Comision,
  Objetivo,
  EventoCalendario,
  AutomatizacionEmail,
  Notificacion,
  EtapaLead,
  EstadoReserva,
  EstadoComision,
} from "@/lib/types";
import {
  seedUsuarios,
  seedContactos,
  seedReservas,
  seedProveedores,
  seedComisiones,
  seedObjetivos,
  seedEventos,
  seedAutomatizaciones,
  seedNotificaciones,
} from "@/lib/data/seed";

// ─── Estado y acciones ────────────────────────────────────────────────────────

interface DataState {
  usuarios: Usuario[];
  contactos: Contacto[];
  reservas: Reserva[];
  proveedores: Proveedor[];
  comisiones: Comision[];
  objetivos: Objetivo[];
  eventos: EventoCalendario[];
  automatizaciones: AutomatizacionEmail[];
  notificaciones: Notificacion[];
}

interface DataActions {
  // Contactos
  addContacto: (c: Omit<Contacto, "id" | "fechaCreacion">) => string;
  updateContacto: (id: string, patch: Partial<Contacto>) => void;
  moveContacto: (id: string, etapa: EtapaLead, motivoPausa?: string) => void;
  deleteContacto: (id: string) => void;

  // Reservas
  addReserva: (r: Omit<Reserva, "id" | "fechaCreacion">) => string;
  updateReserva: (id: string, patch: Partial<Reserva>) => void;
  cambiarEstadoReserva: (id: string, estado: EstadoReserva, agenteId: string, rolActual: "admin" | "agente") => void;
  addItem: (reservaId: string, item: Omit<ItemReserva, "id">) => void;
  updateItem: (reservaId: string, itemId: string, patch: Partial<ItemReserva>) => void;
  removeItem: (reservaId: string, itemId: string) => void;

  // Proveedores
  addProveedor: (p: Omit<Proveedor, "id">) => void;
  updateProveedor: (id: string, patch: Partial<Proveedor>) => void;

  // Comisiones
  setEstadoComision: (id: string, estado: EstadoComision) => void;
  updateComisionMonto: (id: string, monto: number) => void;

  // Objetivos
  addObjetivo: (o: Omit<Objetivo, "id">) => void;
  updateObjetivo: (id: string, patch: Partial<Objetivo>) => void;
  deleteObjetivo: (id: string) => void;

  // Eventos
  addEvento: (e: Omit<EventoCalendario, "id">) => void;
  updateEvento: (id: string, patch: Partial<EventoCalendario>) => void;
  toggleEvento: (id: string) => void;
  deleteEvento: (id: string) => void;

  // Notificaciones
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: (usuarioId: string) => void;

  // Automatizaciones
  toggleAutomatizacion: (id: string) => void;

  // Demo
  resetDemo: () => void;
}

type DataContextValue = DataState & DataActions;

// ─── Context ──────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue | null>(null);

const STORAGE_KEY = "crm-agencia-data";

function getSeed(): DataState {
  return {
    usuarios: seedUsuarios,
    contactos: seedContactos,
    reservas: seedReservas,
    proveedores: seedProveedores,
    comisiones: seedComisiones,
    objetivos: seedObjetivos,
    eventos: seedEventos,
    automatizaciones: seedAutomatizaciones,
    notificaciones: seedNotificaciones,
  };
}

function loadState(): DataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DataState;
  } catch {
    // ignore
  }
  return getSeed();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>(getSeed);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setState(loadState());
  }, []);

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const set = useCallback(
    <K extends keyof DataState>(key: K, fn: (prev: DataState[K]) => DataState[K]) => {
      setState((s) => ({ ...s, [key]: fn(s[key]) }));
    },
    []
  );

  // ── Contactos ──────────────────────────────────────────────────────────────

  const addContacto = useCallback(
    (c: Omit<Contacto, "id" | "fechaCreacion">): string => {
      const id = "ctc-" + uid();
      set("contactos", (prev) => [
        ...prev,
        { ...c, id, fechaCreacion: new Date().toISOString().slice(0, 10) },
      ]);
      return id;
    },
    [set]
  );

  const updateContacto = useCallback(
    (id: string, patch: Partial<Contacto>) => {
      set("contactos", (prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    [set]
  );

  const moveContacto = useCallback(
    (id: string, etapa: EtapaLead, motivoPausa?: string) => {
      set("contactos", (prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const next: Contacto = { ...c, etapa, fechaUltimoContacto: new Date().toISOString().slice(0, 10) };
          if (etapa === "en_pausa") next.motivoPausa = motivoPausa ?? "";
          else next.motivoPausa = undefined;
          if (etapa === "ganado") next.tipo = "cliente";
          return next;
        })
      );
    },
    [set]
  );

  const deleteContacto = useCallback(
    (id: string) => {
      set("contactos", (prev) => prev.filter((c) => c.id !== id));
    },
    [set]
  );

  // ── Reservas ───────────────────────────────────────────────────────────────

  const addReserva = useCallback(
    (r: Omit<Reserva, "id" | "fechaCreacion">): string => {
      const id = "res-" + uid();
      set("reservas", (prev) => [
        ...prev,
        { ...r, id, fechaCreacion: new Date().toISOString().slice(0, 10) },
      ]);
      return id;
    },
    [set]
  );

  const updateReserva = useCallback(
    (id: string, patch: Partial<Reserva>) => {
      set("reservas", (prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      );
    },
    [set]
  );

  const cambiarEstadoReserva = useCallback(
    (id: string, estado: EstadoReserva, agenteId: string, rolActual: "admin" | "agente") => {
      set("reservas", (prev) =>
        prev.map((r) => {
          if (r.id !== id) return r;
          const patch: Partial<Reserva> = { estado };
          if (estado === "cancelada" && rolActual === "agente") {
            patch.cancelacionRequiereAprobacion = true;
          }
          return { ...r, ...patch };
        })
      );
      // Generate commission when accepted
      if (estado === "aceptada") {
        const reserva = state.reservas.find((r) => r.id === id);
        if (reserva) {
          const totalImporte = reserva.items.reduce((s, i) => s + i.importe, 0);
          const totalComision = reserva.items.reduce((s, i) => s + i.comisionEstimada, 0);
          const moneda = reserva.items[0]?.moneda ?? "USD";
          const pct = totalImporte > 0 ? Math.round((totalComision / totalImporte) * 100) : 10;
          const newCom: Comision = {
            id: "com-" + uid(),
            reservaId: id,
            agenteId,
            monto: totalComision,
            moneda,
            porcentaje: pct,
            estado: "pendiente",
            fechaCreacion: new Date().toISOString().slice(0, 10),
          };
          set("comisiones", (prev) => {
            const exists = prev.some((c) => c.reservaId === id);
            return exists ? prev : [...prev, newCom];
          });
        }
      }
    },
    [set, state.reservas]
  );

  const addItem = useCallback(
    (reservaId: string, item: Omit<ItemReserva, "id">) => {
      const id = "item-" + uid();
      set("reservas", (prev) =>
        prev.map((r) =>
          r.id === reservaId ? { ...r, items: [...r.items, { ...item, id }] } : r
        )
      );
    },
    [set]
  );

  const updateItem = useCallback(
    (reservaId: string, itemId: string, patch: Partial<ItemReserva>) => {
      set("reservas", (prev) =>
        prev.map((r) =>
          r.id === reservaId
            ? { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }
            : r
        )
      );
    },
    [set]
  );

  const removeItem = useCallback(
    (reservaId: string, itemId: string) => {
      set("reservas", (prev) =>
        prev.map((r) =>
          r.id === reservaId ? { ...r, items: r.items.filter((i) => i.id !== itemId) } : r
        )
      );
    },
    [set]
  );

  // ── Proveedores ────────────────────────────────────────────────────────────

  const addProveedor = useCallback(
    (p: Omit<Proveedor, "id">) => {
      set("proveedores", (prev) => [...prev, { ...p, id: "prov-" + uid() }]);
    },
    [set]
  );

  const updateProveedor = useCallback(
    (id: string, patch: Partial<Proveedor>) => {
      set("proveedores", (prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    [set]
  );

  // ── Comisiones ─────────────────────────────────────────────────────────────

  const setEstadoComision = useCallback(
    (id: string, estado: EstadoComision) => {
      set("comisiones", (prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const patch: Partial<Comision> = { estado };
          if (estado === "verificada") patch.fechaVerificacion = new Date().toISOString().slice(0, 10);
          if (estado === "pagada") patch.fechaPago = new Date().toISOString().slice(0, 10);
          return { ...c, ...patch };
        })
      );
    },
    [set]
  );

  const updateComisionMonto = useCallback(
    (id: string, monto: number) => {
      set("comisiones", (prev) =>
        prev.map((c) => (c.id === id ? { ...c, monto } : c))
      );
    },
    [set]
  );

  // ── Objetivos ──────────────────────────────────────────────────────────────

  const addObjetivo = useCallback(
    (o: Omit<Objetivo, "id">) => {
      set("objetivos", (prev) => [...prev, { ...o, id: "obj-" + uid() }]);
    },
    [set]
  );

  const updateObjetivo = useCallback(
    (id: string, patch: Partial<Objetivo>) => {
      set("objetivos", (prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      );
    },
    [set]
  );

  const deleteObjetivo = useCallback(
    (id: string) => {
      set("objetivos", (prev) => prev.filter((o) => o.id !== id));
    },
    [set]
  );

  // ── Eventos ────────────────────────────────────────────────────────────────

  const addEvento = useCallback(
    (e: Omit<EventoCalendario, "id">) => {
      set("eventos", (prev) => [...prev, { ...e, id: "evt-" + uid() }]);
    },
    [set]
  );

  const updateEvento = useCallback(
    (id: string, patch: Partial<EventoCalendario>) => {
      set("eventos", (prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    [set]
  );

  const toggleEvento = useCallback(
    (id: string) => {
      set("eventos", (prev) =>
        prev.map((e) => (e.id === id ? { ...e, completado: !e.completado } : e))
      );
    },
    [set]
  );

  const deleteEvento = useCallback(
    (id: string) => {
      set("eventos", (prev) => prev.filter((e) => e.id !== id));
    },
    [set]
  );

  // ── Notificaciones ─────────────────────────────────────────────────────────

  const marcarLeida = useCallback(
    (id: string) => {
      set("notificaciones", (prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    },
    [set]
  );

  const marcarTodasLeidas = useCallback(
    (usuarioId: string) => {
      set("notificaciones", (prev) =>
        prev.map((n) => (n.usuarioId === usuarioId ? { ...n, leida: true } : n))
      );
    },
    [set]
  );

  // ── Automatizaciones ───────────────────────────────────────────────────────

  const toggleAutomatizacion = useCallback(
    (id: string) => {
      set("automatizaciones", (prev) =>
        prev.map((a) => (a.id === id ? { ...a, activa: !a.activa } : a))
      );
    },
    [set]
  );

  // ── Reset demo ─────────────────────────────────────────────────────────────

  const resetDemo = useCallback(() => {
    const seed = getSeed();
    setState(seed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  }, []);

  const value: DataContextValue = {
    ...state,
    addContacto,
    updateContacto,
    moveContacto,
    deleteContacto,
    addReserva,
    updateReserva,
    cambiarEstadoReserva,
    addItem,
    updateItem,
    removeItem,
    addProveedor,
    updateProveedor,
    setEstadoComision,
    updateComisionMonto,
    addObjetivo,
    updateObjetivo,
    deleteObjetivo,
    addEvento,
    updateEvento,
    toggleEvento,
    deleteEvento,
    marcarLeida,
    marcarTodasLeidas,
    toggleAutomatizacion,
    resetDemo,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
