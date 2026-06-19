"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { EmbudoItem } from "@/hooks/useDashboard";

interface EmbudioLeadsProps {
  data: EmbudoItem[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EmbudoItem; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-neutral-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-neutral-800">{item.label}</p>
      <p className="text-neutral-500">
        {item.count} lead{item.count !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function EmbudioLeads({ data }: EmbudioLeadsProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Embudo de leads</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {total} lead{total !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 48, bottom: 0, left: 0 }}
          barSize={22}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            width={86}
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Bar dataKey="count" radius={[0, 5, 5, 0]}>
            {data.map((entry) => (
              <Cell key={entry.estado} fill={entry.fill} fillOpacity={0.85} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Mini legend with conversion rate */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-neutral-100">
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <span key={d.estado} className="flex items-center gap-1.5 text-xs text-neutral-500">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: d.fill }}
              />
              {d.label}
            </span>
          ))}
      </div>
    </div>
  );
}
