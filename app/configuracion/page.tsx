"use client";

import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { RotateCcw, ShieldAlert } from "lucide-react";

export default function ConfiguracionPage() {
  const { resetDemo } = useData();
  const { usuario } = useRole();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Configuración</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Ajustes generales de la demo
        </p>
      </div>

      {/* Demo reset */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <RotateCcw size={18} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Restablecer demo
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Vuelve todos los datos al estado inicial del seed.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-amber-200 text-amber-700 hover:bg-amber-50"
          onClick={() => {
            if (confirm("¿Restablecer todos los datos al estado inicial?")) {
              resetDemo();
            }
          }}
        >
          <RotateCcw size={14} className="mr-1.5" />
          Restablecer datos demo
        </Button>
      </div>

      {/* Info placeholder */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <ShieldAlert size={18} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-800">
              Módulo de configuración
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gestión de usuarios, roles, integraciones y preferencias de la agencia.
            </p>
          </div>
        </div>
        <p className="text-sm text-neutral-500 italic">
          Este módulo estará disponible en la versión de producción integrada con Twenty CRM.
        </p>
      </div>
    </div>
  );
}
