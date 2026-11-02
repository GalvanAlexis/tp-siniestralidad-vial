# TP — Exploración de datos de siniestralidad vial

Trabajo práctico de exploración de datos sobre el dataset `traffic_accidents` (209.306 hechos,
2013-2025). El proyecto produce un dataset limpio y documentado, un flujo reproducible en Orange y un
tablero con los indicadores.

## Requisitos

- Python 3.12 (el entorno virtual del proyecto ya está en `backend/venv`).
- Orange 3.40 o superior para abrir el workflow.

## Cómo regenerar el dataset y la documentación

Un solo comando reconstruye el archivo limpio, el reporte de calidad, el diccionario de datos y el
informe de entendimiento de datos:

```powershell
backend\venv\Scripts\python.exe backend\prepare_dataset.py
```

Salidas:

| Archivo | Contenido |
| --- | --- |
| `data/clean/traffic_accidents_clean.csv` | Dataset limpio: 34 columnas (24 originales + 10 derivadas). |
| `data/clean/quality_report.json` | Reporte de calidad y trazabilidad con el SHA-256 del origen. |
| `docs/diccionario-de-datos.md` | Diccionario de variables y reglas de transformación aplicadas. |
| `docs/data-understanding-report.md` | Diagnóstico del dataset en los diez puntos de la consigna. |

El script acepta `--csv`, `--out-dir` y `--docs-dir` si se trabaja sobre otra copia del origen. No
modifica el CSV de entrada.

## Cómo ver el flujo en Orange

```powershell
orange-canvas siniestralidad_vial.ows
```

El workflow lee `data/clean/traffic_accidents_clean.csv` con una ruta relativa a su propia carpeta, así
que no hay rutas absolutas de máquina. Los detalles de cada etapa, los siete cruces y la configuración
del modelado están en [`docs/workflow-orange.md`](docs/workflow-orange.md).

## Estructura

```
backend/
  prepare_dataset.py        pipeline de limpieza, reporte y documentación
  tests/                    pruebas de las reglas de limpieza
data/clean/                 dataset limpio y reporte de calidad (generados)
docs/                       diccionario, informe de datos y guía del workflow
odd/tasks/                  documento de trabajo de los entregables
siniestralidad_vial.ows     flujo de Orange (entregable 2)
```

## Datos de origen

`traffic_accidents.csv` no se versiona (está excluido en `.gitignore`) por su tamaño. El dataset limpio
se obtiene a partir de él con el comando de regeneración. Si el archivo de origen no está en la raíz del
proyecto, hay que indicarlo con `--csv`.

## Pruebas

```powershell
backend\venv\Scripts\python.exe -m pytest backend/tests -q
```
