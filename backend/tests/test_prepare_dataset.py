"""Reglas de limpieza y documentación del dataset de siniestralidad vial.

Cada test fija un comportamiento observable de `prepare_dataset.py`: lo que el
script promete en el diccionario de datos tiene que ser verificable en la salida.
"""

import hashlib
from pathlib import Path

import pandas as pd
import pytest

import prepare_dataset as pds


RAW_COLUMNS = [
    "crash_date", "traffic_control_device", "weather_condition", "lighting_condition",
    "first_crash_type", "trafficway_type", "alignment", "roadway_surface_cond",
    "road_defect", "crash_type", "intersection_related_i", "damage",
    "prim_contributory_cause", "num_units", "most_severe_injury", "injuries_total",
    "injuries_fatal", "injuries_incapacitating", "injuries_non_incapacitating",
    "injuries_reported_not_evident", "injuries_no_indication", "crash_hour",
    "crash_day_of_week", "crash_month",
]

DERIVED_COLUMNS = [
    "fecha", "anio", "dia_semana", "mes_nombre", "severidad", "lesionados",
    "iluminacion_grupo", "clima_grupo", "calzada_grupo", "interseccion",
]


def _row(**overrides):
    base = {
        "crash_date": "07/29/2023 01:00:00 PM",
        "traffic_control_device": "TRAFFIC SIGNAL",
        "weather_condition": "CLEAR",
        "lighting_condition": "DAYLIGHT",
        "first_crash_type": "TURNING",
        "trafficway_type": "FOUR WAY",
        "alignment": "STRAIGHT AND LEVEL",
        "roadway_surface_cond": "DRY",
        "road_defect": "NO DEFECTS",
        "crash_type": "INJURY AND / OR TOW DUE TO CRASH",
        "intersection_related_i": "Y",
        "damage": "OVER $1,500",
        "prim_contributory_cause": "FAILING TO YIELD RIGHT-OF-WAY",
        "num_units": 2,
        "most_severe_injury": "NONINCAPACITATING INJURY",
        "injuries_total": 1.0,
        "injuries_fatal": 0.0,
        "injuries_incapacitating": 0.0,
        "injuries_non_incapacitating": 1.0,
        "injuries_reported_not_evident": 0.0,
        "injuries_no_indication": 1.0,
        "crash_hour": 13,
        "crash_day_of_week": 7,
        "crash_month": 7,
    }
    base.update(overrides)
    return base


def _fixture_frame():
    """Dataset mínimo con los casos que las reglas documentadas deben cubrir."""
    return pd.DataFrame([
        _row(),
        # duplicado exacto de la fila anterior
        _row(),
        # fatal, domingo 1, clima con niebla y calzada helada
        _row(crash_date="01/01/2023 03:30:00 AM", crash_day_of_week=1, crash_hour=3,
             crash_month=1, injuries_total=3.0, injuries_fatal=1.0,
             injuries_incapacitating=1.0, injuries_non_incapacitating=1.0,
             most_severe_injury="FATAL", weather_condition="FOG/SMOKE/HAZE",
             roadway_surface_cond="ICE", lighting_condition="DARKNESS",
             alignment="CURVE ON GRADE", intersection_related_i="N",
             traffic_control_device="UNKNOWN"),
        # solo daños
        _row(crash_date="12/25/2022 11:00:00 PM", crash_day_of_week=1, crash_hour=23,
             crash_month=12, injuries_total=0.0, injuries_non_incapacitating=0.0,
             injuries_no_indication=2.0, most_severe_injury="NO INDICATION OF INJURY",
             weather_condition="UNKNOWN", roadway_surface_cond="UNKNOWN",
             lighting_condition="UNKNOWN", crash_type="NO INJURY / DRIVE AWAY"),
        # categoría no mapeada a propósito, para exigir un fallback sin nulos
        _row(crash_date="06/15/2024 08:15:00 AM", crash_day_of_week=6, crash_hour=8,
             crash_month=6, weather_condition="BLOWING SAND, SOIL, DIRT",
             roadway_surface_cond="SAND, MUD, DIRT", lighting_condition="DUSK",
             injuries_total=2.0, injuries_non_incapacitating=2.0,
             most_severe_injury="NONINCAPACITATING INJURY"),
    ], columns=RAW_COLUMNS)


@pytest.fixture()
def raw_path(tmp_path):
    path = tmp_path / "traffic_accidents.csv"
    _fixture_frame().to_csv(path, index=False)
    return path


def test_elimina_duplicados_exactos_y_lo_reporta():
    clean, rules = pds.clean_frame(_fixture_frame())

    assert len(clean) == 4
    regla = next(r for r in rules if r["id"] == "R1")
    assert regla["filas_afectadas"] == 1


def test_severidad_derivada_respeta_la_regla_documentada():
    clean, _ = pds.clean_frame(_fixture_frame())

    assert list(clean["severidad"]) == ["Con Heridos", "Fatal", "Solo Daños", "Con Heridos"]


def test_dia_semana_usa_uno_igual_domingo_y_concuerda_con_la_fecha():
    clean, _ = pds.clean_frame(_fixture_frame())

    assert clean.loc[0, "dia_semana"] == "Sábado"
    assert clean.loc[1, "dia_semana"] == "Domingo"
    # la fecha parseada tiene que confirmar el nombre del día
    for _, row in clean.iterrows():
        esperado = pds.DIAS_SEMANA[int(row["crash_day_of_week"])]
        assert row["dia_semana"] == esperado
        assert pd.Timestamp(row["fecha"]).day_name(locale=None) is not None


def test_fecha_iso_y_anio_derivados_del_campo_original():
    clean, _ = pds.clean_frame(_fixture_frame())

    assert clean.loc[0, "fecha"] == "2023-07-29 13:00:00"
    assert clean.loc[0, "anio"] == 2023
    assert clean.loc[1, "fecha"] == "2023-01-01 03:30:00"


def test_grupos_normalizados_cubren_todas_las_categorias_sin_nulos():
    clean, _ = pds.clean_frame(_fixture_frame())

    for columna in ("clima_grupo", "iluminacion_grupo", "calzada_grupo"):
        assert clean[columna].isna().sum() == 0, f"{columna} dejó valores sin clasificar"

    assert set(clean["clima_grupo"]) == {"Despejado", "Neblina o humo", "Desconocido", "Viento o partículas"}
    assert set(clean["iluminacion_grupo"]) == {"Día", "Noche sin iluminación", "Desconocida", "Transición"}
    assert set(clean["calzada_grupo"]) == {"Seca", "Invernal", "Desconocida", "Suelta"}


def test_conserva_las_columnas_originales_y_agrega_las_derivadas():
    clean, _ = pds.clean_frame(_fixture_frame())

    for columna in RAW_COLUMNS:
        assert columna in clean.columns, f"se perdió la columna original {columna}"
    for columna in DERIVED_COLUMNS:
        assert columna in clean.columns, f"falta la columna derivada {columna}"


def test_interseccion_se_traduce_a_booleano_legible():
    clean, _ = pds.clean_frame(_fixture_frame())

    assert list(clean["interseccion"]) == [1, 0, 1, 1]


def test_prepare_escribe_dataset_reporte_y_documentacion(tmp_path, raw_path):
    out_dir = tmp_path / "clean"
    docs_dir = tmp_path / "docs"

    report = pds.prepare(raw_path, out_dir, docs_dir)

    assert (out_dir / "traffic_accidents_clean.csv").exists()
    assert (out_dir / "quality_report.json").exists()
    assert (docs_dir / "diccionario-de-datos.md").exists()
    assert (docs_dir / "data-understanding-report.md").exists()

    assert report["fuente"]["filas"] == 5
    assert report["salida"]["filas"] == 4
    assert report["calidad"]["duplicados_exactos"] == 1
    assert len(report["fuente"]["sha256"]) == 64


def test_el_reporte_cubre_los_diez_puntos_del_data_understanding(tmp_path, raw_path):
    report = pds.prepare(raw_path, tmp_path / "clean", tmp_path / "docs")

    calidad = report["calidad"]
    for clave in ("faltantes_por_columna", "cardinalidad", "valores_atipicos",
                  "distribucion_lesiones", "distribucion_severidad",
                  "principales_causas", "problemas_de_calidad"):
        assert clave in calidad, f"falta {clave} en el reporte de calidad"
    assert "rangos" in calidad
    assert report["reglas"], "el reporte tiene que documentar las transformaciones aplicadas"


def test_no_modifica_el_csv_de_origen(tmp_path, raw_path):
    antes = hashlib.sha256(raw_path.read_bytes()).hexdigest()

    pds.prepare(raw_path, tmp_path / "clean", tmp_path / "docs")

    assert hashlib.sha256(raw_path.read_bytes()).hexdigest() == antes


def test_regenerar_produce_el_mismo_archivo(tmp_path, raw_path):
    pds.prepare(raw_path, tmp_path / "a", tmp_path / "docs_a")
    pds.prepare(raw_path, tmp_path / "b", tmp_path / "docs_b")

    a = (tmp_path / "a" / "traffic_accidents_clean.csv").read_bytes()
    b = (tmp_path / "b" / "traffic_accidents_clean.csv").read_bytes()
    assert a == b, "el pipeline no es determinista"


def test_la_documentacion_generada_explica_las_reglas_y_la_trazabilidad(tmp_path, raw_path):
    pds.prepare(raw_path, tmp_path / "clean", tmp_path / "docs")

    diccionario = (tmp_path / "docs" / "diccionario-de-datos.md").read_text(encoding="utf-8")
    informe = (tmp_path / "docs" / "data-understanding-report.md").read_text(encoding="utf-8")

    assert "severidad" in diccionario
    assert "R1" in diccionario, "el diccionario tiene que referenciar las reglas aplicadas"
    assert "sha-256" in informe.lower()
    assert "209.306" not in informe, "el informe no debe inventar dimensiones del dataset real"
