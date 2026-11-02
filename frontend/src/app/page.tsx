"use client";

import React, { useState } from "react";
import dashboardData from "@/data/dashboard_data.json";
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
  AlertTriangle, Car, ShieldAlert, Activity, Map, Navigation, 
  CloudRain, Calendar, Clock, Zap, Layers, Terminal, BarChart3 
} from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];
const SEVERITY_COLORS = { "Solo Daños": "#3b82f6", "Con Heridos": "#f59e0b", "Fatal": "#ef4444" };
const LIGHT_COLORS = { "Día": "#f59e0b", "Noche (Iluminada)": "#3b82f6", "Noche (Oscura)": "#1e293b" };

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("general");
  const { kpis, time_patterns, causes, environmental, infrastructure, crash_types, crossed_data } = dashboardData as any;

  // General Data
  const hourlyData = Object.entries(time_patterns.hourly).map(([hour, total]) => ({
    name: `${hour}:00`, total, fatal: time_patterns.fatal_hourly[hour] || 0,
  }));
  const dayOfWeekData = Object.entries(time_patterns.day_of_week).map(([name, value]) => ({ name, value }));
  const monthlyData = Object.entries(time_patterns.monthly).map(([name, value]) => ({ name, value }));
  const causesData = Object.entries(causes).map(([name, value]) => ({ name, value }));
  const typesData = Object.entries(crash_types).map(([name, value]) => ({ name, value }));
  const roadData = Object.entries(infrastructure.trafficway).map(([name, value]) => ({ name, value }));
  const weatherData = Object.entries(environmental.weather).map(([name, value]) => ({ name, value }));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <main className="p-4 pb-28 md:p-10 max-w-7xl mx-auto space-y-6">
        
        {/* Mobile-Optimized Header */}
        <header className="flex flex-col items-center text-center border-b border-white/10 pb-4 pt-2">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
            Costa Serena
          </h1>
          <p className="text-base text-slate-400 mt-1 font-medium">Observatorio Vial Inteligente</p>
        </header>

        {/* TAB 1: VISIÓN GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Horizontal scroll for KPIs on mobile for better UX */}
            <section className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 scrollbar-hide">
              <div className="snap-center shrink-0 w-[85vw] md:w-auto"><KpiCard title="Total Siniestros" value={kpis.total_crashes.toLocaleString("es-AR")} icon={<Car size={28} className="text-blue-400" />} /></div>
              <div className="snap-center shrink-0 w-[85vw] md:w-auto"><KpiCard title="Siniestros con Heridos" value={kpis.injury_crashes.toLocaleString("es-AR")} icon={<AlertTriangle size={28} className="text-amber-400" />} /></div>
              <div className="snap-center shrink-0 w-[85vw] md:w-auto"><KpiCard title="Siniestros Fatales" value={kpis.fatal_crashes.toLocaleString("es-AR")} icon={<ShieldAlert size={28} className="text-red-500" />} highlight /></div>
              <div className="snap-center shrink-0 w-[85vw] md:w-auto"><KpiCard title="Solo Daño Material" value={kpis.property_damage_only.toLocaleString("es-AR")} icon={<Activity size={28} className="text-emerald-400" />} /></div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ChartCard title="Evolución Mensual" icon={<Calendar className="text-emerald-400"/>}>
                <BarChart data={monthlyData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                  <Bar dataKey="value" name="Siniestros" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Distribución Horaria" icon={<Clock className="text-amber-400"/>}>
                <LineChart data={hourlyData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                  <Line type="monotone" dataKey="total" name="Siniestros" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{r: 6}} />
                </LineChart>
              </ChartCard>

              <ChartCard title="Principales Causas" icon={<AlertTriangle className="text-red-400"/>}>
                <BarChart data={causesData.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15)+'...' : v} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                  <Bar dataKey="value" name="Siniestros" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                    {causesData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ChartCard>

              <ChartCard title="Tipos de Choque" icon={<Zap className="text-yellow-400"/>}>
                <BarChart data={typesData.slice(0, 5)} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={110} tickFormatter={(v) => v.length > 15 ? v.substring(0, 15)+'...' : v} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                  <Bar dataKey="value" name="Siniestros" fill="#ec4899" radius={[0, 4, 4, 0]}>
                    {typesData.map((e, i) => <Cell key={i} fill={COLORS[(i+4) % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ChartCard>

              <ChartCard title="Días de la Semana" icon={<Calendar className="text-indigo-400"/>}>
                <BarChart data={dayOfWeekData} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickMargin={8} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px' }} />
                  <Bar dataKey="value" name="Siniestros" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Tipos de Vía" icon={<Map className="text-blue-400"/>}>
                <PieChart>
                  <Pie
                    data={roadData.slice(0, 5)}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                    className="text-[10px] font-medium"
                  >
                    {roadData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ChartCard>
            </section>
          </div>
        )}

        {/* TAB 2: ANÁLISIS CRUZADO */}
        {activeTab === 'cruzados' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Layers size={20} className="text-purple-400" /> Mortalidad vs Causa</h3>
                <p className="text-xs text-slate-400 mt-1">Impacto fatal de cada infracción.</p>
              </div>
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossed_data.cause_severity} margin={{ left: -10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="prim_contributory_cause" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={60} tickFormatter={(v) => v.length > 12 ? v.substring(0, 12)+'...' : v} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', bottom: -10 }} />
                    <Bar dataKey="Solo Daños" stackId="a" fill={SEVERITY_COLORS["Solo Daños"]} />
                    <Bar dataKey="Con Heridos" stackId="a" fill={SEVERITY_COLORS["Con Heridos"]} />
                    <Bar dataKey="Fatal" stackId="a" fill={SEVERITY_COLORS["Fatal"]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Layers size={20} className="text-amber-400" /> Luz vs Horario</h3>
                <p className="text-xs text-slate-400 mt-1">Peligro nocturno por iluminación.</p>
              </div>
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossed_data.light_hour} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="crash_hour" stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `${v}h`} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Día" stackId="a" fill={LIGHT_COLORS["Día"]} />
                    <Bar dataKey="Noche (Iluminada)" stackId="a" fill={LIGHT_COLORS["Noche (Iluminada)"]} />
                    <Bar dataKey="Noche (Oscura)" stackId="a" fill={LIGHT_COLORS["Noche (Oscura)"]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-card p-5 flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white"><Layers size={20} className="text-emerald-400" /> Gravedad vs Vía</h3>
                <p className="text-xs text-slate-400 mt-1">Severidad por tipo de infraestructura.</p>
              </div>
              <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossed_data.via_severity} margin={{ left: -10, right: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="trafficway_type" stroke="#94a3b8" fontSize={10} angle={-45} textAnchor="end" height={60} tickFormatter={(v) => v.length > 12 ? v.substring(0, 12)+'...' : v} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: '12px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', bottom: -10 }} />
                    <Bar dataKey="Solo Daños" stackId="a" fill={SEVERITY_COLORS["Solo Daños"]} />
                    <Bar dataKey="Con Heridos" stackId="a" fill={SEVERITY_COLORS["Con Heridos"]} />
                    <Bar dataKey="Fatal" stackId="a" fill={SEVERITY_COLORS["Fatal"]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RECOMENDACIONES */}
        {activeTab === 'recomendaciones' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-white">
              <Navigation size={24} className="text-blue-400" />
              Plan de Acción
            </h2>
            <p className="text-base text-slate-300 mb-6 leading-relaxed">
              Basado en 209.000+ siniestros, se recomiendan al Concejo Deliberante las siguientes obras y políticas:
            </p>

            <div className="space-y-4">
              <RecommendationCard 
                number="01" 
                title="Cámaras de Fotomultas" 
                description="La infracción 'No ceder el paso' es la segunda causa de choques, con altísima letalidad. Instalar cámaras automatizadas en los 10 cruces de 4 vías principales."
                color="border-red-500/40 bg-red-500/10 text-red-400"
              />
              <RecommendationCard 
                number="02" 
                title="Iluminación LED y Demarcación" 
                description="La letalidad se dispara entre la 01:00 y las 04:00 AM en calles oscuras. Requerimos presupuesto de Obras Viales para iluminación perimetral y asfalto reflectante."
                color="border-amber-500/40 bg-amber-500/10 text-amber-400"
              />
              <RecommendationCard 
                number="03" 
                title="Lomos de Burro en Doble Mano" 
                description="Las calles 'No Divididas' sufren impacto más letal que las avenidas debido a choques frontales. Priorizar reductores de velocidad físicos."
                color="border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              />
              <RecommendationCard 
                number="04" 
                title="Cámaras en Semáforos" 
                description="14.500 colisiones por 'Ignorar semáforo'. La luz roja mitigará impactos laterales (T-Bone) de forma instantánea."
                color="border-purple-500/40 bg-purple-500/10 text-purple-400"
              />
              <RecommendationCard 
                number="05" 
                title="Protocolo Lluvia" 
                description="21.700 siniestros por lluvia. Se recomienda repavimentación antideslizante (microaglomerado) en zonas de frenado y carteles LED preventivos."
                color="border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
              />
            </div>
          </div>
        )}

        {/* TAB 4: FICHA TÉCNICA */}
        {activeTab === 'ficha' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-white">
              <Terminal size={24} className="text-purple-400" />
              Arquitectura Base
            </h2>
            <TechCard title="Procesamiento ETL" tech="Python 3.14 + Pandas" description="Pipeline estático para evadir DBs costosas. Agrupa estadísticamente 51MB en un JSON hiperligero." />
            <TechCard title="Frontend" tech="Next.js 16 + React 19" description="Static Export (Serverless) con carga casi instantánea, seguridad inviolable y latencia cero." />
            <TechCard title="Gráficos SVG" tech="Recharts" description="Motores de renderizado nativo para no bloquear la fluidez táctil en celulares (60fps)." />
            <TechCard title="Diseño UI" tech="Tailwind v4 + Glassmorphism" description="Ajustes Mobile-First, Navbar inferor fija y uso nativo de safe-areas en iOS/Android." />
            <TechCard title="Hosting" tech="Vercel Edge Network" description="CDN Global in-cache, capaz de soportar visitas masivas institucionales." />
          </div>
        )}

      </main>

      {/* Fixed Bottom Navigation (Mobile First) */}
      <nav className="fixed bottom-0 left-0 w-full bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 z-50 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center px-2 pt-2 max-w-md mx-auto">
          <NavButton active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<BarChart3 size={24} />} label="General" />
          <NavButton active={activeTab === 'cruzados'} onClick={() => setActiveTab('cruzados')} icon={<Layers size={24} />} label="Cruces" />
          <NavButton active={activeTab === 'recomendaciones'} onClick={() => setActiveTab('recomendaciones')} icon={<Navigation size={24} />} label="Estrategia" />
          <NavButton active={activeTab === 'ficha'} onClick={() => setActiveTab('ficha')} icon={<Terminal size={24} />} label="Ficha" />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className={`relative flex flex-col items-center justify-center w-full py-2 gap-1.5 transition-all duration-300
        ${active ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[11px] font-medium tracking-wide transition-all ${active ? 'font-bold' : ''}`}>{label}</span>
      {active && <div className="absolute -top-2 w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_12px_rgba(59,130,246,0.9)]" />}
    </button>
  );
}

function ChartCard({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 flex flex-col shadow-lg border border-slate-800/50">
      <h3 className="text-base font-bold mb-5 flex items-center gap-2 text-white">
        {icon} {title}
      </h3>
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, highlight = false }: { title: string, value: string, icon: React.ReactNode, highlight?: boolean }) {
  return (
    <div className={`glass-card p-6 flex flex-col relative overflow-hidden h-full min-w-[240px] shadow-lg border-slate-800/50 ${highlight ? 'ring-1 ring-red-500/40' : ''}`}>
      {highlight && <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">{title}</h2>
        <div className="p-2.5 rounded-xl bg-white/5 shadow-inner">{icon}</div>
      </div>
      <p className="text-4xl font-black text-white tracking-tight mt-auto">{value}</p>
    </div>
  );
}

function RecommendationCard({ number, title, description, color }: { number: string, title: string, description: string, color: string }) {
  return (
    <div className={`p-6 rounded-2xl border ${color} shadow-lg backdrop-blur-sm`}>
      <h4 className="font-bold text-xl flex items-center gap-3 mb-3">
        <span className="opacity-50 text-base font-black bg-black/20 px-2 py-1 rounded-md">{number}</span> {title}
      </h4>
      <p className="text-base text-slate-200 leading-relaxed font-medium">{description}</p>
    </div>
  );
}

function TechCard({ title, tech, description }: { title: string, tech: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col h-full shadow-lg">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</h4>
      <p className="text-xl font-black text-white mb-3">{tech}</p>
      <p className="text-base text-slate-300 leading-relaxed mt-auto font-medium">{description}</p>
    </div>
  );
}
