"use client";

import { createContext, useContext, useState } from "react";
import type { Rol, Usuario } from "@/lib/types";
import { seedUsuarios } from "@/lib/data/seed";

interface RoleContextValue {
  rol: Rol;
  usuario: Usuario;
  setRol: (rol: Rol) => void;
}

const MOCK_USUARIOS: Record<Rol, Usuario> = {
  admin: seedUsuarios.find((u) => u.id === "usr-admin-1")!,
  agente: seedUsuarios.find((u) => u.id === "usr-agente-1")!,
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRolState] = useState<Rol>("admin");

  function setRol(nuevoRol: Rol) {
    setRolState(nuevoRol);
  }

  return (
    <RoleContext.Provider
      value={{ rol, usuario: MOCK_USUARIOS[rol], setRol }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole debe usarse dentro de <RoleProvider>");
  }
  return ctx;
}
