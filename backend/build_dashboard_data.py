"""
Genera el archivo JSON estático (frontend/src/data/dashboard_data.json)
para alimentar el dashboard con las 5 vistas obligatorias de la consigna.
Consume data/clean/traffic_accidents_clean.csv (dataset limpio y trazable).
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import pandas as pd


def load_clean_data(clean_csv_path: Path) -> pd.DataFrame:
    if not clean_csv_path.exists():
        raise FileNotFoundError(f"No existe el archivo de datos limpio: {clean_csv_path}")
    return pd.read_csv(clean_csv_path)


def generate_dashboard_payload(df: pd.DataFrame) -> dict:
    total_records = len(df)
    total_injuries = int(df["injuries_total"].sum())
    total_fatalities = int(df["injuries_fatal"].sum())
    total_incapacitating = int(df["injuries_incapacitating"].sum())

    severity_counts = df["severidad"].value_counts().to_dict()
    solo_danos = int(severity_counts.get("Solo Daños", 0))
    con_heridos = int(severity_counts.get("Con Heridos", 0))
    fatales = int(severity_counts.get("Fatal", 0))

    # --- VISTA 1: RESUMEN EJECUTIVO ---
    kpis = {
        "total_siniestros": total_records,
        "total_lesionados": total_injuries,
        "total_fatales": total_fatalities,
        "total_incapacitantes": total_incapacitating,
        "solo_danos": solo_danos,
        "con_heridos": con_heridos,
        "tasa_heridos_pct": round((con_heridos / total_records) * 100, 2),
        "tasa_fatal_pct": round((fatales / total_records) * 100, 3),
        "promedio_unidades_por_siniestro": round(float(df["num_units"].mean()), 2),
    }

    # --- VISTA 2: CUÁNDO OCURREN (TEMPORALIDAD) ---
    dias_orden = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    meses_orden = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

    por_anio = df.groupby("anio").size().to_dict()
    por_anio_lista = [{"anio": int(a), "total": int(c)} for a, c in sorted(por_anio.items()) if a >= 2013]

    por_mes_raw = df.groupby("mes_nombre").size().to_dict()
    por_mes_lista = [{"mes": m, "total": int(por_mes_raw.get(m, 0))} for m in meses_orden]

    por_dia_raw = df.groupby("dia_semana").size().to_dict()
    por_dia_lista = [{"dia": d, "total": int(por_dia_raw.get(d, 0))} for d in dias_orden]

    por_hora_raw = df.groupby("crash_hour").size().to_dict()
    por_hora_fatal_raw = df[df["injuries_fatal"] > 0].groupby("crash_hour").size().to_dict()
    por_hora_lista = [
        {"hora": h, "etiqueta": f"{h:02d}:00", "total": int(por_hora_raw.get(h, 0)), "fatales": int(por_hora_fatal_raw.get(h, 0))}
        for h in range(24)
    ]

    # Heatmap día x hora (7 x 24)
    ct_dia_hora = pd.crosstab(df["dia_semana"], df["crash_hour"])
    heatmap_dia_hora = []
    for d in dias_orden:
        fila_horas = [int(ct_dia_hora.loc[d, h]) if (d in ct_dia_hora.index and h in ct_dia_hora.columns) else 0 for h in range(24)]
        heatmap_dia_hora.append({"dia": d, "horas": fila_horas})

    vista_cuando = {
        "por_anio": por_anio_lista,
        "por_mes": por_mes_lista,
        "por_dia": por_dia_lista,
        "por_hora": por_hora_lista,
        "heatmap": heatmap_dia_hora,
    }

    # --- VISTA 3: CONDICIONES (CLIMA, CALZADA, ILUMINACIÓN) ---
    por_clima = (
        df.groupby("clima_grupo").size().sort_values(ascending=False).reset_index(name="total")
    )
    por_iluminacion = (
        df.groupby("iluminacion_grupo").size().sort_values(ascending=False).reset_index(name="total")
    )
    por_calzada = (
        df.groupby("calzada_grupo").size().sort_values(ascending=False).reset_index(name="total")
    )
    por_defecto = (
        df["road_defect"].value_counts().head(5).reset_index()
    )
    por_defecto.columns = ["defecto", "total"]

    # Cruce calzada vs severidad
    ct_calzada_sev = pd.crosstab(df["calzada_grupo"], df["severidad"]).reset_index()
    calzada_severidad = ct_calzada_sev.to_dict(orient="records")

    # Cruce iluminacion vs severidad
    ct_ilum_sev = pd.crosstab(df["iluminacion_grupo"], df["severidad"]).reset_index()
    iluminacion_severidad = ct_ilum_sev.to_dict(orient="records")

    vista_condiciones = {
        "clima": por_clima.to_dict(orient="records"),
        "iluminacion": por_iluminacion.to_dict(orient="records"),
        "calzada": por_calzada.to_dict(orient="records"),
        "defectos": por_defecto.to_dict(orient="records"),
        "calzada_severidad": calzada_severidad,
        "iluminacion_severidad": iluminacion_severidad,
    }

    # --- VISTA 4: POR QUÉ OCURREN (CAUSAS, CONTROLES, VÍAS, PRIORIZACIÓN) ---
    causas_top = df["prim_contributory_cause"].value_counts().head(8).reset_index()
    causas_top.columns = ["causa", "total"]

    dispositivos_top = df["traffic_control_device"].value_counts().head(8).reset_index()
    dispositivos_top.columns = ["dispositivo", "total"]

    tipos_via_top = df["trafficway_type"].value_counts().head(8).reset_index()
    tipos_via_top.columns = ["tipo_via", "total"]

    interseccion_dist = df["interseccion"].value_counts().to_dict()
    interseccion_data = [
        {"categoria": "En Intersección", "total": int(interseccion_dist.get(True, 0))},
        {"categoria": "Tramo Recto / No Intersección", "total": int(interseccion_dist.get(False, 0))},
    ]

    # Cruce priorizacion: tipo de vía x intersección (para responder dónde priorizar sin GPS)
    ct_via_inter = pd.crosstab(df["trafficway_type"], df["interseccion"])
    top_vias_idx = df["trafficway_type"].value_counts().head(6).index
    ct_via_inter_top = ct_via_inter.loc[top_vias_idx].reset_index()
    ct_via_inter_top.columns = ["tipo_via", "no_interseccion", "interseccion"]
    priorizacion_vias = ct_via_inter_top.to_dict(orient="records")

    vista_por_que = {
        "causas_top": causas_top.to_dict(orient="records"),
        "dispositivos_top": dispositivos_top.to_dict(orient="records"),
        "tipos_via_top": tipos_via_top.to_dict(orient="records"),
        "interseccion": interseccion_data,
        "priorizacion_vias": priorizacion_vias,
    }

    # --- VISTA 5: SEVERIDAD Y LESIONES ---
    distribucion_severidad = [
        {"nivel": "Solo Daños", "total": solo_danos, "color": "#3b82f6"},
        {"nivel": "Con Heridos", "total": con_heridos, "color": "#f59e0b"},
        {"nivel": "Fatal", "total": fatales, "color": "#ef4444"},
    ]

    danos_materiales = df["damage"].value_counts().reset_index()
    danos_materiales.columns = ["rango_dano", "total"]

    lesiones_detalle = [
        {"tipo": "Fatales", "cantidad": total_fatalities},
        {"tipo": "Incapacitantes", "cantidad": total_incapacitating},
        {"tipo": "No Incapacitantes", "cantidad": int(df["injuries_non_incapacitating"].sum())},
        {"tipo": "Reportadas Sin Evidencia", "cantidad": int(df["injuries_reported_not_evident"].sum())},
    ]

    vista_severidad = {
        "distribucion": distribucion_severidad,
        "danos_materiales": danos_materiales.to_dict(orient="records"),
        "lesiones_detalle": lesiones_detalle,
    }

    return {
        "metadatos": {
            "version": "2.0.0",
            "origen": "data/clean/traffic_accidents_clean.csv",
            "descripcion": "Datos agregados y normalizados para las 5 vistas del dashboard de siniestralidad vial",
        },
        "resumen": kpis,
        "cuando": vista_cuando,
        "condiciones": vista_condiciones,
        "por_que": vista_por_que,
        "severidad": vista_severidad,
    }


def main():
    parser = argparse.ArgumentParser(description="Genera dashboard_data.json para el frontend Next.js")
    parser.add_argument(
        "--clean-csv",
        type=Path,
        default=Path("data/clean/traffic_accidents_clean.csv"),
        help="Ruta al CSV limpio",
    )
    parser.add_argument(
        "--out-json",
        type=Path,
        default=Path("frontend/src/data/dashboard_data.json"),
        help="Ruta al archivo JSON de salida",
    )
    args = parser.parse_args()

    print(f"Cargando dataset limpio desde {args.clean_csv}...")
    df = load_clean_data(args.clean_csv)

    print("Calculando agregaciones para las 5 vistas obligatorias...")
    payload = generate_dashboard_payload(df)

    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    with open(args.out_json, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Archivo generado exitosamente en: {args.out_json}")


if __name__ == "__main__":
    main()
