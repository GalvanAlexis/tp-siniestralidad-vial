"use client";

import React, { useState, useSyncExternalStore } from "react";
import rawData from "@/data/dashboard_data.json";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Calendar,
  Clock,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Car,
  CheckCircle2,
  TrendingUp,
  ArrowLeftRight,
  ShieldCheck,
  Database,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  "Solo Daños": "#3b82f6",
  "Con Heridos": "#f59e0b",
  "Fatal": "#ef4444",
};

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

const TOOLTIP_STYLE = { backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" };

type TabType = "resumen" | "cuando" | "condiciones" | "por_que" | "severidad";

const VIEWS: { key: TabType; label: string; question: string; icon: (size: number) => React.ReactNode }[] = [
  { key: "resumen", label: "Resumen", question: "¿Qué está pasando?", icon: (s) => <BarChart3 size={s} /> },
  { key: "cuando", label: "Cuándo", question: "¿Cuándo ocurren los siniestros?", icon: (s) => <Calendar size={s} /> },
  { key: "condiciones", label: "Condiciones", question: "¿En qué condiciones ocurren?", icon: (s) => <CloudRain size={s} /> },
  { key: "por_que", label: "Por Qué", question: "¿Por qué ocurren y dónde intervenir?", icon: (s) => <AlertTriangle size={s} /> },
  { key: "severidad", label: "Severidad", question: "¿Cuál es el impacto humano y material?", icon: (s) => <ShieldAlert size={s} /> },
];

// Breakpoint de escritorio (coincide con `lg:` de Tailwind)
const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ dia: string; hora: number; total: number } | null>(null);
  const isDesktop = useIsDesktop();

  const data = rawData as any;
  const { resumen, cuando, condiciones, por_que, severidad } = data;
  const activeView = VIEWS.find((v) => v.key === activeTab)!;

  // Hechos fatales (siniestros con al menos un fallecido), distinto de la cantidad de personas fallecidas
  const hechosFatales: number =
    severidad.distribucion.find((d: any) => d.nivel === "Fatal")?.total ?? 0;

  // Cálculos dinámicos garantizados (cero cifras fijas en el JSX)
  const pctSoloDanos = ((resumen.solo_danos / resumen.total_siniestros) * 100).toFixed(1);
  const pctConHeridos = ((resumen.con_heridos / resumen.total_siniestros) * 100).toFixed(1);
  const pctFatales = ((hechosFatales / resumen.total_siniestros) * 100).toFixed(2);

  // Ventanas horarias críticas (intervención 2): volumen por la tarde y letalidad de madrugada
  const FRANJA_TARDE = { desde: 14, hasta: 18 };
  const FRANJA_MADRUGADA = { desde: 23, hasta: 4 };
  const enFranja = (hora: number, f: { desde: number; hasta: number }) =>
    f.desde <= f.hasta ? hora >= f.desde && hora <= f.hasta : hora >= f.desde || hora <= f.hasta;
  const sumaHoras = (campo: "total" | "fatales", f: { desde: number; hasta: number }) =>
    cuando.por_hora
      .filter((h: any) => enFranja(h.hora, f))
      .reduce((acc: number, h: any) => acc + h[campo], 0);
  const totalFatalesHora = cuando.por_hora.reduce((acc: number, h: any) => acc + h.fatales, 0);
  const pctVolumenTarde = ((sumaHoras("total", FRANJA_TARDE) / resumen.total_siniestros) * 100).toFixed(0);
  const pctFatalesMadrugada = ((sumaHoras("fatales", FRANJA_MADRUGADA) / Math.max(totalFatalesHora, 1)) * 100).toFixed(0);

  const maxHeatmapVal = Math.max(
    ...cuando.heatmap.flatMap((item: any) => item.horas),
    1
  );
  // Celda pico del heatmap (día y hora con más siniestros)
  const picoHeatmap = cuando.heatmap.reduce(
    (best: { dia: string; hora: number; total: number }, item: any) => {
      item.horas.forEach((val: number, h: number) => {
        if (val > best.total) best = { dia: item.dia, hora: h, total: val };
      });
      return best;
    },
    { dia: "", hora: 0, total: -1 }
  );

  // En escritorio hay espacio para etiquetas completas en los ejes categóricos
  const truncate = (text: string, max: number) =>
    isDesktop || text.length <= max ? text : `${text.slice(0, max)}…`;

  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600/30">
      {/* =========================================================================
          SIDEBAR DE ESCRITORIO (≥ lg). En mobile se usa el bottom navbar.
         ========================================================================= */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 xl:w-72 flex-col bg-slate-950/95 border-r border-slate-800 z-40 px-5 py-7">
        <div className="space-y-1 px-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">Costa Serena</span>
          <p className="text-lg font-extrabold leading-tight text-white">Observatorio de Seguridad Vial</p>
        </div>

        <nav className="mt-8 flex flex-col gap-1" aria-label="Vistas del tablero">
          {VIEWS.map((view, i) => (
            <SidebarButton
              key={view.key}
              active={activeTab === view.key}
              onClick={() => changeTab(view.key)}
              icon={view.icon(18)}
              label={view.label}
              index={i + 1}
            />
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300 font-semibold">
            <Database size={14} className="text-blue-400" />
            Fuente de datos
          </div>
          <p>{resumen.total_siniestros.toLocaleString("es-AR")} hechos normalizados</p>
          <p>Período {cuando.por_anio[0].anio} – {cuando.por_anio[cuando.por_anio.length - 1].anio}</p>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 xl:pl-72">
        {/* Contenedor principal: mobile-first 9:16, se ensancha en escritorio */}
        <main className="w-full max-w-4xl lg:max-w-7xl mx-auto px-4 lg:px-10 xl:px-12 pt-4 lg:pt-8 pb-28 lg:pb-12 space-y-6">

          {/* Cabecera institucional */}
          <header className="text-center lg:text-left border-b border-slate-800 pb-4 pt-2 lg:flex lg:items-end lg:justify-between lg:gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
                <CheckCircle2 size={13} />
                Datos Oficiales Normalizados ({resumen.total_siniestros.toLocaleString("es-AR")} hechos)
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400 lg:hidden">
                Observatorio de Seguridad Vial
              </h1>
              <h1 className="hidden lg:block text-3xl xl:text-4xl font-extrabold tracking-tight text-white">
                {activeView.label}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                <span className="lg:hidden">Dirección de Tránsito y Transporte · Diagnóstico y Priorización</span>
                <span className="hidden lg:inline text-base">{activeView.question}</span>
              </p>
            </div>
            <p className="hidden lg:block text-sm text-slate-500 shrink-0">
              Dirección de Tránsito y Transporte
            </p>
          </header>

          {/* =========================================================================
              VISTA 1: RESUMEN EJECUTIVO
             ========================================================================= */}
          {activeTab === "resumen" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4">
                <KpiCard title="Siniestros Totales" value={resumen.total_siniestros.toLocaleString("es-AR")} icon={<Car className="text-blue-400" size={20} />} subtitle={`${cuando.por_anio[0].anio} - ${cuando.por_anio[cuando.por_anio.length - 1].anio}`} />
                <KpiCard title="Solo Daños" value={resumen.solo_danos.toLocaleString("es-AR")} icon={<Activity className="text-sky-400" size={20} />} subtitle={`${pctSoloDanos}% del total`} />
                <KpiCard title="Con Heridos" value={resumen.con_heridos.toLocaleString("es-AR")} icon={<AlertTriangle className="text-amber-400" size={20} />} subtitle={`${pctConHeridos}% del total`} highlight="amber" />
                <KpiCard title="Hechos Fatales" value={hechosFatales.toLocaleString("es-AR")} icon={<ShieldAlert className="text-red-500" size={20} />} subtitle={`${pctFatales}% del total · ${resumen.total_fatales.toLocaleString("es-AR")} fallecidos`} highlight="red" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-4">
                  <h3 className="text-base lg:text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-blue-400" />
                    Diagnóstico Ejecutivo para Decisores
                  </h3>
                  <p className="text-xs sm:text-sm lg:text-base text-slate-300 leading-relaxed">
                    El análisis integral sobre <strong>{resumen.total_siniestros.toLocaleString("es-AR")}</strong> hechos
                    revela que <strong>1 de cada 4 siniestros</strong> deja personas con lesiones (un total acumulado
                    de <strong>{resumen.total_lesionados.toLocaleString("es-AR")}</strong> heridos).
                    Aunque la tasa fatal es del {resumen.tasa_fatal_pct}%, las colisiones se concentran en corredores
                    sin división física y en cruces semaforizados donde se vulnera la prioridad de paso.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 lg:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block font-medium">Lesionados Totales</span>
                      <span className="text-lg lg:text-2xl font-bold text-amber-400">{resumen.total_lesionados.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="p-3 lg:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block font-medium">Heridos Graves (Incapacitantes)</span>
                      <span className="text-lg lg:text-2xl font-bold text-red-400">{resumen.total_incapacitantes.toLocaleString("es-AR")}</span>
                    </div>
                    <div className="p-3 lg:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                      <span className="text-slate-400 block font-medium">Vehículos / Unidades por Choque</span>
                      <span className="text-lg lg:text-2xl font-bold text-sky-400">{resumen.promedio_unidades_por_siniestro} vehículos</span>
                    </div>
                  </div>
                </div>

                <ChartCard title="Distribución de Severidad de Siniestros" className="lg:col-span-2">
                  <ChartBox className="h-[260px] lg:h-[300px]">
                    <PieChart>
                      <Pie data={severidad.distribucion} dataKey="total" nameKey="nivel" cx="50%" cy="45%" innerRadius="45%" outerRadius="75%" paddingAngle={1}>
                        {severidad.distribucion.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.nivel] || PALETTE[index % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend
                        wrapperStyle={{ fontSize: "12px" }}
                        formatter={(value: string) => {
                          const item = severidad.distribucion.find((d: any) => d.nivel === value);
                          const pct = item ? ((item.total / resumen.total_siniestros) * 100).toFixed(1) : "";
                          return <span className="text-slate-300">{value} · {pct}%</span>;
                        }}
                      />
                    </PieChart>
                  </ChartBox>
                </ChartCard>
              </div>

              {/* Acciones Priorizadas para el Concejo Deliberante (Basadas en el Brief) */}
              <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 lg:p-6 space-y-3">
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  Intervenciones Priorizadas para el Concejo Deliberante
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 text-xs lg:text-sm">
                  <div className="p-3 lg:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-emerald-400 font-bold block">1. Infraestructura en Cruces</span>
                    <p className="text-slate-300 leading-snug">
                      Intervenir cruces de 4 vías en arterias no divididas mediante reductores de velocidad y semaforización con giro protegido.
                    </p>
                  </div>
                  <div className="p-3 lg:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-amber-400 font-bold block">2. Fiscalización Horaria</span>
                    <p className="text-slate-300 leading-snug">
                      Operativos de tránsito de {FRANJA_TARDE.desde}:00 a {FRANJA_TARDE.hasta}:00 hs ({pctVolumenTarde}% de los siniestros) y
                      controles de velocidad y alcoholemia de {FRANJA_MADRUGADA.desde}:00 a {FRANJA_MADRUGADA.hasta}:00 hs ({pctFatalesMadrugada}% de los hechos fatales).
                    </p>
                  </div>
                  <div className="p-3 lg:p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="text-sky-400 font-bold block">3. Campaña Prioridad de Paso</span>
                    <p className="text-slate-300 leading-snug">
                      Focalizar campañas de concientización en no ceder el paso y distancia de frenado, principales causas de siniestros.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              VISTA 2: CUÁNDO OCURREN (TEMPORALIDAD Y HEATMAP)
             ========================================================================= */}
          {activeTab === "cuando" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <ChartCard title="Evolución Histórica por Año">
                <ChartBox className="h-[220px] lg:h-[280px]">
                  <LineChart data={cuando.por_anio}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="anio" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="total" name="Siniestros" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartBox>
              </ChartCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <ChartCard title="Siniestros por Día de la Semana">
                  <ChartBox className="h-[200px] lg:h-[240px]">
                    <BarChart data={cuando.por_dia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dia" stroke="#64748b" fontSize={10} tickFormatter={(d) => d.slice(0, 3)} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Distribución Horaria (Picos Diarios)">
                  <ChartBox className="h-[200px] lg:h-[240px]">
                    <LineChart data={cuando.por_hora}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hora" stroke="#64748b" fontSize={10} interval={3} tickFormatter={(h) => `${h}h`} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Line type="monotone" dataKey="total" name="Siniestros" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Siniestros por Mes (Estacionalidad)" className="sm:col-span-2 lg:col-span-1">
                  <ChartBox className="h-[200px] lg:h-[240px]">
                    <BarChart data={cuando.por_mes}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={10} tickFormatter={(m) => m.slice(0, 3)} interval={0} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>
              </div>

              {/* HEATMAP DÍA X HORA (Matriz 7 días x 24 horas) */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 lg:p-6 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <Clock size={16} className="text-blue-400" />
                    Heatmap: Concentración por Día y Franja Horaria
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] lg:text-xs text-slate-400 hidden sm:inline">Pico: {picoHeatmap.dia} {picoHeatmap.hora}h ({picoHeatmap.total.toLocaleString("es-AR")} siniestros)</span>
                    <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-medium sm:hidden">
                      <ArrowLeftRight size={13} /> Desliza lateralmente
                    </div>
                  </div>
                </div>

                {selectedHeatmapCell && (
                  <div className="p-2.5 rounded-xl bg-blue-950/50 border border-blue-500/30 text-xs text-blue-200 flex justify-between items-center animate-in fade-in">
                    <span>
                      Selección: <strong>{selectedHeatmapCell.dia}</strong> a las <strong>{selectedHeatmapCell.hora}:00 hs</strong>
                    </span>
                    <span className="font-bold text-white bg-blue-600/60 px-2 py-0.5 rounded-md">
                      {selectedHeatmapCell.total.toLocaleString("es-AR")} siniestros
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto lg:overflow-visible pb-2 scrollbar-thin">
                  <div className="min-w-[560px] lg:min-w-0">
                    {/* Encabezado de horas */}
                    <div className="grid grid-cols-[70px_repeat(24,1fr)] lg:grid-cols-[96px_repeat(24,1fr)] text-[10px] lg:text-xs text-slate-400 mb-1 gap-0.5 lg:gap-1">
                      <span></span>
                      {Array.from({ length: 24 }).map((_, h) => (
                        <span key={h} className="text-center">{h}</span>
                      ))}
                    </div>

                    {/* Filas por día */}
                    {cuando.heatmap.map((item: any) => (
                      <div key={item.dia} className="grid grid-cols-[70px_repeat(24,1fr)] lg:grid-cols-[96px_repeat(24,1fr)] items-center gap-0.5 lg:gap-1 mb-1">
                        <span className="text-xs lg:text-sm font-medium text-slate-300 truncate pr-1">
                          {isDesktop ? item.dia : item.dia.slice(0, 3)}
                        </span>
                        {item.horas.map((val: number, h: number) => {
                          const ratio = Math.min(1, val / maxHeatmapVal);
                          let bgClass = "bg-slate-800/40 text-slate-500";
                          if (ratio > 0.75) bgClass = "bg-red-500 text-white font-bold";
                          else if (ratio > 0.5) bgClass = "bg-amber-500 text-slate-950 font-semibold";
                          else if (ratio > 0.25) bgClass = "bg-blue-600 text-white";
                          else if (ratio > 0.08) bgClass = "bg-blue-900/70 text-slate-300";

                          const isSelected = selectedHeatmapCell?.dia === item.dia && selectedHeatmapCell?.hora === h;

                          return (
                            <div
                              key={h}
                              onClick={() => setSelectedHeatmapCell({ dia: item.dia, hora: h, total: val })}
                              title={`${item.dia} ${h}:00 hs -> ${val.toLocaleString("es-AR")} siniestros`}
                              className={`h-6 lg:h-9 rounded-[2px] lg:rounded flex items-center justify-center text-[9px] lg:text-[10px] transition-all cursor-pointer ${bgClass} ${
                                isSelected ? "ring-2 ring-white scale-110 z-10" : "hover:scale-110"
                              }`}
                            >
                              {val > 1500 ? `${(val / 1000).toFixed(1)}k` : ""}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================================
              VISTA 3: CONDICIONES (CLIMA, CALZADA, ILUMINACIÓN)
             ========================================================================= */}
          {activeTab === "condiciones" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <ChartCard title="Condición Climática">
                  <ChartBox className="h-[220px] lg:h-[280px]">
                    <BarChart data={condiciones.clima} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="clima_grupo" type="category" stroke="#64748b" fontSize={10} width={isDesktop ? 120 : 80} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Condición de Iluminación">
                  <ChartBox className="h-[220px] lg:h-[280px]">
                    <BarChart data={condiciones.iluminacion} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="iluminacion_grupo" type="category" stroke="#64748b" fontSize={10} width={isDesktop ? 130 : 80} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Estado de la Calzada y Superficie" className="sm:col-span-2 lg:col-span-1">
                  <ChartBox className="h-[200px] lg:h-[280px]">
                    <BarChart data={condiciones.calzada} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="calzada_grupo" type="category" stroke="#64748b" fontSize={10} width={isDesktop ? 100 : 80} interval={0} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#34d399" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 lg:p-5 text-xs sm:text-sm text-slate-300">
                <strong className="text-white block mb-1">Hallazgo Clave de Infraestructura:</strong>
                La gran mayoría de los siniestros ocurren en condiciones de calzada seca y clima despejado, lo que
                confirma que la siniestralidad responde primordialmente a conductas viales y diseño de intersecciones,
                más que a contingencias climáticas extraordinarias.
              </div>
            </section>
          )}

          {/* =========================================================================
              VISTA 4: POR QUÉ OCURREN (CAUSAS Y PRIORIZACIÓN DE VÍAS)
             ========================================================================= */}
          {activeTab === "por_que" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <ChartCard title="Principales Causas Contribuyentes">
                <ChartBox className="h-[260px] lg:h-[340px]">
                  <BarChart data={por_que.causas_top} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="causa" type="category" stroke="#64748b" fontSize={isDesktop ? 11 : 9} width={isDesktop ? 290 : 130} tickFormatter={(t) => truncate(t, 20)} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Bar dataKey="total" name="Siniestros" fill="#f87171" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartBox>
              </ChartCard>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <ChartCard title="Dispositivos de Control de Tránsito">
                  <ChartBox className="h-[220px] lg:h-[300px]">
                    <BarChart data={por_que.dispositivos_top} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="dispositivo" type="category" stroke="#64748b" fontSize={isDesktop ? 10 : 9} width={isDesktop ? 170 : 110} tickFormatter={(d) => truncate(d, 16)} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Dónde Priorizar Intervención (Tipo de Vía)">
                  <ChartBox className="h-[220px] lg:h-[300px]">
                    <BarChart data={por_que.priorizacion_vias} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="tipo_via" type="category" stroke="#64748b" fontSize={isDesktop ? 10 : 9} width={isDesktop ? 200 : 110} tickFormatter={(v) => truncate(v, 15)} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                      <Bar dataKey="interseccion" name="En Intersección" fill="#f43f5e" stackId="a" />
                      <Bar dataKey="no_interseccion" name="Tramo Recto" fill="#3b82f6" stackId="a" />
                    </BarChart>
                  </ChartBox>
                </ChartCard>
              </div>
            </section>
          )}

          {/* =========================================================================
              VISTA 5: SEVERIDAD Y LESIONES
             ========================================================================= */}
          {activeTab === "severidad" && (
            <section className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <ChartCard title="Desglose de Personas Lesionadas">
                  <ChartBox className="h-[220px] lg:h-[300px]">
                    <BarChart data={severidad.lesiones_detalle} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <YAxis dataKey="tipo" type="category" stroke="#64748b" fontSize={10} width={isDesktop ? 160 : 120} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="cantidad" name="Personas" fill="#fb923c" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>

                <ChartCard title="Daño Económico Estimado">
                  <ChartBox className="h-[220px] lg:h-[300px]">
                    <BarChart data={severidad.danos_materiales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="rango_dano" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="total" name="Siniestros" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartBox>
                </ChartCard>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 lg:p-5 text-xs sm:text-sm text-slate-300">
                <strong className="text-white block mb-1">Impacto Humano vs Material:</strong>
                Más de la mitad de los siniestros involucran daños materiales superiores a $1.500 USD. Sin embargo, los
                costos sociales y de salud pública están concentrados en las colisiones con heridos incapacitantes
                ({resumen.total_incapacitantes.toLocaleString("es-AR")} víctimas) y fatales ({resumen.total_fatales.toLocaleString("es-AR")} fallecidos),
                demandando intervenciones inmediatas en la infraestructura de las arterias más transitadas.
              </div>
            </section>
          )}
        </main>
      </div>

      {/* =========================================================================
          BOTTOM NAVBAR FIJO (MANDATORIO MOBILE-FIRST FORMATO 9:16). Oculto en escritorio.
         ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 py-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="flex justify-around items-center max-w-md mx-auto px-2">
          {VIEWS.map((view) => (
            <NavTabButton
              key={view.key}
              active={activeTab === view.key}
              onClick={() => changeTab(view.key)}
              icon={view.icon(20)}
              label={view.label}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function NavTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1 px-2 min-w-[60px] rounded-xl transition-all duration-200 select-none active:scale-95 ${
        active ? "text-blue-400 font-bold scale-105" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      <div className={`p-1 rounded-lg ${active ? "bg-blue-500/20 shadow-inner" : ""}`}>{icon}</div>
      <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
    </button>
  );
}

function SidebarButton({ active, onClick, icon, label, index }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; index: number }) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition-colors ${
        active
          ? "bg-blue-500/15 text-white font-semibold ring-1 ring-blue-500/30"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
      }`}
    >
      <span className={active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"}>{icon}</span>
      <span className="flex-1">{label}</span>
      <span className={`text-[11px] tabular-nums ${active ? "text-blue-400" : "text-slate-600"}`}>{index}</span>
    </button>
  );
}

function KpiCard({ title, value, icon, subtitle, highlight }: { title: string; value: string; icon: React.ReactNode; subtitle?: string; highlight?: "amber" | "red" }) {
  let borderClass = "border-slate-800/80";
  if (highlight === "amber") borderClass = "border-amber-500/40 bg-amber-950/10";
  if (highlight === "red") borderClass = "border-red-500/40 bg-red-950/10";

  return (
    <div className={`bg-slate-900/60 border ${borderClass} rounded-2xl p-3 sm:p-4 lg:p-5 flex flex-col justify-between shadow-sm`}>
      <div className="flex justify-between items-start">
        <span className="text-[11px] lg:text-xs font-semibold text-slate-400 leading-tight">{title}</span>
        <div className="p-1 rounded-md bg-slate-800/70">{icon}</div>
      </div>
      <div className="mt-2 lg:mt-4">
        <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">{value}</span>
        {subtitle && <span className="block text-[10px] lg:text-xs text-slate-400 mt-0.5">{subtitle}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 lg:p-6 flex flex-col shadow-sm ${className}`}>
      <h3 className="text-xs sm:text-sm lg:text-base font-bold text-slate-200 mb-3">{title}</h3>
      <div className="w-full">{children}</div>
    </div>
  );
}

// Contenedor con alto responsive: el gráfico ocupa el 100% del alto definido por clases de Tailwind
function ChartBox({ className, children }: { className: string; children: React.ReactElement }) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
