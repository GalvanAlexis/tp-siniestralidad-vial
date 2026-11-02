# Entregables 1 y 2 — Dataset preparado y workflow de Orange

Objetivo: cerrar los entregables 1 (dataset limpio y documentado) y 2 (flujo reproducible de Orange) del TP de
siniestralidad vial, con trazabilidad al CSV original y sin rutas absolutas de máquina.
Rama: `feature/ISS-007_dataset_y_workflow` (issue #7). Runner de tests: `pytest` sobre `backend/venv`.

## Specs

- **S1** — Entregable 1: "Archivo limpio y documentado."
- **S2** — Trazabilidad: "Los datos deben ser trazables al dataset original. Las transformaciones deben estar documentadas."
- **S3** — Data Understanding Report (punto 17 de la consigna), con estos pasos: "1. Cargar el CSV. 2. Verificar cantidad de filas y columnas. 3. Revisar tipos de datos. 4. Medir valores faltantes. 5. Revisar cardinalidad de variables categóricas. 6. Detectar valores atípicos. 7. Revisar distribución de lesiones. 8. Revisar distribución de severidad. 9. Analizar las principales causas. 10. Documentar cualquier problema de calidad."
- **S4** — Entregable 2: "Flujo reproducible con las etapas: Importación → Limpieza → Exploración → Análisis → Modelado."
- **S5** — Etapa 5, cruces exigidos: "weather_condition × most_severe_injury / lighting_condition × damage / crash_hour × injuries_total / crash_day_of_week × injuries_total / prim_contributory_cause × most_severe_injury / trafficway_type × crash_type / roadway_surface_cond × most_severe_injury".
- **S6** — Etapa 6: "Explorar, cuando corresponda: Clustering, Árboles de decisión, Random Forest, Logistic Regression" y "El modelo deberá utilizarse como herramienta analítica, no como prueba automática de causalidad."
- **S7** — Reproducibilidad: el `.ows` no puede depender de rutas absolutas de una máquina. Hoy apunta a `C:/Users/PC Blado/.../traffic_accidents.csv`.
- **S8** — "Los indicadores deben poder actualizarse si se incorpora nueva información." El procedimiento de regeneración debe estar documentado y ser de un solo comando.

## Tasks

| ID | Spec | Ruta | Estado | Commit / evidencia |
| --- | --- | --- | --- | --- |
| T1 | S1, S2, S8 | inline | completada | `backend/prepare_dataset.py`, `backend/tests/`, `data/clean/` |
| T2 | S3 | inline | completada | `docs/data-understanding-report.md`, `docs/diccionario-de-datos.md` |
| T3 | S4, S5 | inline | completada | `siniestralidad_vial.ows` (etapas 1-4, 7 cruces en tablas pivote) |
| T4 | S4, S6 | inline | completada | `siniestralidad_vial.ows` (etapa 5: Tree, RF, Logistic Regression, k-Means) |
| T5 | S7 | inline | completada | `siniestralidad_vial.ows` (rutas relativas `${basedir}` sin rutas absolutas) |
| T6 | S8 | inline | completada | `README.md`, `docs/workflow-orange.md` |

## Log

### L1 — Pedido del usuario (verbatim)

> hagamos entonces desde el principio y bien hecho. completemos los entregables 1 y 2

### L2 — Evidencia previa relevada (2026-11-02)

- CSV: 209.306 filas × 24 columnas, sin valores nulos, 31 duplicados exactos, fechas 2013-03-03 a 2025-01-18.
- `crash_day_of_week` usa 1=Domingo (0 discrepancias contra `crash_date`); `crash_hour` y `crash_month` coinciden 100% con la fecha.
- `injuries_total` = fatal + incapacitantes + no incapacitantes + reportados sin evidencia al 100%; `injuries_no_indication` NO forma parte del total (es cantidad de personas sin indicio de lesión).
- `crash_type` mezcla lesionados con acarreo: 37.418 casos "INJURY AND/OR TOW" sin lesionados.
- Sentinas de dato faltante codificadas como categoría: `UNKNOWN`, `OTHER`, `NOT APPLICABLE`, `UNABLE TO DETERMINE`.
- El `.ows` actual hardcodea la ruta absoluta del CSV y no tiene etapa de modelado conectada.
- Orange 3.40.0 está instalado en la máquina (`C:\Program Files\Orange\python.exe`) y expone un runner headless (`Orange.canvas.run`), así que el flujo se puede verificar de verdad.
