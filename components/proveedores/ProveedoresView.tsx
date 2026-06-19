"use client";

import { useState } from "react";
import type { Proveedor, CategoriaProveedor } from "@/lib/types";
import { useData } from "@/contexts/DataContext";
import { useRole } from "@/contexts/RoleContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ProveedorForm } from "./ProveedorForm";
import { Plus, Pencil, Building2 } from "lucide-react";

// ── Categoria badge config ────────────────────────────────────────────────────

const CATEGORIA_META: Record<
  CategoriaProveedor,
  { label: string; className: string }
> = {
  parques:   { label: "Parques",    className: "bg-violet-100 text-violet-700 border-violet-200" },
  vuelos:    { label: "Vuelos",     className: "bg-blue-100 text-blue-700 border-blue-200" },
  hoteleria: { label: "Hotelería",  className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cruceros:  { label: "Cruceros",   className: "bg-sky-100 text-sky-700 border-sky-200" },
  seguros:   { label: "Seguros",    className: "bg-amber-100 text-amber-700 border-amber-200" },
  transfer:  { label: "Transfer",   className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  otro:      { label: "Otro",       className: "bg-neutral-100 text-neutral-600 border-neutral-200" },
};

function CategoriaBadge({ categoria }: { categoria: CategoriaProveedor }) {
  const meta = CATEGORIA_META[categoria];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className
      )}
    >
      {meta.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNew, isAdmin }: { onNew: () => void; isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <Building2 className="size-10 text-neutral-300" />
      <p className="text-neutral-500 font-medium">Sin proveedores registrados</p>
      {isAdmin && (
        <Button size="sm" onClick={onNew}>
          <Plus className="size-4 mr-1" />
          Agregar proveedor
        </Button>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ProveedoresView() {
  const { proveedores, updateProveedor } = useData();
  const { rol } = useRole();
  const isAdmin = rol === "admin";

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | undefined>(undefined);

  function openNew() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(p: Proveedor) {
    setEditing(p);
    setFormOpen(true);
  }

  const sorted = [...proveedores].sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Proveedores</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {proveedores.length} proveedor{proveedores.length !== 1 ? "es" : ""} registrado{proveedores.length !== 1 ? "s" : ""}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openNew}>
            <Plus className="size-4 mr-1" />
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <EmptyState onNew={openNew} isAdmin={isAdmin} />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                    Cuenta comercial
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                      Comisión %
                    </th>
                  )}
                  <th className="px-4 py-3 text-left font-medium text-neutral-500 whitespace-nowrap">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-neutral-500 whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sorted.map((p) => (
                  <ProveedorRow
                    key={p.id}
                    proveedor={p}
                    isAdmin={isAdmin}
                    onEdit={openEdit}
                    onToggleActivo={(id, activo) => updateProveedor(id, { activo })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form dialog (admin only) */}
      {isAdmin && (
        <ProveedorForm
          open={formOpen}
          onOpenChange={setFormOpen}
          proveedor={editing}
        />
      )}
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────────

interface RowProps {
  proveedor: Proveedor;
  isAdmin: boolean;
  onEdit: (p: Proveedor) => void;
  onToggleActivo: (id: string, activo: boolean) => void;
}

function ProveedorRow({ proveedor, isAdmin, onEdit, onToggleActivo }: RowProps) {
  const { id, nombre, categoria, contacto, cuentaComercial, comisionPorcentaje, activo } = proveedor;

  return (
    <tr className="hover:bg-neutral-50 transition-colors">
      {/* Nombre */}
      <td className="px-4 py-3 font-medium text-neutral-900 whitespace-nowrap">
        {nombre}
      </td>

      {/* Categoría */}
      <td className="px-4 py-3">
        <CategoriaBadge categoria={categoria} />
      </td>

      {/* Contacto */}
      <td className="px-4 py-3 text-neutral-600 max-w-[180px] truncate">
        {contacto ?? <span className="text-neutral-300">—</span>}
      </td>

      {/* Cuenta comercial */}
      <td className="px-4 py-3 text-neutral-600 max-w-[160px] truncate">
        {cuentaComercial ?? <span className="text-neutral-300">—</span>}
      </td>

      {/* Comisión % — admin only */}
      {isAdmin && (
        <td className="px-4 py-3 text-neutral-700 font-mono tabular-nums">
          {comisionPorcentaje}%
        </td>
      )}

      {/* Estado */}
      <td className="px-4 py-3">
        {isAdmin ? (
          <div className="flex items-center gap-2">
            <Switch
              checked={activo}
              onCheckedChange={(v) => onToggleActivo(id, v)}
            />
            <span className={cn("text-xs font-medium", activo ? "text-emerald-600" : "text-neutral-400")}>
              {activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        ) : (
          <Badge
            variant="outline"
            className={cn(
              "border",
              activo
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-neutral-50 text-neutral-500 border-neutral-200"
            )}
          >
            {activo ? "Activo" : "Inactivo"}
          </Badge>
        )}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3 text-right">
        {isAdmin ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(proveedor)}
            className="text-neutral-500 hover:text-neutral-900"
          >
            <Pencil className="size-4" />
            <span className="sr-only">Editar {nombre}</span>
          </Button>
        ) : (
          <span className="text-neutral-300 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}
