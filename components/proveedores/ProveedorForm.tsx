"use client";

import { useState, useEffect } from "react";
import type { Proveedor, CategoriaProveedor } from "@/lib/types";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIAS: { value: CategoriaProveedor; label: string }[] = [
  { value: "parques", label: "Parques" },
  { value: "vuelos", label: "Vuelos" },
  { value: "hoteleria", label: "Hotelería" },
  { value: "cruceros", label: "Cruceros" },
  { value: "seguros", label: "Seguros" },
  { value: "transfer", label: "Transfer" },
  { value: "otro", label: "Otro" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: Proveedor;
}

interface FormState {
  nombre: string;
  categoria: CategoriaProveedor;
  contacto: string;
  cuentaComercial: string;
  comisionPorcentaje: string;
  activo: boolean;
}

const EMPTY: FormState = {
  nombre: "",
  categoria: "parques",
  contacto: "",
  cuentaComercial: "",
  comisionPorcentaje: "10",
  activo: true,
};

export function ProveedorForm({ open, onOpenChange, proveedor }: Props) {
  const { addProveedor, updateProveedor } = useData();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isEdit = Boolean(proveedor);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (proveedor) {
        setForm({
          nombre: proveedor.nombre,
          categoria: proveedor.categoria,
          contacto: proveedor.contacto ?? "",
          cuentaComercial: proveedor.cuentaComercial ?? "",
          comisionPorcentaje: String(proveedor.comisionPorcentaje),
          activo: proveedor.activo,
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, proveedor]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es requerido.";
    const pct = Number(form.comisionPorcentaje);
    if (isNaN(pct) || pct < 0 || pct > 100)
      next.comisionPorcentaje = "Debe ser un número entre 0 y 100.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const payload = {
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      contacto: form.contacto.trim() || undefined,
      cuentaComercial: form.cuentaComercial.trim() || undefined,
      comisionPorcentaje: Number(form.comisionPorcentaje),
      activo: form.activo,
    };

    if (isEdit && proveedor) {
      updateProveedor(proveedor.id, payload);
    } else {
      addProveedor(payload);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <Label htmlFor="pf-nombre">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pf-nombre"
              value={form.nombre}
              onChange={(e) => patch("nombre", e.target.value)}
              placeholder="Ej. Disney Parks"
            />
            {errors.nombre && (
              <p className="text-xs text-red-500">{errors.nombre}</p>
            )}
          </div>

          {/* Categoría */}
          <div className="space-y-1">
            <Label htmlFor="pf-categoria">Categoría</Label>
            <Select
              value={form.categoria}
              onValueChange={(v) => patch("categoria", v as CategoriaProveedor)}
            >
              <SelectTrigger id="pf-categoria" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacto */}
          <div className="space-y-1">
            <Label htmlFor="pf-contacto">Contacto</Label>
            <Input
              id="pf-contacto"
              value={form.contacto}
              onChange={(e) => patch("contacto", e.target.value)}
              placeholder="Nombre / email / teléfono"
            />
          </div>

          {/* Cuenta comercial */}
          <div className="space-y-1">
            <Label htmlFor="pf-cuenta">Cuenta comercial</Label>
            <Input
              id="pf-cuenta"
              value={form.cuentaComercial}
              onChange={(e) => patch("cuentaComercial", e.target.value)}
              placeholder="Número de cuenta o código"
            />
          </div>

          {/* Comisión % */}
          <div className="space-y-1">
            <Label htmlFor="pf-comision">
              Comisión % <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pf-comision"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.comisionPorcentaje}
              onChange={(e) => patch("comisionPorcentaje", e.target.value)}
              placeholder="10"
            />
            {errors.comisionPorcentaje && (
              <p className="text-xs text-red-500">{errors.comisionPorcentaje}</p>
            )}
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3">
            <Switch
              id="pf-activo"
              checked={form.activo}
              onCheckedChange={(v) => patch("activo", v)}
            />
            <Label htmlFor="pf-activo" className="cursor-pointer">
              Proveedor activo
            </Label>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            {isEdit ? "Guardar cambios" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
