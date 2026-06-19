"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ReservasMesItem } from "@/hooks/useDashboard";

const COLORS = {
  aceptada: "#22C55E",
  enviada: "#3B82F6",
  creada: "#D1D5DB",
  cancelada: "#EF4444",
};

const LABELS: Record<keyof typeof COLORS, string> = {
  aceptada: "Aceptada",
  enviada: "Enviada",
  creada: "Creada",
  cancelada: "Cancelada",
};

interface Props {
  data: ReservasMesItem[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-sm min-w-[140px]">
      <p className="font-semibold text-neutral-700 mb-1">{label}</p>
      {payload.map((p) =>
        p.value > 0 ? (
          <div key={p.name} className="flex justify-between gap-4 text-xs">
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="font-medium text-neutral-700">{p.value}</span>
          </div>
        ) : null
      )}
      {total > 0 && (
        <div className="flex justify-between gap-4 text-xs border-t border-neutral-100 mt-1 pt-1">
          <span className="text-neutral-500">Total</span>
          <span className="font-semibold text-neutral-800">{total}</span>
        </div>
      )}
    </div>
  );
}

export function ReservasPorMes({ data }: Props) {
  const totalReservas = data.reduce(
    (s, d) => s + d.aceptada + d.enviada + d.creada + d.cancelada,
    0
  );

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-800">Reservas por mes de salida</h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          {totalReservas} reserva{totalReservas !== 1 ? "s" : ""} · próx. 8 meses
        </p>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -24 }} barSize={20}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F9FAFB" }} />
          <Bar dataKey="aceptada" stackId="a" fill={COLORS.aceptada} name={LABELS.aceptada} radius={[0, 0, 0, 0]} />
          <Bar dataKey="enviada" stackId="a" fill={COLORS.enviada} name={LABELS.enviada} />
          <Bar dataKey="creada" stackId="a" fill={COLORS.creada} name={LABELS.creada} />
          <Bar dataKey="cancelada" stackId="a" fill={COLORS.cancelada} name={LABELS.cancelada} radius={[4, 4, 0, 0]} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
