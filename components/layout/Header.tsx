"use client";

import { Bell, ChevronDown } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import type { Rol } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ROL_LABELS: Record<Rol, string> = {
  admin: "Admin · Agencia",
  agente: "Agente · Usuario",
};

const ROL_BADGE_VARIANT: Record<Rol, "default" | "secondary"> = {
  admin: "default",
  agente: "secondary",
};

function getInitials(nombre: string, apellido: string): string {
  return `${nombre[0]}${apellido[0]}`.toUpperCase();
}

export function Header() {
  const { rol, setRol, usuario } = useRole();

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 bg-white shrink-0">
      {/* Breadcrumb placeholder */}
      <div className="text-sm text-neutral-400 hidden sm:block">
        CRM · Agencia de Viajes
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {/* Notificaciones */}
        <button className="relative p-1.5 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Selector de rol */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors text-sm cursor-pointer bg-white">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                {getInitials(usuario.nombre, usuario.apellido)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block font-medium text-neutral-700 max-w-[140px] truncate">
              {usuario.nombre} {usuario.apellido}
            </span>
            <Badge
              variant={ROL_BADGE_VARIANT[rol]}
              className="hidden sm:inline-flex text-[10px] py-0 h-4"
            >
              {rol === "admin" ? "Admin" : "Agente"}
            </Badge>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-neutral-500 font-normal">
                Cambiar rol (demo)
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setRol("admin")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Marce (Agencia)</span>
                <span className="text-xs text-neutral-500">Admin · Ve todo</span>
              </div>
              {rol === "admin" && (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setRol("agente")}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">
                  Lucía Fernández (Agente)
                </span>
                <span className="text-xs text-neutral-500">
                  Agente · Solo lo propio
                </span>
              </div>
              {rol === "agente" && (
                <div className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
