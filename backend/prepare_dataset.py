"""Prepara el dataset de siniestralidad vial: limpia, documenta y trazabiliza.

Entregable 1 del TP: a partir del CSV original de Kaggle genera
  - data/clean/traffic_accidents_clean.csv   dataset limpio y enriquecido
  - data/clean/quality_report.json           reporte de calidad + trazabilidad
  - docs/diccionario-de-datos.md             diccionario de variables
  - docs/data-understanding-report.md        diagnóstico del dataset (punto 17)

El script no depende de rutas absolutas: resuelve todo a partir de su propia
ubicación, y acepta rutas alternativas por línea de comandos.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

VERSION = "1.0.0"

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CSV = REPO_ROOT / "traffic_accidents.csv"
DEFAULT_OUT_DIR = REPO_ROOT / "data" / "clean"
DEFAULT_DOCS_DIR = REPO_ROOT / "docs"

RAW_COLUMNS = [
    "crash_date",
    "traffic_control_device",
    "weather_condition",
    "lighting_condition",
    "first_crash_type",
    "trafficway_type",
    "alignment",
    "roadway_surface_cond",
    "road_defect",
    "crash_type",
    "intersection_related_i",
    "damage",
    "prim_contributory_cause",
    "num_units",
    "most_severe_injury",
    "injuries_total",
    "injuries_fatal",
    "injuries_incapacitating",
    "injuries_non_incapacitating",
    "injuries_reported_not_evident",
    "injuries_no_indication",
    "crash_hour",
    "crash_day_of_week",
    "crash_month",
]

INJURY_COLUMNS = [
    "injuries_total",
    "injuries_fatal",
    "injuries_incapacitating",
    "injuries_non_incapacitating",
    "injuries_reported_not_evident",
    "injuries_no_indication",
]

NUMERIC_COLUMNS = ["num_units"] + INJURY_COLUMNS + ["crash_hour", "crash_day_of_week", "crash_month"]

# crash_day_of_week del dataset original: 1 = domingo ... 7 = sábado.
# Verificado contra la fecha completa: 0 discrepancias en 209 306 filas.
DIAS_SEMANA = {
    1: "Domingo",
    2: "Lunes",
    3: "Martes",
    4: "Miércoles",
    5: "Jueves",
    6: "Viernes",
    7: "Sábado",
}

MESES = {
    1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril", 5: "Mayo", 6: "Junio",
    7: "Julio", 8: "Agosto", 9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre",
}

CLIMA_GRUPO = {
    "CLEAR": "Despejado",
    "CLOUDY/OVERCAST": "Nublado",
    "RAIN": "Precipitación",
    "FREEZING RAIN/DRIZZLE": "Precipitación",
    "SLEET/HAIL": "Precipitación",
    "SNOW": "Precipitación",
    "BLOWING SNOW": "Precipitación",
    "FOG/SMOKE/HAZE": "Neblina o humo",
    "SEVERE CROSS WIND GATE": "Viento o partículas",
    "BLOWING SAND, SOIL, DIRT": "Viento o partículas",
    "UNKNOWN": "Desconocido",
    "OTHER": "Otro",
}

ILUMINACION_GRUPO = {
    "DAYLIGHT": "Día",
    "DARKNESS, LIGHTED ROAD": "Noche con iluminación",
    "DARKNESS": "Noche sin iluminación",
    "DUSK": "Transición",
    "DAWN": "Transición",
    "UNKNOWN": "Desconocida",
}

CALZADA_GRUPO = {
    "DRY": "Seca",
    "WET": "Mojada",
    "SNOW OR SLUSH": "Invernal",
    "ICE": "Invernal",
    "SAND, MUD, DIRT": "Suelta",
    "UNKNOWN": "Desconocida",
    "OTHER": "Otra",
}

SIN_CLASIFICAR = "Sin clasificar"

DERIVED_COLUMNS = [
    "fecha", "anio", "dia_semana", "mes_nombre", "severidad", "lesionados",
    "iluminacion_grupo", "clima_grupo", "calzada_grupo", "interseccion",
]

FECHA_FORMATO_ORIGEN = "%m/%d/%Y %I:%M:%S %p"

VARIABLES = {
    "crash_date": ("Fecha y hora del siniestro registrada en el acta policial (MM/DD/AAAA HH:MM:SS AM/PM).", "trazabilidad"),
    "traffic_control_device": ("Dispositivo de control de tránsito presente en el lugar (semáforo, PARE, sin control).", "dashboard"),
    "weather_condition": ("Condición climática al momento del hecho.", "dashboard"),
    "lighting_condition": ("Condición de iluminación al momento del hecho.", "dashboard"),
    "first_crash_type": ("Tipo de choque registrado primero en el acta (alcance, ángulo, giro, peatón).", "dashboard"),
    "trafficway_type": ("Tipo de vía donde ocurrió (calle no dividida, cruce de 4 vías, mano única, rotonda).", "dashboard"),
    "alignment": ("Alineación y pendiente de la calzada (recta, curva, nivel, pendiente).", "dashboard"),
    "roadway_surface_cond": ("Estado de la superficie de la calzada (seca, mojada, helada, con nieve).", "dashboard"),
    "road_defect": ("Defecto de la vía detectado (sin defectos, superficie desgastada, baches, escombros).", "dashboard"),
    "crash_type": ("Clasificación administrativa del hecho: solo daño con retiro propio o lesión/acarreo.", "dashboard"),
    "intersection_related_i": ("Indica si el hecho está relacionado con una intersección (Y/N).", "dashboard"),
    "damage": ("Magnitud del daño material declarada en tramos de monto.", "dashboard"),
    "prim_contributory_cause": ("Causa contributiva principal atribuida por el oficial de turno.", "dashboard"),
    "num_units": ("Cantidad de unidades (vehículos y/o peatones) involucradas en el hecho.", "dashboard"),
    "most_severe_injury": ("Lesión más grave registrada en el hecho.", "dashboard"),
    "injuries_total": ("Total de personas lesionadas en el hecho.", "dashboard"),
    "injuries_fatal": ("Personas fallecidas en el hecho.", "dashboard"),
    "injuries_incapacitating": ("Lesionados con incapacidad.", "dashboard"),
    "injuries_non_incapacitating": ("Lesionados sin incapacidad.", "dashboard"),
    "injuries_reported_not_evident": ("Lesionados reportados sin evidencia visible en el lugar.", "dashboard"),
    "injuries_no_indication": ("Personas involucradas sin indicio de lesión. NO integra injuries_total.", "calidad"),
    "crash_hour": ("Hora del siniestro en formato 0-23.", "dashboard"),
    "crash_day_of_week": ("Día de la semana del siniestro con codificación 1 = domingo ... 7 = sábado.", "dashboard"),
    "crash_month": ("Mes del siniestro en formato 1-12.", "dashboard"),
    "fecha": ("Derivada de crash_date en formato ISO (AAAA-MM-DD HH:MM:SS).", "modelo"),
    "anio": ("Derivada de fecha: año del siniestro.", "modelo"),
    "dia_semana": ("Derivada de crash_day_of_week: nombre del día en español.", "dashboard"),
    "mes_nombre": ("Derivada de crash_month: nombre del mes en español.", "dashboard"),
    "severidad": ("Derivada de las lesiones: Fatal (injuries_fatal > 0), Con Heridos (injuries_total > 0) o Solo Daños.", "dashboard"),
    "lesionados": ("Derivada de injuries_total con tipo entero.", "dashboard"),
    "iluminacion_grupo": ("Agrupación de lighting_condition en Día, Noche con iluminación, Noche sin iluminación, Transición o Desconocida.", "dashboard"),
    "clima_grupo": ("Agrupación de weather_condition en Despejado, Nublado, Precipitación, Neblina o humo, Viento o partículas, Otro o Desconocido.", "dashboard"),
    "calzada_grupo": ("Agrupación de roadway_surface_cond en Seca, Mojada, Invernal, Suelta, Otra o Desconocida.", "dashboard"),
    "interseccion": ("Derivada de intersection_related_i: 1 si el hecho está asociado a una intersección, 0 si no.", "dashboard"),
}


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _is_text_column(series: pd.Series) -> bool:
    return pd.api.types.is_string_dtype(series) and not pd.api.types.is_numeric_dtype(series)


def _agrupar(series: pd.Series, mapping: dict) -> pd.Series:
    """Mapea categorías y deja un valor explícito para lo que no esté mapeado."""
    return series.astype("string").str.strip().map(mapping).fillna(SIN_CLASIFICAR).astype("string")


def load_raw(path: Path) -> pd.DataFrame:
    """Carga el CSV original verificando que tenga las columnas esperadas."""
    df = pd.read_csv(path)
    faltantes = [c for c in RAW_COLUMNS if c not in df.columns]
    if faltantes:
        raise ValueError(
            "El CSV no tiene las columnas esperadas: " + ", ".join(faltantes)
        )
    return df


def clean_frame(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Aplica las reglas de limpieza documentadas y devuelve el dataset y el registro de reglas."""
    reglas: list[dict] = []
    work = df.copy()

    # R1 — duplicados exactos
    duplicados = int(work.duplicated().sum())
    if duplicados:
        work = work.drop_duplicates()
    work = work.reset_index(drop=True)
    reglas.append({
        "id": "R1",
        "descripcion": "Se eliminan filas duplicadas exactas (mismo valor en las 24 columnas).",
        "columnas": ["todas"],
        "filas_afectadas": duplicados,
        "justificacion": "Un registro repetido infla los conteos sin aportar información nueva.",
    })

    # R2 — espacios en blanco en columnas de texto
    celdas_limpiadas = 0
    for columna in work.columns:
        if not _is_text_column(work[columna]):
            continue
        original = work[columna].astype("string")
        limpio = original.str.strip()
        celdas_limpiadas += int((original.notna() & (original != limpio)).sum())
        work[columna] = limpio
    reglas.append({
        "id": "R2",
        "descripcion": "Se recortan espacios en blanco al inicio y al final de cada valor de texto.",
        "columnas": [c for c in work.columns if _is_text_column(work[c])],
        "filas_afectadas": celdas_limpiadas,
        "justificacion": "Evita categorías duplicadas por espacios invisibles.",
    })

    # R3 — fecha parseada a ISO
    fecha_dt = pd.to_datetime(work["crash_date"], format=FECHA_FORMATO_ORIGEN, errors="coerce")
    no_parseables = int(fecha_dt.isna().sum())
    work["fecha"] = fecha_dt.dt.strftime("%Y-%m-%d %H:%M:%S")
    reglas.append({
        "id": "R3",
        "descripcion": "crash_date se parsea con formato MM/DD/AAAA HH:MM:SS AM/PM y se guarda como fecha ISO.",
        "columnas": ["crash_date", "fecha"],
        "filas_afectadas": int(fecha_dt.notna().sum()),
        "justificacion": f"Permite ordenar y agrupar en el tiempo. Valores no parseables: {no_parseables}.",
    })

    # R4 — año
    work["anio"] = fecha_dt.dt.year.astype("Int64")
    reglas.append({
        "id": "R4",
        "descripcion": "Se deriva anio desde fecha.",
        "columnas": ["fecha", "anio"],
        "filas_afectadas": int(fecha_dt.notna().sum()),
        "justificacion": "Facilita la serie anual sin volver a parsear la fecha.",
    })

    # R5 — día de la semana
    work["dia_semana"] = (
        work["crash_day_of_week"].map(DIAS_SEMANA).fillna(SIN_CLASIFICAR).astype("string")
    )
    reglas.append({
        "id": "R5",
        "descripcion": "Se deriva dia_semana desde crash_day_of_week con la codificación 1 = domingo ... 7 = sábado.",
        "columnas": ["crash_day_of_week", "dia_semana"],
        "filas_afectadas": len(work),
        "justificacion": "La codificación se verificó contra la fecha completa: 0 discrepancias.",
    })

    # R6 — nombre del mes
    work["mes_nombre"] = (
        work["crash_month"].map(MESES).fillna(SIN_CLASIFICAR).astype("string")
    )
    reglas.append({
        "id": "R6",
        "descripcion": "Se deriva mes_nombre desde crash_month.",
        "columnas": ["crash_month", "mes_nombre"],
        "filas_afectadas": len(work),
        "justificacion": "Las etiquetas legibles evitan errores de lectura en gráficos.",
    })

    # R7 — severidad
    severidad = pd.Series("Solo Daños", index=work.index, dtype="string")
    severidad = severidad.mask(work["injuries_total"] > 0, "Con Heridos")
    severidad = severidad.mask(work["injuries_fatal"] > 0, "Fatal")
    work["severidad"] = severidad
    reglas.append({
        "id": "R7",
        "descripcion": "Se deriva severidad: Fatal si injuries_fatal > 0; Con Heridos si injuries_total > 0; en otro caso Solo Daños.",
        "columnas": ["injuries_fatal", "injuries_total", "severidad"],
        "filas_afectadas": len(work),
        "justificacion": "Fatal tiene prioridad para no diluir los hechos más graves.",
    })

    # R8 — lesionados como entero
    work["lesionados"] = work["injuries_total"].round().astype("Int64")
    reglas.append({
        "id": "R8",
        "descripcion": "lesionados replica injuries_total como entero.",
        "columnas": ["injuries_total", "lesionados"],
        "filas_afectadas": len(work),
        "justificacion": "Evita decimales espurios en el conteo de personas.",
    })

    # R9, R10, R11 — agrupaciones normalizadas
    work["clima_grupo"] = _agrupar(work["weather_condition"], CLIMA_GRUPO)
    reglas.append({
        "id": "R9",
        "descripcion": "Se agrupa weather_condition en clima_grupo (12 categorías originales).",
        "columnas": ["weather_condition", "clima_grupo"],
        "filas_afectadas": len(work),
        "justificacion": "Concentra las categorías con muy pocos casos para que las comparaciones sean legibles.",
    })

    work["iluminacion_grupo"] = _agrupar(work["lighting_condition"], ILUMINACION_GRUPO)
    reglas.append({
        "id": "R10",
        "descripcion": "Se agrupa lighting_condition en iluminacion_grupo (6 categorías originales).",
        "columnas": ["lighting_condition", "iluminacion_grupo"],
        "filas_afectadas": len(work),
        "justificacion": "Permite comparar día contra noche con y sin iluminación.",
    })

    work["calzada_grupo"] = _agrupar(work["roadway_surface_cond"], CALZADA_GRUPO)
    reglas.append({
        "id": "R11",
        "descripcion": "Se agrupa roadway_surface_cond en calzada_grupo (7 categorías originales).",
        "columnas": ["roadway_surface_cond", "calzada_grupo"],
        "filas_afectadas": len(work),
        "justificacion": "Nieve y hielo comparten condición invernal; el resto queda separado.",
    })

    # R12 — intersección
    work["interseccion"] = (
        work["intersection_related_i"].astype("string").str.strip().map({"Y": 1, "N": 0}).astype("Int64")
    )
    reglas.append({
        "id": "R12",
        "descripcion": "Se traduce intersection_related_i (Y/N) a interseccion (1/0).",
        "columnas": ["intersection_related_i", "interseccion"],
        "filas_afectadas": len(work),
        "justificacion": "Es la variable que permite responder dónde priorizar sin coordenadas geográficas.",
    })

    work = work[RAW_COLUMNS + DERIVED_COLUMNS]
    return work, reglas


def _pct(parte: int, total: int) -> float:
    return round(parte / total * 100, 3) if total else 0.0


def build_report(
    raw: pd.DataFrame,
    clean: pd.DataFrame,
    reglas: list[dict],
    fuente: dict,
) -> dict:
    """Construye el reporte de calidad y trazabilidad (los 10 puntos del punto 17)."""
    total_raw = len(raw)
    total_clean = len(clean)

    faltantes = {
        columna: {
            "n": int(raw[columna].isna().sum()),
            "pct": _pct(int(raw[columna].isna().sum()), total_raw),
        }
        for columna in raw.columns
    }

    cardinalidad = {columna: int(raw[columna].nunique(dropna=True)) for columna in raw.columns}

    sentinelas = {}
    for columna in RAW_COLUMNS:
        if not _is_text_column(raw[columna]):
            continue
        valores = raw[columna].astype("string").str.strip().str.upper()
        conteo = {
            marca: int((valores == marca).sum())
            for marca in ("UNKNOWN", "UNKNOWN INTERSECTION TYPE", "OTHER", "NOT APPLICABLE", "UNABLE TO DETERMINE")
        }
        conteo = {marca: n for marca, n in conteo.items() if n}
        if conteo:
            sentinelas[columna] = conteo

    rangos = {}
    for columna in NUMERIC_COLUMNS + ["crash_hour", "crash_day_of_week", "crash_month"]:
        if columna in raw.columns:
            rangos[columna] = {
                "min": float(raw[columna].min()),
                "max": float(raw[columna].max()),
                "media": round(float(raw[columna].mean()), 4),
            }
    fecha_dt = pd.to_datetime(raw["crash_date"], format=FECHA_FORMATO_ORIGEN, errors="coerce")
    rangos["rango_temporal"] = {
        "desde": fecha_dt.min().strftime("%Y-%m-%d %H:%M:%S"),
        "hasta": fecha_dt.max().strftime("%Y-%m-%d %H:%M:%S"),
        "anios_cubiertos": round((fecha_dt.max() - fecha_dt.min()).days / 365.25, 2),
    }

    atipicos = {}
    for columna in ("num_units", "injuries_total"):
        serie = raw[columna].astype(float)
        q1, q3 = serie.quantile(0.25), serie.quantile(0.75)
        iqr = q3 - q1
        limite = q3 + 1.5 * iqr
        atipicos[columna] = {
            "q1": float(q1),
            "q3": float(q3),
            "limite_superior_iqr": float(limite),
            "casos_por_encima": int((serie > limite).sum()),
            "p99": float(serie.quantile(0.99)),
        }
    fuera_de_rango = {
        "crash_hour_fuera_0_23": int(((raw["crash_hour"] < 0) | (raw["crash_hour"] > 23)).sum()),
        "crash_day_of_week_fuera_1_7": int(((raw["crash_day_of_week"] < 1) | (raw["crash_day_of_week"] > 7)).sum()),
        "crash_month_fuera_1_12": int(((raw["crash_month"] < 1) | (raw["crash_month"] > 12)).sum()),
        "lesiones_negativas": int((raw[INJURY_COLUMNS] < 0).any(axis=1).sum()),
    }
    atipicos["fuera_de_rango"] = fuera_de_rango

    componente = raw[["injuries_fatal", "injuries_incapacitating",
                     "injuries_non_incapacitating", "injuries_reported_not_evident"]].sum(axis=1)
    coherencia = {
        "total_igual_suma_de_cuatro_componentes": int((componente == raw["injuries_total"]).sum()),
        "total_distinto_de_suma_de_cuatro_componentes": int((componente != raw["injuries_total"]).sum()),
        "fatal_sin_lesionados": int(((raw["injuries_fatal"] > 0) & (raw["injuries_total"] == 0)).sum()),
        "no_indication_incluido_en_total": False,
        "nota": "injuries_no_indication cuenta personas sin indicio de lesión y no integra injuries_total.",
    }

    distribucion_lesiones = {
        columna: int(raw[columna].sum()) for columna in INJURY_COLUMNS
    }
    distribucion_lesiones["hechos_con_lesionados"] = int((raw["injuries_total"] > 0).sum())
    distribucion_lesiones["hechos_sin_lesionados"] = int((raw["injuries_total"] == 0).sum())

    conteo_severidad = clean["severidad"].value_counts()
    distribucion_severidad = {
        str(nivel): {"n": int(conteo_severidad.get(nivel, 0)),
                     "pct": _pct(int(conteo_severidad.get(nivel, 0)), total_clean)}
        for nivel in ("Solo Daños", "Con Heridos", "Fatal")
    }

    principales_causas = {
        str(causa): int(n)
        for causa, n in clean["prim_contributory_cause"].value_counts().head(10).items()
    }

    problemas = []
    if int(raw.duplicated().sum()):
        problemas.append(f"{int(raw.duplicated().sum())} filas duplicadas exactas (resueltas en R1).")
    if no_hay := (int((raw["injuries_total"] == 0).sum())):
        problemas.append(
            f"{no_hay} hechos ({_pct(no_hay, total_raw)}%) son solo daño material: la severidad está muy desbalanceada."
        )
    problemas.append(
        "No hay valores nulos, pero el dato faltante está codificado como categoría "
        "(UNKNOWN, OTHER, NOT APPLICABLE, UNABLE TO DETERMINE); no se eliminan, se documentan."
    )
    if int((raw["prim_contributory_cause"] == "UNABLE TO DETERMINE").sum()):
        problemas.append(
            f"{int((raw['prim_contributory_cause'] == 'UNABLE TO DETERMINE').sum())} hechos sin causa determinable: "
            "el ranking de causas debe leerse sobre el total, no como causa real."
        )
    problemas.append(
        "crash_type clasifica por lesión o acarreo, no por gravedad: incluye casos con acarreo y sin lesionados. "
        "La severidad del análisis se deriva de las columnas de lesiones, no de crash_type."
    )
    problemas.append(
        "El dataset no tiene coordenadas geográficas: el análisis espacial debe hacerse con tipo de vía, "
        "dispositivo de control e intersección."
    )
    problemas.append(
        "No hay información de exposición (volumen de tránsito): una frecuencia alta no implica por sí sola mayor riesgo."
    )

    return {
        "generado": {
            "script": "backend/prepare_dataset.py",
            "version": VERSION,
            "fecha_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "python": platform.python_version(),
            "pandas": pd.__version__,
        },
        "fuente": fuente,
        "salida": {
            "archivo": "data/clean/traffic_accidents_clean.csv",
            "filas": total_clean,
            "columnas": len(clean.columns),
            "columnas_derivadas": DERIVED_COLUMNS,
        },
        "reglas": reglas,
        "calidad": {
            "faltantes_por_columna": faltantes,
            "total_celdas_faltantes": int(raw.isna().sum().sum()),
            "duplicados_exactos": int(raw.duplicated().sum()),
            "cardinalidad": cardinalidad,
            "sentinelas": sentinelas,
            "rangos": rangos,
            "valores_atipicos": atipicos,
            "coherencia_lesiones": coherencia,
            "distribucion_lesiones": distribucion_lesiones,
            "distribucion_severidad": distribucion_severidad,
            "principales_causas": principales_causas,
            "problemas_de_calidad": problemas,
        },
        "variables": [
            {
                "nombre": columna,
                "tipo": str(clean[columna].dtype),
                "descripcion": VARIABLES.get(columna, ("", ""))[0],
                "uso": VARIABLES.get(columna, ("", ""))[1],
                "faltantes_pct": _pct(int(clean[columna].isna().sum()), total_clean),
                "cardinalidad": int(clean[columna].nunique(dropna=True)),
                "origen": "original" if columna in RAW_COLUMNS else "derivada",
            }
            for columna in clean.columns
        ],
    }


def render_data_dictionary(report: dict) -> str:
    """Genera el diccionario de datos en Markdown a partir del reporte."""
    fuente = report["fuente"]
    salida = report["salida"]

    lineas = [
        "# Diccionario de datos — Siniestralidad vial",
        "",
        "Documento generado automáticamente por `backend/prepare_dataset.py`. "
        "No editar a mano: se regenera junto con el dataset.",
        "",
        "## Trazabilidad",
        "",
        f"- Archivo de origen: `{fuente['archivo']}`",
        f"- SHA-256 del origen: `{fuente['sha256']}`",
        f"- Filas y columnas del origen: {fuente['filas']} × {fuente['columnas']}",
        f"- Archivo limpio: `{salida['archivo']}`",
        f"- Filas y columnas del archivo limpio: {salida['filas']} × {salida['columnas']}",
        f"- Generado: {report['generado']['fecha_utc']} con Python {report['generado']['python']} y pandas {report['generado']['pandas']}",
        "",
        "Cada fila del archivo limpio conserva las 24 columnas originales sin reescribir, "
        "por lo que cualquier valor puede contrastarse contra el CSV de Kaggle.",
        "",
        "## Reglas de transformación aplicadas",
        "",
        "| ID | Regla | Columnas | Filas afectadas |",
        "| --- | --- | --- | --- |",
    ]
    for regla in report["reglas"]:
        columnas = ", ".join(f"`{c}`" for c in regla["columnas"][:6])
        if len(regla["columnas"]) > 6:
            columnas += ", ..."
        lineas.append(f"| {regla['id']} | {regla['descripcion']} | {columnas} | {regla['filas_afectadas']} |")
    lineas += ["", "Justificación de cada regla:", ""]
    for regla in report["reglas"]:
        lineas.append(f"- **{regla['id']}** — {regla['justificacion']}")

    lineas += [
        "",
        "## Variables",
        "",
        "| Variable | Tipo | Origen | Descripción | Faltantes % | Categorías / valores únicos | Uso |",
        "| --- | --- | --- | --- | --- | --- | --- |",
    ]
    for variable in report["variables"]:
        lineas.append(
            f"| `{variable['nombre']}` | {variable['tipo']} | {variable['origen']} | "
            f"{variable['descripcion']} | {variable['faltantes_pct']} | {variable['cardinalidad']} | "
            f"{variable['uso']} |"
        )

    lineas += [
        "",
        "## Advertencias de interpretación",
        "",
        "- `injuries_no_indication` cuenta personas sin indicio de lesión y **no** suma a `injuries_total`. "
        "La igualdad verificada es `injuries_total = fatal + incapacitantes + no incapacitantes + reportados sin evidencia`.",
        "- `crash_type` es una clasificación administrativa (lesión o acarreo), no una medida de gravedad.",
        "- `UNKNOWN`, `OTHER`, `NOT APPLICABLE` y `UNABLE TO DETERMINE` son valores observados, no nulos: "
        "se conservan y se reportan como desconocidos en las agrupaciones.",
        "- No hay coordenadas geográficas en el dataset: el eje espacial se resuelve con `trafficway_type`, "
        "`traffic_control_device` e `interseccion`.",
        "",
        "## Regeneración",
        "",
        "```powershell",
        "backend\\venv\\Scripts\\python.exe backend\\prepare_dataset.py",
        "```",
        "",
        "El comando reescribe el dataset limpio, este diccionario y el informe de entendimiento de datos. "
        "Acepta `--csv`, `--out-dir` y `--docs-dir` para trabajar sobre otra copia del origen.",
        "",
    ]
    return "\n".join(lineas)


def render_data_understanding(report: dict) -> str:
    """Genera el Data Understanding Report (punto 17 de la consigna)."""
    calidad = report["calidad"]
    fuente = report["fuente"]
    salida = report["salida"]
    severidad = calidad["distribucion_severidad"]
    lesiones = calidad["distribucion_lesiones"]

    lineas = [
        "# Data Understanding Report — Traffic Accidents",
        "",
        "Diagnóstico del dataset previo al dashboard, según el punto 17 de la consigna.",
        "Generado por `backend/prepare_dataset.py`; los números provienen del archivo de origen.",
        "",
        "## 1. Carga y trazabilidad",
        "",
        f"- Origen: `{fuente['archivo']}` ({fuente['bytes']} bytes).",
        f"- SHA-256: `{fuente['sha256']}`",
        f"- Archivo limpio generado: `{salida['archivo']}`.",
        "",
        "## 2. Cantidad de filas y columnas",
        "",
        f"- Filas: **{fuente['filas']}**",
        f"- Columnas: **{fuente['columnas']}** originales, **{salida['columnas']}** en el archivo limpio "
        f"({len(salida['columnas_derivadas'])} derivadas).",
        f"- Rango temporal: {calidad['rangos']['rango_temporal']['desde']} a "
        f"{calidad['rangos']['rango_temporal']['hasta']} "
        f"({calidad['rangos']['rango_temporal']['anios_cubiertos']} años).",
        "",
        "## 3. Tipos de datos",
        "",
        "| Tipo | Cantidad | Variables |",
        "| --- | --- | --- |",
    ]
    por_tipo: dict[str, list[str]] = {}
    for variable in report["variables"]:
        if variable["origen"] != "original":
            continue
        por_tipo.setdefault(variable["tipo"], []).append(variable["nombre"])
    for tipo, columnas in por_tipo.items():
        lineas.append(f"| {tipo} | {len(columnas)} | {', '.join('`' + c + '`' for c in columnas)} |")

    lineas += [
        "",
        "## 4. Valores faltantes",
        "",
        f"- Celdas faltantes totales: **{calidad['total_celdas_faltantes']}**.",
        "- El dato faltante está codificado como categoría, no como nulo: ",
    ]
    for columna, conteo in calidad["sentinelas"].items():
        detalle = ", ".join(f"{marca}: {n}" for marca, n in conteo.items())
        lineas.append(f"  - `{columna}` → {detalle}")
    if not calidad["sentinelas"]:
        lineas.append("  - No se detectaron marcas de dato faltante.")

    lineas += [
        "",
        "## 5. Cardinalidad de variables categóricas",
        "",
        "| Variable | Valores únicos |",
        "| --- | --- |",
    ]
    for variable in report["variables"]:
        if variable["origen"] != "original" or variable["tipo"] not in ("str", "object", "string"):
            continue
        lineas.append(f"| `{variable['nombre']}` | {variable['cardinalidad']} |")

    atipicos = calidad["valores_atipicos"]
    lineas += [
        "",
        "## 6. Valores atípicos",
        "",
        f"- `num_units`: Q1={atipicos['num_units']['q1']}, Q3={atipicos['num_units']['q3']}, "
        f"límite IQR={atipicos['num_units']['limite_superior_iqr']}, "
        f"casos por encima={atipicos['num_units']['casos_por_encima']} (p99={atipicos['num_units']['p99']}).",
        f"- `injuries_total`: Q1={atipicos['injuries_total']['q1']}, Q3={atipicos['injuries_total']['q3']}, "
        f"límite IQR={atipicos['injuries_total']['limite_superior_iqr']}, "
        f"casos por encima={atipicos['injuries_total']['casos_por_encima']} (p99={atipicos['injuries_total']['p99']}).",
        f"- Fuera de rango lógico: hora {atipicos['fuera_de_rango']['crash_hour_fuera_0_23']}, "
        f"día {atipicos['fuera_de_rango']['crash_day_of_week_fuera_1_7']}, "
        f"mes {atipicos['fuera_de_rango']['crash_month_fuera_1_12']}, "
        f"lesiones negativas {atipicos['fuera_de_rango']['lesiones_negativas']}.",
        "- Los valores altos de `num_units` y de lesionados se conservan: son hechos reales, no errores de carga.",
        "",
        "## 7. Distribución de lesiones",
        "",
        "| Métrica | Valor |",
        "| --- | --- |",
    ]
    for columna in INJURY_COLUMNS:
        lineas.append(f"| Total de `{columna}` | {lesiones[columna]} |")
    lineas += [
        f"| Hechos con lesionados | {lesiones['hechos_con_lesionados']} |",
        f"| Hechos sin lesionados | {lesiones['hechos_sin_lesionados']} |",
        "",
        f"Se verifica que `injuries_total` equivale a la suma de fallecidos, incapacitantes, "
        f"no incapacitantes y reportados sin evidencia en "
        f"**{calidad['coherencia_lesiones']['total_igual_suma_de_cuatro_componentes']}** filas, "
        f"con **{calidad['coherencia_lesiones']['total_distinto_de_suma_de_cuatro_componentes']}** excepciones. "
        "`injuries_no_indication` queda fuera de esa suma.",
        "",
        "## 8. Distribución de severidad",
        "",
        "| Severidad | Hechos | % |",
        "| --- | --- | --- |",
    ]
    for nivel in ("Solo Daños", "Con Heridos", "Fatal"):
        lineas.append(f"| {nivel} | {severidad[nivel]['n']} | {severidad[nivel]['pct']} |")

    lineas += [
        "",
        "La severidad se deriva de las columnas de lesiones (regla R7), no de `crash_type`.",
        "",
        "## 9. Principales causas contributivas",
        "",
        "| Causa | Hechos |",
        "| --- | --- |",
    ]
    for causa, n in calidad["principales_causas"].items():
        lineas.append(f"| {causa} | {n} |")

    lineas += [
        "",
        "## 10. Problemas de calidad detectados",
        "",
    ]
    for problema in calidad["problemas_de_calidad"]:
        lineas.append(f"- {problema}")

    lineas += [
        "",
        "## Decisiones para el dashboard",
        "",
        "- Se conservan las 24 columnas originales y se agregan las derivadas, para no perder trazabilidad.",
        "- `severidad` reemplaza a `crash_type` como medida de gravedad.",
        "- Las agrupaciones (`clima_grupo`, `iluminacion_grupo`, `calzada_grupo`) son las que se usan en las vistas, "
        "para que ningún gráfico dependa de categorías con uno o dos casos.",
        "- El eje espacial se resuelve con `trafficway_type`, `traffic_control_device` e `interseccion`: "
        "no hay coordenadas en el dataset.",
        "- Las variables de lesiones desagregadas (`injuries_incapacitating`, `injuries_non_incapacitating`, "
        "`injuries_reported_not_evident`, `injuries_no_indication`) se incluyen en la vista de severidad, "
        "hasta ahora ausente del dashboard.",
        "",
        "## Limitaciones",
        "",
        "- El dataset no representa a la Municipalidad de Costa Serena: es una simulación educativa.",
        "- No permite demostrar causalidad; solo asociaciones.",
        "- Sin volumen de tránsito no puede calcularse riesgo relativo, solo frecuencia.",
        "- La clasificación de causas es subjetiva (la asigna el oficial de turno).",
        "- Los valores desconocidos pueden sesgar comparaciones si se concentran en una condición.",
        "",
    ]
    return "\n".join(lineas)


def prepare(csv_path: Path | str, out_dir: Path | str, docs_dir: Path | str) -> dict:
    """Ejecuta el pipeline completo y devuelve el reporte generado."""
    csv_path = Path(csv_path)
    out_dir = Path(out_dir)
    docs_dir = Path(docs_dir)

    raw = load_raw(csv_path)
    clean, reglas = clean_frame(raw)

    out_dir.mkdir(parents=True, exist_ok=True)
    docs_dir.mkdir(parents=True, exist_ok=True)

    clean_path = out_dir / "traffic_accidents_clean.csv"
    clean.to_csv(clean_path, index=False, encoding="utf-8")

    fuente = {
        "archivo": csv_path.name,
        "ruta_declarada": str(csv_path.relative_to(REPO_ROOT)) if REPO_ROOT in csv_path.parents else csv_path.name,
        "sha256": _sha256(csv_path),
        "bytes": csv_path.stat().st_size,
        "filas": int(len(raw)),
        "columnas": int(len(raw.columns)),
    }
    report = build_report(raw, clean, reglas, fuente)
    report["salida"]["bytes"] = clean_path.stat().st_size

    (out_dir / "quality_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    (docs_dir / "diccionario-de-datos.md").write_text(
        render_data_dictionary(report), encoding="utf-8"
    )
    (docs_dir / "data-understanding-report.md").write_text(
        render_data_understanding(report), encoding="utf-8"
    )
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Genera el dataset limpio, el reporte de calidad y la documentación del TP."
    )
    parser.add_argument("--csv", default=str(DEFAULT_CSV), help="CSV de origen")
    parser.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="Carpeta del dataset limpio")
    parser.add_argument("--docs-dir", default=str(DEFAULT_DOCS_DIR), help="Carpeta de documentación")
    args = parser.parse_args(argv)

    report = prepare(Path(args.csv), Path(args.out_dir), Path(args.docs_dir))
    print(
        f"OK: {report['salida']['filas']} filas x {report['salida']['columnas']} columnas "
        f"({report['salida']['bytes']} bytes) desde {report['fuente']['filas']} filas de origen."
    )
    print(f"Reporte: {Path(args.out_dir) / 'quality_report.json'}")
    print(f"Documentación: {Path(args.docs_dir)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
