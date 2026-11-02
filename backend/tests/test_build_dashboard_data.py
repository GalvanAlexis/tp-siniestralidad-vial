"""
Pruebas para el generador del payload del dashboard (backend/build_dashboard_data.py).
"""

from pathlib import Path
import pandas as pd
import pytest

from build_dashboard_data import generate_dashboard_payload


@pytest.fixture
def sample_clean_df():
    data = {
        "anio": [2021, 2021, 2022],
        "mes_nombre": ["Enero", "Febrero", "Enero"],
        "dia_semana": ["Lunes", "Martes", "Domingo"],
        "crash_hour": [8, 14, 22],
        "severidad": ["Solo Daños", "Con Heridos", "Fatal"],
        "injuries_total": [0, 2, 1],
        "injuries_fatal": [0, 0, 1],
        "injuries_incapacitating": [0, 1, 0],
        "injuries_non_incapacitating": [0, 1, 0],
        "injuries_reported_not_evident": [0, 0, 0],
        "num_units": [2, 2, 3],
        "clima_grupo": ["CLEAR", "RAIN", "CLEAR"],
        "iluminacion_grupo": ["DAYLIGHT", "DAYLIGHT", "DARKNESS"],
        "calzada_grupo": ["DRY", "WET", "DRY"],
        "road_defect": ["NO DEFECTS", "NO DEFECTS", "RUT, HOLES"],
        "prim_contributory_cause": ["FOLLOWING TOO CLOSELY", "WEATHER", "FAILING TO YIELD"],
        "traffic_control_device": ["NO CONTROLS", "TRAFFIC SIGNAL", "STOP SIGN"],
        "trafficway_type": ["NOT DIVIDED", "DIVIDED", "FOUR WAY"],
        "interseccion": [False, True, True],
        "damage": ["OVER $1,500", "$501 - $1,500", "OVER $1,500"],
    }
    return pd.DataFrame(data)


def test_payload_contiene_las_cinco_vistas_obligatorias(sample_clean_df):
    payload = generate_dashboard_payload(sample_clean_df)
    assert "resumen" in payload
    assert "cuando" in payload
    assert "condiciones" in payload
    assert "por_que" in payload
    assert "severidad" in payload


def test_kpis_resumen_calculan_tasas_correctamente(sample_clean_df):
    payload = generate_dashboard_payload(sample_clean_df)
    resumen = payload["resumen"]
    assert resumen["total_siniestros"] == 3
    assert resumen["total_lesionados"] == 3
    assert resumen["total_fatales"] == 1
    assert resumen["solo_danos"] == 1
    assert resumen["con_heridos"] == 1


def test_heatmap_cubre_los_siete_dias_y_veinticuatro_horas(sample_clean_df):
    payload = generate_dashboard_payload(sample_clean_df)
    heatmap = payload["cuando"]["heatmap"]
    assert len(heatmap) == 7
    for fila in heatmap:
        assert len(fila["horas"]) == 24
