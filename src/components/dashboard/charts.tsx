"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { cn } from "@/lib/utils";

const chartPalette = ["#0f172a", "#10b981", "#f59e0b", "#0ea5e9", "#f43f5e", "#8b5cf6"];

function useChartWidth() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.floor(entries[0]?.contentRect.width ?? 0);
      setWidth((current) => (current === nextWidth ? current : nextWidth));
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { containerRef, width };
}

function SharedTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-sm font-semibold text-slate-950">
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

export function MetricLineChart({
  title,
  data,
  lines,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  lines: Array<{ key: string; name: string; color: string }>;
}) {
  const { containerRef, width } = useChartWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <Panel variant="solid" className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelContent className="h-[320px]">
        <div ref={containerRef} className="h-full w-full">
          {width > 0 ? (
            <LineChart width={chartWidth} height={280} data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip content={<SharedTooltip />} />
              {lines.map((line) => (
                <Line key={line.key} type="monotone" dataKey={line.key} name={line.name} stroke={line.color} strokeWidth={2.5} dot={false} />
              ))}
            </LineChart>
          ) : null}
        </div>
      </PanelContent>
    </Panel>
  );
}

export function MetricAreaChart({
  title,
  data,
  dataKey,
  name,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  name: string;
  color: string;
}) {
  const { containerRef, width } = useChartWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <Panel variant="solid" className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelContent className="h-[320px]">
        <div ref={containerRef} className="h-full w-full">
          {width > 0 ? (
            <AreaChart width={chartWidth} height={280} data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
              <Tooltip content={<SharedTooltip />} />
              <Area type="monotone" dataKey={dataKey} name={name} stroke={color} fill={color} fillOpacity={0.16} strokeWidth={2.5} />
            </AreaChart>
          ) : null}
        </div>
      </PanelContent>
    </Panel>
  );
}

export function MetricBarChart({
  title,
  data,
  bars,
  horizontal = false,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  bars: Array<{ key: string; name: string; color: string }>;
  horizontal?: boolean;
}) {
  const { containerRef, width } = useChartWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <Panel variant="solid" className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelContent className="h-[320px]">
        <div ref={containerRef} className="h-full w-full">
          {width > 0 ? (
            <BarChart width={chartWidth} height={280} data={data} layout={horizontal ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {horizontal ? (
                <>
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} tick={{ fill: "#64748b", fontSize: 12 }} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                </>
              )}
              <Tooltip content={<SharedTooltip />} />
              {bars.map((bar) => (
                <Bar key={bar.key} dataKey={bar.key} name={bar.name} fill={bar.color} radius={[12, 12, 0, 0]} barSize={horizontal ? 18 : 32} />
              ))}
            </BarChart>
          ) : null}
        </div>
      </PanelContent>
    </Panel>
  );
}

export function MetricDonutChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
}) {
  const { containerRef, width } = useChartWidth();
  const chartWidth = Math.max(width, 320);

  return (
    <Panel variant="solid" className="h-full">
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelContent className="h-[320px]">
        <div ref={containerRef} className="h-full w-full">
          {width > 0 ? (
            <PieChart width={chartWidth} height={280}>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip content={<SharedTooltip />} />
              <Legend />
            </PieChart>
          ) : null}
        </div>
      </PanelContent>
    </Panel>
  );
}

export function ChartFrame({ className, children }: { className?: string; children: React.ReactNode }) {
  return <Panel className={cn("overflow-hidden", className)}>{children}</Panel>;
}
