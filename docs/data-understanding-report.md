# Data Understanding Report — Traffic Accidents

Diagnóstico del dataset previo al dashboard, según el punto 17 de la consigna.
Generado por `backend/prepare_dataset.py`; los números provienen del archivo de origen.

## 1. Carga y trazabilidad

- Origen: `traffic_accidents.csv` (51081134 bytes).
- SHA-256: `9493c45d63c21ad259268021b678ef75542087ed6957ef52c8734252cbbde238`
- Archivo limpio generado: `data/clean/traffic_accidents_clean.csv`.

## 2. Cantidad de filas y columnas

- Filas: **209306**
- Columnas: **24** originales, **34** en el archivo limpio (10 derivadas).
- Rango temporal: 2013-03-03 16:48:00 a 2025-01-18 00:17:00 (11.88 años).

## 3. Tipos de datos

| Tipo | Cantidad | Variables |
| --- | --- | --- |
| string | 14 | `crash_date`, `traffic_control_device`, `weather_condition`, `lighting_condition`, `first_crash_type`, `trafficway_type`, `alignment`, `roadway_surface_cond`, `road_defect`, `crash_type`, `intersection_related_i`, `damage`, `prim_contributory_cause`, `most_severe_injury` |
| int64 | 4 | `num_units`, `crash_hour`, `crash_day_of_week`, `crash_month` |
| float64 | 6 | `injuries_total`, `injuries_fatal`, `injuries_incapacitating`, `injuries_non_incapacitating`, `injuries_reported_not_evident`, `injuries_no_indication` |

## 4. Valores faltantes

- Celdas faltantes totales: **0**.
- El dato faltante está codificado como categoría, no como nulo: 
  - `traffic_control_device` → UNKNOWN: 4455, OTHER: 670
  - `weather_condition` → UNKNOWN: 6534, OTHER: 627
  - `lighting_condition` → UNKNOWN: 4336
  - `trafficway_type` → UNKNOWN: 1060, UNKNOWN INTERSECTION TYPE: 1885, OTHER: 4757
  - `roadway_surface_cond` → UNKNOWN: 12509, OTHER: 438
  - `road_defect` → UNKNOWN: 34426, OTHER: 912
  - `prim_contributory_cause` → NOT APPLICABLE: 5241, UNABLE TO DETERMINE: 58316

## 5. Cardinalidad de variables categóricas

| Variable | Valores únicos |
| --- | --- |
| `crash_date` | 189087 |
| `traffic_control_device` | 19 |
| `weather_condition` | 12 |
| `lighting_condition` | 6 |
| `first_crash_type` | 18 |
| `trafficway_type` | 20 |
| `alignment` | 6 |
| `roadway_surface_cond` | 7 |
| `road_defect` | 7 |
| `crash_type` | 2 |
| `intersection_related_i` | 2 |
| `damage` | 3 |
| `prim_contributory_cause` | 40 |
| `most_severe_injury` | 5 |

## 6. Valores atípicos

- `num_units`: Q1=2.0, Q3=2.0, límite IQR=2.0, casos por encima=14817 (p99=4.0).
- `injuries_total`: Q1=0.0, Q3=1.0, límite IQR=2.5, casos por encima=5692 (p99=4.0).
- Fuera de rango lógico: hora 0, día 0, mes 0, lesiones negativas 0.
- Los valores altos de `num_units` y de lesionados se conservan: son hechos reales, no errores de carga.

## 7. Distribución de lesiones

| Métrica | Valor |
| --- | --- |
| Total de `injuries_total` | 80105 |
| Total de `injuries_fatal` | 389 |
| Total de `injuries_incapacitating` | 7975 |
| Total de `injuries_non_incapacitating` | 46307 |
| Total de `injuries_reported_not_evident` | 25434 |
| Total de `injuries_no_indication` | 469683 |
| Hechos con lesionados | 54517 |
| Hechos sin lesionados | 154789 |

Se verifica que `injuries_total` equivale a la suma de fallecidos, incapacitantes, no incapacitantes y reportados sin evidencia en **209306** filas, con **0** excepciones. `injuries_no_indication` queda fuera de esa suma.

## 8. Distribución de severidad

| Severidad | Hechos | % |
| --- | --- | --- |
| Solo Daños | 154767 | 73.954 |
| Con Heridos | 54157 | 25.878 |
| Fatal | 351 | 0.168 |

La severidad se deriva de las columnas de lesiones (regla R7), no de `crash_type`.

## 9. Principales causas contributivas

| Causa | Hechos |
| --- | --- |
| UNABLE TO DETERMINE | 58310 |
| FAILING TO YIELD RIGHT-OF-WAY | 42909 |
| FOLLOWING TOO CLOSELY | 19074 |
| DISREGARDING TRAFFIC SIGNALS | 14590 |
| IMPROPER TURNING/NO SIGNAL | 12642 |
| FAILING TO REDUCE SPEED TO AVOID CRASH | 10675 |
| IMPROPER OVERTAKING/PASSING | 8302 |
| DISREGARDING STOP SIGN | 6746 |
| IMPROPER LANE USAGE | 6460 |
| NOT APPLICABLE | 5241 |

## 10. Problemas de calidad detectados

- 31 filas duplicadas exactas (resueltas en R1).
- 154789 hechos (73.953%) son solo daño material: la severidad está muy desbalanceada.
- No hay valores nulos, pero el dato faltante está codificado como categoría (UNKNOWN, OTHER, NOT APPLICABLE, UNABLE TO DETERMINE); no se eliminan, se documentan.
- 58316 hechos sin causa determinable: el ranking de causas debe leerse sobre el total, no como causa real.
- crash_type clasifica por lesión o acarreo, no por gravedad: incluye casos con acarreo y sin lesionados. La severidad del análisis se deriva de las columnas de lesiones, no de crash_type.
- El dataset no tiene coordenadas geográficas: el análisis espacial debe hacerse con tipo de vía, dispositivo de control e intersección.
- No hay información de exposición (volumen de tránsito): una frecuencia alta no implica por sí sola mayor riesgo.

## Decisiones para el dashboard

- Se conservan las 24 columnas originales y se agregan las derivadas, para no perder trazabilidad.
- `severidad` reemplaza a `crash_type` como medida de gravedad.
- Las agrupaciones (`clima_grupo`, `iluminacion_grupo`, `calzada_grupo`) son las que se usan en las vistas, para que ningún gráfico dependa de categorías con uno o dos casos.
- El eje espacial se resuelve con `trafficway_type`, `traffic_control_device` e `interseccion`: no hay coordenadas en el dataset.
- Las variables de lesiones desagregadas (`injuries_incapacitating`, `injuries_non_incapacitating`, `injuries_reported_not_evident`, `injuries_no_indication`) se incluyen en la vista de severidad, hasta ahora ausente del dashboard.

## Limitaciones

- El dataset no representa a la Municipalidad de Costa Serena: es una simulación educativa.
- No permite demostrar causalidad; solo asociaciones.
- Sin volumen de tránsito no puede calcularse riesgo relativo, solo frecuencia.
- La clasificación de causas es subjetiva (la asigna el oficial de turno).
- Los valores desconocidos pueden sesgar comparaciones si se concentran en una condición.
