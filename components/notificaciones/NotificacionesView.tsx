"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BellOff,
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { filtrarNotifPorUsuario } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notificacion } from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  Notificacion["tipo"],
  { Icon: React.ElementType; iconClass: string; dotClass: string }
> = {
  info: {
    Icon: Info,
    iconClass: "bg-blue-100 text-blue-600",
    dotClass: "bg-blue-500",
  },
  alerta: {
    Icon: AlertTriangle,
    iconClass: "bg-amber-100 text-amber-600",
    dotClass: "bg-amber-500",
  },
  exito: {
    Icon: CheckCircle2,
    iconClass: "bg-emerald-100 text-emerald-600",
    dotClass: "bg-emerald-500",
  },
  error: {
    Icon: XCircle,
    iconClass: "bg-red-100 text-red-600",
    dotClass: "bg-red-500",
  },
};

function formatRelativo(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const ahora = new Date();
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHoras = Math.floor(diffMin / 60);
  if (diffHoras < 24) return `hace ${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "ayer";
  if (diffDias < 30) return `hace ${diffDias} días`;
  const d = fecha.getDate().toString().padStart(2, "0");
  const m = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const y = fecha.getFullYear();
  return `${d}/${m}/${y}`;
}

// ─── NotificacionItem ─────────────────────────────────────────────────────────

interface ItemProps {
  notif: Notificacion;
  onRead: (id: string) => void;
  onNavigate: (enlace: string) => void;
}

function NotificacionItem({ notif, onRead, onNavigate }: ItemProps) {
  const cfg = TIPO_CONFIG[notif.tipo];
  const Icon = cfg.Icon;

  function handleClick() {
    if (!notif.leida) onRead(notif.id);
    if (notif.enlace) onNavigate(notif.enlace);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
        notif.leida
          ? "opacity-50 hover:opacity-70 hover:bg-neutral-50"
          : "bg-white hover:bg-blue-50/40",
        notif.enlace ? "cursor-pointer" : "cursor-default"
      )}
    >
      {/* Tipo icon */}
      <span
        className={cn(
          "mt-0.5 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          cfg.iconClass
        )}
      >
        <Icon size={16} />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-semibold text-neutral-900 leading-tight",
              notif.leida && "font-medium text-neutral-500"
            )}
          >
            {notif.titulo}
          </p>
          <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {formatRelativo(notif.fechaCreacion)}
          </span>
        </div>
        <p
          className={cn(
            "text-sm text-neutral-600 mt-0.5 leading-snug",
            notif.leida && "text-neutral-400"
          )}
        >
          {notif.mensaje}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.leida && (
        <span
          className={cn(
            "mt-2 flex-shrink-0 w-2 h-2 rounded-full",
            cfg.dotClass
          )}
        />
      )}
    </button>
  );
}

// ─── NotificacionesView ───────────────────────────────────────────────────────

export function NotificacionesView() {
  const { notificaciones, marcarLeida, marcarTodasLeidas } = useData();
  const { usuario } = useRole();
  const router = useRouter();

  const misNotificaciones = useMemo(
    () =>
      filtrarNotifPorUsuario(notificaciones, usuario.id).sort(
        (a, b) =>
          new Date(b.fechaCreacion).getTime() -
          new Date(a.fechaCreacion).getTime()
      ),
    [notificaciones, usuario.id]
  );

  const noLeidas = useMemo(
    () => misNotificaciones.filter((n) => !n.leida).length,
    [misNotificaciones]
  );

  function handleNavigate(enlace: string) {
    router.push(enlace);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-neutral-900">
              Notificaciones
            </h1>
            {noLeidas > 0 && (
              <Badge className="bg-blue-600 text-white h-5 px-2 text-xs">
                {noLeidas}
              </Badge>
            )}
          </div>

          {noLeidas > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarTodasLeidas(usuario.id)}
            >
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* List */}
        {misNotificaciones.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm py-16 flex flex-col items-center gap-3 text-neutral-400">
            <BellOff size={36} strokeWidth={1.5} />
            <p className="text-sm font-medium">No hay notificaciones</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden divide-y divide-neutral-100">
            {misNotificaciones.map((notif) => (
              <NotificacionItem
                key={notif.id}
                notif={notif}
                onRead={marcarLeida}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
