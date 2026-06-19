"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Building2 } from "lucide-react";
import type { VentaProveedorItem } from "@/hooks/useDashboard";

const PALETTE = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#06B6D4"];

interface Props {
  data: VentaProveedorItem[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: VentaProveedorItem }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-neutral-800">{d.proveedor}</p>
      <p className="text-neutral-500 text-xs mt-0.5">
        USD {d.montoUSD.toLocaleString("es-AR")}
      </p>
    </div>
  );
}

export function VentaPorProveedor({ data }: Props) {
  const total = data.reduce((s, d) => s + d.montoUSD, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-neutral-400" />
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Venta total por proveedor</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            USD {total.toLocaleString("es-AR")} en reservas aceptadas
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
          />
          <YAxis
            type="category"
            dataKey="proveedor"
            width={130}
            tick={{ fontSize: 11, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
          <Bar dataKey="montoUSD" name="Monto USD" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
