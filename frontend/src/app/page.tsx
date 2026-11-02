"use client";

import React, { useState } from "react";
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
  MapPin,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  "Solo Daños": "#3b82f6",
  "Con Heridos": "#f59e0b",
  "Fatal": "#ef4444",
};

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#64748b"];

type TabType = "resumen" | "cuando" | "condiciones" | "por_que" | "severidad";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("resumen");
  const data = rawData as any;
  const { resumen, cuando, condiciones, por_que, severidad } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600/30">
      {/* Contenedor principal ajustado a formato 9:16 vertical (Mobile-First) */}
      <main className="w-full max-w-4xl mx-auto px-4 pt-4 pb-28 space-y-6 flex-1">
        
        {/* Cabecera institucional */}
        <header className="text-center border-b border-slate-800 pb-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-2">
            <CheckCircle2 size={13} />
            Datos Oficiales Normalizados (209.275 hechos)
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-400">
            Observatorio de Seguridad Vial
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Dirección de Tránsito y Transporte · Diagnóstico y Priorización
          </p>
        </header>

        {/* =========================================================================
            VISTA 1: RESUMEN EJECUTIVO
           ========================================================================= */}
        {activeTab === "resumen" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard title="Siniestros Totales" value={resumen.total_siniestros.toLocaleString("es-AR")} icon={<Car className="text-blue-400" size={20} />} subtitle="2013 - 2025" />
              <KpiCard title="Solo Daños" value={resumen.solo_danos.toLocaleString("es-AR")} icon={<Activity className="text-sky-400" size={20} />} subtitle="73,9% del total" />
              <KpiCard title="Con Heridos" value={resumen.con_heridos.toLocaleString("es-AR")} icon={<AlertTriangle className="text-amber-400" size={20} />} subtitle="25,9% del total" highlight="amber" />
              <KpiCard title="Hechos Fatales" value={resumen.total_fatales.toLocaleString("es-AR")} icon={<ShieldAlert className="text-red-500" size={20} />} subtitle="0,17% del total" highlight="red" />
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-400" />
                Diagnóstico Ejecutivo para Decisores
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                El análisis integral sobre <strong>{resumen.total_siniestros.toLocaleString("es-AR")}</strong> hechos
                revela que <strong>1 de cada 4 siniestros</strong> deja personas con lesiones (un total acumulado
                de <strong>{resumen.total_lesionados.toLocaleString("es-AR")}</strong> heridos).
                Aunque la tasa fatal es baja ({resumen.tasa_fatal_pct}%), las colisiones se concentran en corredores
                sin división física y en cruces semaforizados donde se vulnera la prioridad de paso.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block font-medium">Lesionados Totales</span>
                  <span className="text-lg font-bold text-amber-400">{resumen.total_lesionados.toLocaleString("es-AR")}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block font-medium">Heridos Graves (Incapacitantes)</span>
                  <span className="text-lg font-bold text-red-400">{resumen.total_incapacitantes.toLocaleString("es-AR")}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-slate-400 block font-medium">Vehículos / Unidades por Choque</span>
                  <span className="text-lg font-bold text-sky-400">{resumen.promedio_unidades_por_siniestro} vehículos</span>
                </div>
              </div>
            </div>

            <ChartCard title="Distribución de Severidad de Siniestros">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={severidad.distribucion} dataKey="total" nameKey="nivel" cx="50%" cy="50%" outerRadius={80} label={({ nivel, percent }: any) => `${nivel}: ${(percent * 100).toFixed(1)}%`}>
                    {severidad.distribucion.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.nivel] || PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </section>
        )}

        {/* =========================================================================
            VISTA 2: CUÁNDO OCURREN (TEMPORALIDAD Y HEATMAP)
           ========================================================================= */}
        {activeTab === "cuando" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            <ChartCard title="Evolución Histórica por Año">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={cuando.por_anio}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="anio" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="total" name="Siniestros" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChartCard title="Siniestros por Día de la Semana">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cuando.por_dia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="dia" stroke="#64748b" fontSize={10} tickFormatter={(d) => d.slice(0, 3)} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="total" name="Siniestros" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Distribución Horaria (Picos Diarios)">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={cuando.por_hora}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="hora" stroke="#64748b" fontSize={10} interval={3} tickFormatter={(h) => `${h}h`} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="total" name="Siniestros" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* HEATMAP DÍA X HORA (Matriz 7 días x 24 horas) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" />
                  Heatmap: Concentración por Día y Franja Horaria
                </h3>
                <span className="text-[11px] text-slate-400">Escala de intensidad (Pico: Viernes 15h - 18h)</span>
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[560px]">
                  {/* Encabezado de horas */}
                  <div className="grid grid-cols-[70px_repeat(24,1fr)] text-[10px] text-slate-400 mb-1">
                    <span></span>
                    {Array.from({ length: 24 }).map((_, h) => (
                      <span key={h} className="text-center">{h}</span>
                    ))}
                  </div>

                  {/* Filas por día */}
                  {cuando.heatmap.map((item: any) => (
                    <div key={item.dia} className="grid grid-cols-[70px_repeat(24,1fr)] items-center gap-0.5 mb-1">
                      <span className="text-xs font-medium text-slate-300 truncate pr-1">{item.dia.slice(0, 3)}</span>
                      {item.horas.map((val: number, h: number) => {
                        const ratio = Math.min(1, val / 2000);
                        let bgClass = "bg-slate-800/40 text-slate-500";
                        if (ratio > 0.75) bgClass = "bg-red-500 text-white font-bold";
                        else if (ratio > 0.5) bgClass = "bg-amber-500 text-slate-950 font-semibold";
                        else if (ratio > 0.25) bgClass = "bg-blue-600 text-white";
                        else if (ratio > 0.08) bgClass = "bg-blue-900/70 text-slate-300";

                        return (
                          <div
                            key={h}
                            title={`${item.dia} ${h}:00 hs -> ${val.toLocaleString("es-AR")} siniestros`}
                            className={`h-6 rounded-[2px] flex items-center justify-center text-[9px] transition-transform hover:scale-125 cursor-pointer ${bgClass}`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChartCard title="Condición Climática">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={condiciones.clima} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="clima_grupo" type="category" stroke="#64748b" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="total" name="Siniestros" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Condición de Iluminación">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={condiciones.iluminacion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="iluminacion_grupo" type="category" stroke="#64748b" fontSize={10} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="total" name="Siniestros" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <ChartCard title="Estado de la Calzada y Superficie">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={condiciones.calzada}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="calzada_grupo" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                  <Bar dataKey="total" name="Siniestros" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-300">
              <strong className="text-white block mb-1">Hallazgo Clave de Infraestructura:</strong>
              Más del 78% de los siniestros ocurren en condiciones de calzada seca y clima despejado, lo que
              confirma que la siniestralidad no responde a factores meteorológicos adversos, sino al comportamiento
              del conductor y a fallas en los puntos de cruce vehicular.
            </div>
          </section>
        )}

        {/* =========================================================================
            VISTA 4: POR QUÉ OCURREN (CAUSAS Y PRIORIZACIÓN DE VÍAS)
           ========================================================================= */}
        {activeTab === "por_que" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            <ChartCard title="Principales Causas Contribuyentes">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={por_que.causas_top} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                  <YAxis dataKey="causa" type="category" stroke="#64748b" fontSize={9} width={130} tickFormatter={(t) => t.length > 20 ? `${t.slice(0, 20)}...` : t} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                  <Bar dataKey="total" name="Siniestros" fill="#f87171" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChartCard title="Dispositivos de Control de Tránsito">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={por_que.dispositivos_top} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="dispositivo" type="category" stroke="#64748b" fontSize={9} width={110} tickFormatter={(d) => d.slice(0, 16)} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="total" name="Siniestros" fill="#a78bfa" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Dónde Priorizar Intervención (Tipo de Vía)">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={por_que.priorizacion_vias} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="tipo_via" type="category" stroke="#64748b" fontSize={9} width={110} tickFormatter={(v) => v.slice(0, 15)} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="interseccion" name="En Intersección" fill="#f43f5e" stackId="a" />
                    <Bar dataKey="no_interseccion" name="Tramo Recto" fill="#3b82f6" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>
        )}

        {/* =========================================================================
            VISTA 5: SEVERIDAD Y LESIONES
           ========================================================================= */}
        {activeTab === "severidad" && (
          <section className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChartCard title="Desglose de Personas Lesionadas">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severidad.lesiones_detalle} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis dataKey="tipo" type="category" stroke="#64748b" fontSize={10} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="cantidad" name="Personas" fill="#fb923c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Daño Económico Estimado">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severidad.danos_materiales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="rango_dano" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }} />
                    <Bar dataKey="total" name="Siniestros" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-300">
              <strong className="text-white block mb-1">Impacto Humano vs Material:</strong>
              El 58% de los siniestros involucran daños materiales superiores a $1.500 USD. Sin embargo, los
              costos sociales y de salud pública están concentrados en las colisiones con heridos incapacitantes
              (7.974 víctimas) y fatales (389 fallecidos), que demandan infraestructura de respuesta rápida y
              controles de velocidad estrictos.
            </div>
          </section>
        )}
      </main>

      {/* =========================================================================
          BOTTOM NAVBAR FIJO (MANDATORIO MOBILE-FIRST FORMATO 9:16)
         ========================================================================= */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50 py-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        <div className="flex justify-around items-center max-w-md mx-auto px-2">
          <NavTabButton active={activeTab === "resumen"} onClick={() => setActiveTab("resumen")} icon={<BarChart3 size={20} />} label="Resumen" />
          <NavTabButton active={activeTab === "cuando"} onClick={() => setActiveTab("cuando")} icon={<Calendar size={20} />} label="Cuándo" />
          <NavTabButton active={activeTab === "condiciones"} onClick={() => setActiveTab("condiciones")} icon={<CloudRain size={20} />} label="Condiciones" />
          <NavTabButton active={activeTab === "por_que"} onClick={() => setActiveTab("por_que")} icon={<AlertTriangle size={20} />} label="Por Qué" />
          <NavTabButton active={activeTab === "severidad"} onClick={() => setActiveTab("severidad")} icon={<ShieldAlert size={20} />} label="Severidad" />
        </div>
      </nav>
    </div>
  );
}

function NavTabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 select-none ${
        active ? "text-blue-400 font-bold scale-105" : "text-slate-400 hover:text-slate-200"
      }`}
    >
      <div className={`p-1 rounded-lg ${active ? "bg-blue-500/20 shadow-inner" : ""}`}>{icon}</div>
      <span className="text-[10px] tracking-tight mt-0.5">{label}</span>
    </button>
  );
}

function KpiCard({ title, value, icon, subtitle, highlight }: { title: string; value: string; icon: React.ReactNode; subtitle?: string; highlight?: "amber" | "red" }) {
  let borderClass = "border-slate-800/80";
  if (highlight === "amber") borderClass = "border-amber-500/40 bg-amber-950/10";
  if (highlight === "red") borderClass = "border-red-500/40 bg-red-950/10";

  return (
    <div className={`bg-slate-900/60 border ${borderClass} rounded-2xl p-3 sm:p-4 flex flex-col justify-between shadow-sm`}>
      <div className="flex justify-between items-start">
        <span className="text-[11px] font-semibold text-slate-400 leading-tight">{title}</span>
        <div className="p-1 rounded-md bg-slate-800/70">{icon}</div>
      </div>
      <div className="mt-2">
        <span className="text-xl sm:text-2xl font-black text-white tracking-tight">{value}</span>
        {subtitle && <span className="block text-[10px] text-slate-400 mt-0.5">{subtitle}</span>}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm">
      <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-3">{title}</h3>
      <div className="w-full">{children}</div>
    </div>
  );
}
