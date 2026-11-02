# Diccionario de datos — Siniestralidad vial

Documento generado automáticamente por `backend/prepare_dataset.py`. No editar a mano: se regenera junto con el dataset.

## Trazabilidad

- Archivo de origen: `traffic_accidents.csv`
- SHA-256 del origen: `9493c45d63c21ad259268021b678ef75542087ed6957ef52c8734252cbbde238`
- Filas y columnas del origen: 209306 × 24
- Archivo limpio: `data/clean/traffic_accidents_clean.csv`
- Filas y columnas del archivo limpio: 209275 × 34
- Generado: 2026-11-02T15:31:50Z con Python 3.14.2 y pandas 3.0.6

Cada fila del archivo limpio conserva las 24 columnas originales sin reescribir, por lo que cualquier valor puede contrastarse contra el CSV de Kaggle.

## Reglas de transformación aplicadas

| ID | Regla | Columnas | Filas afectadas |
| --- | --- | --- | --- |
| R1 | Se eliminan filas duplicadas exactas (mismo valor en las 24 columnas). | `todas` | 31 |
| R2 | Se recortan espacios en blanco al inicio y al final de cada valor de texto. | `crash_date`, `traffic_control_device`, `weather_condition`, `lighting_condition`, `first_crash_type`, `trafficway_type`, ... | 0 |
| R3 | crash_date se parsea con formato MM/DD/AAAA HH:MM:SS AM/PM y se guarda como fecha ISO. | `crash_date`, `fecha` | 209275 |
| R4 | Se deriva anio desde fecha. | `fecha`, `anio` | 209275 |
| R5 | Se deriva dia_semana desde crash_day_of_week con la codificación 1 = domingo ... 7 = sábado. | `crash_day_of_week`, `dia_semana` | 209275 |
| R6 | Se deriva mes_nombre desde crash_month. | `crash_month`, `mes_nombre` | 209275 |
| R7 | Se deriva severidad: Fatal si injuries_fatal > 0; Con Heridos si injuries_total > 0; en otro caso Solo Daños. | `injuries_fatal`, `injuries_total`, `severidad` | 209275 |
| R8 | lesionados replica injuries_total como entero. | `injuries_total`, `lesionados` | 209275 |
| R9 | Se agrupa weather_condition en clima_grupo (12 categorías originales). | `weather_condition`, `clima_grupo` | 209275 |
| R10 | Se agrupa lighting_condition en iluminacion_grupo (6 categorías originales). | `lighting_condition`, `iluminacion_grupo` | 209275 |
| R11 | Se agrupa roadway_surface_cond en calzada_grupo (7 categorías originales). | `roadway_surface_cond`, `calzada_grupo` | 209275 |
| R12 | Se traduce intersection_related_i (Y/N) a interseccion (1/0). | `intersection_related_i`, `interseccion` | 209275 |

Justificación de cada regla:

- **R1** — Un registro repetido infla los conteos sin aportar información nueva.
- **R2** — Evita categorías duplicadas por espacios invisibles.
- **R3** — Permite ordenar y agrupar en el tiempo. Valores no parseables: 0.
- **R4** — Facilita la serie anual sin volver a parsear la fecha.
- **R5** — La codificación se verificó contra la fecha completa: 0 discrepancias.
- **R6** — Las etiquetas legibles evitan errores de lectura en gráficos.
- **R7** — Fatal tiene prioridad para no diluir los hechos más graves.
- **R8** — Evita decimales espurios en el conteo de personas.
- **R9** — Concentra las categorías con muy pocos casos para que las comparaciones sean legibles.
- **R10** — Permite comparar día contra noche con y sin iluminación.
- **R11** — Nieve y hielo comparten condición invernal; el resto queda separado.
- **R12** — Es la variable que permite responder dónde priorizar sin coordenadas geográficas.

## Variables

| Variable | Tipo | Origen | Descripción | Faltantes % | Categorías / valores únicos | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| `crash_date` | string | original | Fecha y hora del siniestro registrada en el acta policial (MM/DD/AAAA HH:MM:SS AM/PM). | 0.0 | 189087 | trazabilidad |
| `traffic_control_device` | string | original | Dispositivo de control de tránsito presente en el lugar (semáforo, PARE, sin control). | 0.0 | 19 | dashboard |
| `weather_condition` | string | original | Condición climática al momento del hecho. | 0.0 | 12 | dashboard |
| `lighting_condition` | string | original | Condición de iluminación al momento del hecho. | 0.0 | 6 | dashboard |
| `first_crash_type` | string | original | Tipo de choque registrado primero en el acta (alcance, ángulo, giro, peatón). | 0.0 | 18 | dashboard |
| `trafficway_type` | string | original | Tipo de vía donde ocurrió (calle no dividida, cruce de 4 vías, mano única, rotonda). | 0.0 | 20 | dashboard |
| `alignment` | string | original | Alineación y pendiente de la calzada (recta, curva, nivel, pendiente). | 0.0 | 6 | dashboard |
| `roadway_surface_cond` | string | original | Estado de la superficie de la calzada (seca, mojada, helada, con nieve). | 0.0 | 7 | dashboard |
| `road_defect` | string | original | Defecto de la vía detectado (sin defectos, superficie desgastada, baches, escombros). | 0.0 | 7 | dashboard |
| `crash_type` | string | original | Clasificación administrativa del hecho: solo daño con retiro propio o lesión/acarreo. | 0.0 | 2 | dashboard |
| `intersection_related_i` | string | original | Indica si el hecho está relacionado con una intersección (Y/N). | 0.0 | 2 | dashboard |
| `damage` | string | original | Magnitud del daño material declarada en tramos de monto. | 0.0 | 3 | dashboard |
| `prim_contributory_cause` | string | original | Causa contributiva principal atribuida por el oficial de turno. | 0.0 | 40 | dashboard |
| `num_units` | int64 | original | Cantidad de unidades (vehículos y/o peatones) involucradas en el hecho. | 0.0 | 11 | dashboard |
| `most_severe_injury` | string | original | Lesión más grave registrada en el hecho. | 0.0 | 5 | dashboard |
| `injuries_total` | float64 | original | Total de personas lesionadas en el hecho. | 0.0 | 19 | dashboard |
| `injuries_fatal` | float64 | original | Personas fallecidas en el hecho. | 0.0 | 4 | dashboard |
| `injuries_incapacitating` | float64 | original | Lesionados con incapacidad. | 0.0 | 8 | dashboard |
| `injuries_non_incapacitating` | float64 | original | Lesionados sin incapacidad. | 0.0 | 19 | dashboard |
| `injuries_reported_not_evident` | float64 | original | Lesionados reportados sin evidencia visible en el lugar. | 0.0 | 13 | dashboard |
| `injuries_no_indication` | float64 | original | Personas involucradas sin indicio de lesión. NO integra injuries_total. | 0.0 | 39 | calidad |
| `crash_hour` | int64 | original | Hora del siniestro en formato 0-23. | 0.0 | 24 | dashboard |
| `crash_day_of_week` | int64 | original | Día de la semana del siniestro con codificación 1 = domingo ... 7 = sábado. | 0.0 | 7 | dashboard |
| `crash_month` | int64 | original | Mes del siniestro en formato 1-12. | 0.0 | 12 | dashboard |
| `fecha` | str | derivada | Derivada de crash_date en formato ISO (AAAA-MM-DD HH:MM:SS). | 0.0 | 189087 | modelo |
| `anio` | Int64 | derivada | Derivada de fecha: año del siniestro. | 0.0 | 12 | modelo |
| `dia_semana` | string | derivada | Derivada de crash_day_of_week: nombre del día en español. | 0.0 | 7 | dashboard |
| `mes_nombre` | string | derivada | Derivada de crash_month: nombre del mes en español. | 0.0 | 12 | dashboard |
| `severidad` | string | derivada | Derivada de las lesiones: Fatal (injuries_fatal > 0), Con Heridos (injuries_total > 0) o Solo Daños. | 0.0 | 3 | dashboard |
| `lesionados` | Int64 | derivada | Derivada de injuries_total con tipo entero. | 0.0 | 19 | dashboard |
| `iluminacion_grupo` | string | derivada | Agrupación de lighting_condition en Día, Noche con iluminación, Noche sin iluminación, Transición o Desconocida. | 0.0 | 5 | dashboard |
| `clima_grupo` | string | derivada | Agrupación de weather_condition en Despejado, Nublado, Precipitación, Neblina o humo, Viento o partículas, Otro o Desconocido. | 0.0 | 7 | dashboard |
| `calzada_grupo` | string | derivada | Agrupación de roadway_surface_cond en Seca, Mojada, Invernal, Suelta, Otra o Desconocida. | 0.0 | 6 | dashboard |
| `interseccion` | Int64 | derivada | Derivada de intersection_related_i: 1 si el hecho está asociado a una intersección, 0 si no. | 0.0 | 2 | dashboard |

## Advertencias de interpretación

- `injuries_no_indication` cuenta personas sin indicio de lesión y **no** suma a `injuries_total`. La igualdad verificada es `injuries_total = fatal + incapacitantes + no incapacitantes + reportados sin evidencia`.
- `crash_type` es una clasificación administrativa (lesión o acarreo), no una medida de gravedad.
- `UNKNOWN`, `OTHER`, `NOT APPLICABLE` y `UNABLE TO DETERMINE` son valores observados, no nulos: se conservan y se reportan como desconocidos en las agrupaciones.
- No hay coordenadas geográficas en el dataset: el eje espacial se resuelve con `trafficway_type`, `traffic_control_device` e `interseccion`.

## Regeneración

```powershell
backend\venv\Scripts\python.exe backend\prepare_dataset.py
```

El comando reescribe el dataset limpio, este diccionario y el informe de entendimiento de datos. Acepta `--csv`, `--out-dir` y `--docs-dir` para trabajar sobre otra copia del origen.
