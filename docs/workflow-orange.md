# Flujo reproducible en Orange

Este documento describe el entregable 2: el archivo `siniestralidad_vial.ows`, qué hace cada etapa,
qué variables usa cada cruce y cómo se regenera todo cuando se incorpora información nueva.

## Requisitos

- Orange 3.40 o superior (el flujo se generó y verificó con Orange 3.40.0).
- El dataset limpio en `data/clean/traffic_accidents_clean.csv`, generado por `backend/prepare_dataset.py`.

## Cómo abrirlo

```powershell
orange-canvas siniestralidad_vial.ows
```

También se puede abrir con doble clic desde el explorador de archivos.

El nodo de importación apunta a `${basedir}/data/clean/traffic_accidents_clean.csv`, es decir, a una
ruta **relativa a la carpeta del workflow**. No hay ninguna ruta absoluta de máquina en el archivo:
si el proyecto se copia a otra carpeta u otra computadora, el flujo sigue funcionando.

## Etapas

El lienzo tiene cinco etapas rotuladas con anotaciones, en el mismo orden que pide la consigna.

| Etapa | Nodos | Qué hace |
| --- | --- | --- |
| 1 · Importación | `1 · Importar dataset limpio` | Lee el CSV limpio con la ruta relativa al workflow y tipos de columna declarados. |
| 2 · Limpieza | `2 · Limpiar faltantes` | Imputación explícita. El dataset no tiene valores nulos, así que no modifica filas; queda como salvaguarda para datos nuevos incompletos. |
| 3 · Exploración | `Ver tabla limpia`, `Estadísticas por columna`, `Distribución de severidad`, `Lesionados por severidad` | Tabla, tipos y estadísticas por columna, distribución de la severidad y diagrama de caja de lesionados por severidad. |
| 4 · Análisis | Los siete nodos `Cruce: ...` | Tablas pivote con los cruces exigidos por la consigna. |
| 5 · Modelado | `5 · Variables predictoras y clase`, `Muestra reproducible (20.000)`, `Árbol de decisión`, `Random Forest`, `Regresión logística`, `Evaluación de modelos (5-fold)`, `Clústeres (k-Means, k=3)` | Selección de variables, muestra reproducible, tres clasificadores supervisados evaluados con validación cruzada y agrupamiento no supervisado. |

Todas las etapas de exploración, análisis y modelado consumen la salida de la etapa de limpieza, de modo
que cualquier cambio en la limpieza se propaga a todo el flujo.

## Los siete cruces

Los nodos de la etapa 4 están configurados con las variables que pide la consigna. La agregación por
defecto es `Count` (cantidad de hechos); en los cruces contra `injuries_total` se agrega también `Sum`
para totalizar lesionados.

| Nodo | Filas | Columnas | Valores | Agregación |
| --- | --- | --- | --- | --- |
| Cruce: clima × lesión | `weather_condition` | `most_severe_injury` | — | Count |
| Cruce: iluminación × daño | `lighting_condition` | `damage` | — | Count |
| Cruce: hora × lesionados | `crash_hour` | — | `injuries_total` | Count, Sum |
| Cruce: día × lesionados | `crash_day_of_week` | — | `injuries_total` | Count, Sum |
| Cruce: causa × lesión | `prim_contributory_cause` | `most_severe_injury` | — | Count |
| Cruce: tipo de vía × tipo de choque | `trafficway_type` | `crash_type` | — | Count |
| Cruce: calzada × lesión | `roadway_surface_cond` | `most_severe_injury` | — | Count |

`crash_day_of_week` usa la codificación del dataset original: 1 = domingo ... 7 = sábado. El nombre del
día está disponible como `dia_semana` en el dataset limpio si se prefiere la etiqueta legible.

## Etapa 6: modelado

### Variables

El nodo `5 · Variables predictoras y clase` define la clase y las predictoras que usan todos los modelos.

- **Clase a predecir:** `severidad` (Solo Daños, Con Heridos, Fatal).
- **Predictoras (14):** `traffic_control_device`, `weather_condition`, `lighting_condition`,
  `first_crash_type`, `trafficway_type`, `alignment`, `roadway_surface_cond`, `road_defect`,
  `prim_contributory_cause`, `num_units`, `crash_hour`, `crash_day_of_week`, `crash_month`,
  `interseccion`.

Quedan fuera del modelo, a propósito:

- **Todas las columnas de lesiones** (`injuries_*`, `lesionados`, `most_severe_injury`): `severidad` se
  deriva de ellas, así que usarlas sería predecir la respuesta con la respuesta.
- **`crash_type`:** clasificación administrativa que mezcla lesionados con acarreo.
- **`damage`:** se registra después del hecho y está fuertemente asociado a la gravedad; incluirlo
  inflaría el resultado sin aportar capacidad predictiva previa al siniestro.
- **`crash_date`, `fecha`, `anio`, `dia_semana`, `mes_nombre`:** identificadores o duplicados de
  variables que ya están representadas (hora, día y mes numéricos).
- **`intersection_related_i`, `iluminacion_grupo`, `clima_grupo`, `calzada_grupo`:** duplicados de
  `interseccion`, `lighting_condition`, `weather_condition` y `roadway_surface_cond`.

### Muestra reproducible

`Muestra reproducible (20.000)` toma 20.000 casos con tamaño fijo, estratificados por `severidad` y con
semilla fija (42). La muestra existe para que el flujo se pueda ejecutar completo en el aula: entrenar y
evaluar sobre 209.000 filas multiplica por diez el tiempo sin cambiar las conclusiones del ejercicio.
Todo el análisis exploratorio y los cruces siguen usando el dataset completo.

La estratificación conserva la proporción de casos fatales, que son el 0,17 % del total. Aun así, con
20.000 filas la clase Fatal queda con muy pocos casos: cualquier métrica sobre esa clase es inestable y
debe leerse como indicio, no como estimación precisa.

### Modelos y evaluación

| Nodo | Configuración | Por qué |
| --- | --- | --- |
| Árbol de decisión | Profundidad máxima 8 | Interpretable; la profundidad acotada evita árboles ilegibles. |
| Random Forest | 100 árboles, profundidad máxima 12 | Reduce la varianza del árbol único manteniendo un tiempo de ejecución razonable. |
| Regresión logística | Configuración por defecto (regularización L2) | Referencia lineal para comparar contra los modelos de árbol. |
| Evaluación de modelos | Validación cruzada de 5 pliegues, estratificada | Cada modelo se entrena y evalúa cinco veces; el promedio es más estable que una única partición. |
| Clústeres (k-Means) | k = 3, datos normalizados | Busca tres grupos de hechos con perfiles parecidos, sin usar la clase. |

`Test & Score` muestra exactamente las tres métricas que necesita el informe: AUC, clasificación
correcta (CA), F1, precisión y recall por clase. El modelo es una herramienta analítica: muestra
asociaciones entre condiciones del hecho y severidad, no relaciones causales.

## Regeneración

Un solo comando reconstruye el dataset limpio, el reporte de calidad y la documentación:

```powershell
backend\venv\Scripts\python.exe backend\prepare_dataset.py
```

Después de eso, el workflow no necesita cambios: al abrirlo vuelve a leer
`data/clean/traffic_accidents_clean.csv` y recalcula todo al ejecutarse. Si la nueva información agrega
o quita columnas, hay que revisar dos nodos:

1. `1 · Importar dataset limpio`: los tipos de columna declarados por posición (texto, categórica o
   numérica) tienen que seguir coincidiendo con el orden del CSV.
2. `5 · Variables predictoras y clase`: si aparece una variable nueva, decidir si es predictora, si se
   excluye o si reemplaza a una existente.

## Verificación realizada

El flujo se ejecutó de punta a punta con el motor de Orange en modo headless
(`python -m Orange.canvas.run siniestralidad_vial.ows`). Esa ejecución es la prueba de que:

- el archivo se carga sin errores de formato;
- la ruta relativa del CSV se resuelve correctamente;
- los siete cruces se calculan;
- los tres modelos se entrenan y se evalúan con validación cruzada;
- el agrupamiento se calcula.

Los resultados numéricos de esa corrida se informan en el análisis (entregable 3), no en este documento,
porque dependen de la muestra y pueden cambiar si se regenera el dataset.
