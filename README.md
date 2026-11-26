# Observatorio de Seguridad Vial — Municipalidad de Costa Serena

> **Trabajo Práctico de Exploración de Datos — Grupo 1**  
> **Simulación de Negocio:** Dirección de Tránsito y Transporte / Subsecretaría de Seguridad Vial (Ing. Marina Solá).  
> **Tablero en Producción:** [https://observatorio-vial-grupo1.vercel.app](https://observatorio-vial-grupo1.vercel.app)

---

## 1. Contexto del Proyecto

La Municipalidad de Costa Serena (ciudad intermedia de aproximadamente 180.000 habitantes) enfrenta un incremento en los siniestros viales con víctimas humanas. El Concejo Deliberante exige justificaciones técnicas objetivas para aprobar presupuestos de semaforización, reductores de velocidad, mejoramiento de calzada y operativos de fiscalización, superando la asignación reactiva basada en reclamos vecinales o impacto mediático.

Este proyecto transforma un registro histórico de **209.306 hechos viales (2013–2025)** en evidencia empírica accionable mediante:
1. **Un pipeline de datos limpio, normalizado y documentado** con trazabilidad estricta.
2. **Un flujo reproducible en Orange Data Mining** con 5 etapas analíticas y modelos de aprendizaje supervisado y no supervisado.
3. **Un dashboard interactivo web Mobile-First (9:16)** desplegado públicamente con las 5 vistas obligatorias de la consigna.
4. **Un informe ejecutivo de insights y presentación defensora** ante el cuerpo legislativo comunal.

---

## 2. Estado de los Entregables de la Cátedra

| Entregable | Estado | Descripción y Alcance | Artefactos Principales |
| :--- | :---: | :--- | :--- |
| **Entregable 1 — Dataset preparado y documentado** | **COMPLETO** | Limpieza de 209.306 filas, 0 celdas nulas, descarte de 31 duplicados exactos y derivación de 10 columnas normalizadas. Trazabilidad con hash SHA-256. | [`data/clean/traffic_accidents_clean.csv`](data/clean/traffic_accidents_clean.csv)<br>[`data/clean/quality_report.json`](data/clean/quality_report.json)<br>[`docs/data-understanding-report.md`](docs/data-understanding-report.md)<br>[`docs/diccionario-de-datos.md`](docs/diccionario-de-datos.md) |
| **Entregable 2 — Workflow reproducible en Orange** | **COMPLETO** | Flujo `.ows` sin rutas absolutas de máquina (`${basedir}`), con 5 etapas: Importación → Limpieza → Exploración → 7 Cruces en tablas pivote → Modelado (Árbol, Random Forest, Regresión Logística y k-Means, 5-fold CV). | [`siniestralidad_vial.ows`](siniestralidad_vial.ows)<br>[`docs/workflow-orange.md`](docs/workflow-orange.md) |
| **Entregable 2 (Web) — Dashboard Interactivo** | **COMPLETO** | Tablero web en Next.js 16 + React 19 + Recharts estructurado en las **5 vistas requeridas** (*Resumen*, *Cuándo*, *Condiciones*, *Por Qué*, *Severidad*), **Heatmap táctil 7×24** y diseño vertical **Mobile-First 9:16** con **Bottom Navbar fijo**. Desplegado en Vercel. | [`frontend/src/app/page.tsx`](frontend/src/app/page.tsx)<br>[`backend/build_dashboard_data.py`](backend/build_dashboard_data.py)<br>[URL en Vercel](https://observatorio-vial-grupo1.vercel.app) |
| **Entregable 3 — Informe de Insights y Presentación** | **COMPLETO** | Informe final estructurado bajo metodología CRISP-DM (Plan de Proyecto, 5 secciones requeridas: recolección, preparación, teoría de modelos, evaluación y sugerencias futuras) y guion de presentación de 10 min ante el Concejo Deliberante. | [`docs/informe-final-crisp-dm.md`](docs/informe-final-crisp-dm.md) |

---

## 3. Listado Detallado de Tareas

### Entregable 1: Preparación y Entendimiento de Datos (Cerrado · Issue #7)
- [x] **Carga y trazabilidad:** Script [`backend/prepare_dataset.py`](backend/prepare_dataset.py) que lee el CSV crudo sin modificarlo y calcula el hash criptográfico SHA-256 del origen.
- [x] **Tratamiento de duplicados:** Identificación y remoción de 31 filas duplicadas exactas (209.275 registros únicos finales).
- [x] **Normalización de sentinas:** Reagrupamiento de categorías de datos faltantes codificados como texto (`UNKNOWN`, `OTHER`, `NOT APPLICABLE`, `UNABLE TO DETERMINE`).
- [x] **Variables derivadas:** Generación de 10 columnas (`fecha`, `anio`, `dia_semana`, `mes_nombre`, `severidad`, `lesionados`, `interseccion`, `iluminacion_grupo`, `clima_grupo`, `calzada_grupo`).
- [x] **Data Understanding Report:** Documento [`docs/data-understanding-report.md`](docs/data-understanding-report.md) respondiendo exhaustivamente a los 10 puntos de la consigna.
- [x] **Diccionario de datos:** Documento [`docs/diccionario-de-datos.md`](docs/diccionario-de-datos.md) con tipos, dominios y reglas de transformación.
- [x] **Pruebas unitarias:** 12 tests en [`backend/tests/test_prepare_dataset.py`](backend/tests/test_prepare_dataset.py) verificando idempotencia, conservación de esquema y lógica de negocio.

### Entregable 2: Flujo Analítico en Orange (Cerrado · Issue #6)
- [x] **Desacoplamiento de rutas:** Rutas relativas al espacio de trabajo `${basedir}/data/clean/traffic_accidents_clean.csv`.
- [x] **Etapas 1 a 3 (Ingesta, Limpieza, Exploración):** Nodos de visualización, estadísticas descriptivas y diagramas de caja para severidad y lesionados.
- [x] **Etapa 4 (7 Cruces Obligatorios):** Tablas pivote configuradas según especificación:
  1. `weather_condition × most_severe_injury`
  2. `lighting_condition × damage`
  3. `crash_hour × injuries_total`
  4. `crash_day_of_week × injuries_total`
  5. `prim_contributory_cause × most_severe_injury`
  6. `trafficway_type × crash_type`
  7. `roadway_surface_cond × most_severe_injury`
- [x] **Etapa 5 (Modelado y Segmentación):**
  - Muestra estratificada balanceada de 20.000 casos (semilla 42) para ejecución ágil y reproducible.
  - Modelos supervisados: Árbol de decisión, Random Forest y Regresión Logística evaluados con validación cruzada estratificada de 5 pliegues (*5-fold CV*).
  - Modelo no supervisado: Agrupamiento k-Means ($k=3$) con datos normalizados para detección de perfiles de riesgo.
- [x] **Documentación del flujo:** Guía completa paso a paso en [`docs/workflow-orange.md`](docs/workflow-orange.md).

### Entregable 2 (Complementario): Dashboard Interactivo Web (Cerrado · Issue #8)
- [x] **Arquitectura y Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 y Recharts.
- [x] **Formato Mobile-First 9:16:** Diseño responsivo vertical optimizado ergonómicamente para teléfonos inteligentes (`max-w-4xl mx-auto`).
- [x] **Navegación fija inferior:** Barra de pestañas anclada al pie (`fixed bottom-0 left-0 w-full z-50 ...`) con áreas táctiles aptas para el pulgar.
- [x] **5 Vistas Oficiales implementadas:**
  - **1. Resumen:** KPIs de siniestros, lesionados, fatales, tasas porcentuales dinámicas, distribución de severidad y 3 propuestas prioritarias para el Concejo Deliberante.
  - **2. Cuándo:** Evolución histórica anual (2013-2025), distribución por día, perfil horario y **Heatmap interactivo de 7 días × 24 horas con selección táctil de celda**.
  - **3. Condiciones:** Clima agrupado, iluminación, calzada y cruces de factores ambientales vs severidad.
  - **4. Por Qué:** Causas primarias, dispositivos de control y priorización territorial (intersección vs tipo de vía para responder dónde intervenir sin coordenadas GPS).
  - **5. Severidad:** Pirámide de víctimas (fatales, incapacitantes, no incapacitantes) y daño económico estimado.
- [x] **Pipeline de datos del Dashboard:** Script [`backend/build_dashboard_data.py`](backend/build_dashboard_data.py) con 3 tests unitarios adicionales (totalizando 15/15 pruebas unitarias).
- [x] **Despliegue Continuo (CI/CD):** Prerenderizado estático (SSG) publicado en [observatorio-vial-grupo1.vercel.app](https://observatorio-vial-grupo1.vercel.app).

### Entregable 3: Informe y Presentación al Cliente (Cerrado · Issue #9)
- [x] **Informe Final CRISP-DM:**
  - [x] Plan de proyecto con objetivos de negocio, objetivos técnicos, cronograma y contingencias.
  - [x] Resumen de hallazgos cuantitativos y respuesta a las preguntas clave del cliente.
  - [x] Identificación de patrones temporales críticos y segmentos de calzada vulnerables.
  - [x] Formulación de tres intervenciones concretas, priorizadas y defendibles ante el Concejo Deliberante.
  - [x] Justificación teórica y práctica de modelos supervisados (Tree, RF, Regresión Logística) y no supervisados ($k$-Means).
  - [x] Análisis de limitaciones del dato (carga policial, ausencia de coordenadas GPS, correlación vs causalidad) y plan de monitoreo.
- [x] **Presentación al Cliente (10 Minutos):**
  - [x] Estructura de diapositivas / guion para pitch ejecutivo orientado a la toma de decisiones.
  - [x] Respuestas a: *¿Cuál es el problema?*, *¿Qué encontramos?*, *¿Qué factores aparecen asociados?*, *¿Dónde priorizar?* y *¿Qué análisis adicional se recomienda?*.

---

## 4. Guía de Ejecución y Reproducción

### Requisitos Previos
* Python 3.12+ con el entorno virtual instalado en `backend/venv`.
* Node.js 20+ y `npm`.
* Orange Data Mining 3.40+.

### 1. Regenerar el Dataset Limpio y su Documentación
Procesa el archivo original `traffic_accidents.csv`, descarta duplicados, genera variables derivadas y reconstruye los reportes de calidad:
```powershell
backend\venv\Scripts\python.exe backend\prepare_dataset.py
```

### 2. Regenerar el Payload del Dashboard Web
Actualiza las agregaciones de las 5 vistas en `frontend/src/data/dashboard_data.json` a partir del CSV limpio:
```powershell
backend\venv\Scripts\python.exe backend\build_dashboard_data.py
```

### 3. Ejecutar las Pruebas Automatizadas
Verifica los contratos de datos, las reglas de derivación y la integridad del dashboard:
```powershell
backend\venv\Scripts\pytest.exe backend\tests -v
```

### 4. Abrir el Flujo en Orange Data Mining
```powershell
orange-canvas siniestralidad_vial.ows
```

### 5. Ejecutar el Dashboard en Entorno Local
```powershell
cd frontend
npm run dev
# Abrir en el navegador: http://localhost:3000
```

---

## 5. Estructura del Repositorio

```text
├── backend/
│   ├── build_dashboard_data.py        # Generador de agregaciones para el dashboard
│   ├── prepare_dataset.py             # Pipeline de limpieza y normalización del CSV
│   ├── tests/                         # Suite de pruebas unitarias (15 tests en verde)
│   └── venv/                          # Entorno virtual de Python (ignorado por Git)
├── data/
│   └── clean/
│       ├── quality_report.json        # Reporte de calidad y hash criptográfico
│       └── traffic_accidents_clean.csv # Dataset limpio y trazable (34 columnas)
├── docs/
│   ├── data-understanding-report.md   # Diagnóstico de 10 puntos de entendimiento
│   ├── diccionario-de-datos.md        # Definición de variables y reglas aplicadas
│   ├── informe-final-crisp-dm.md      # Informe final y Plan de Proyecto CRISP-DM
│   └── workflow-orange.md             # Guía paso a paso del flujo de Orange
├── frontend/
│   ├── src/app/page.tsx               # Aplicación interactiva Next.js (5 vistas)
│   ├── src/data/dashboard_data.json   # Payload consolidado de datos
│   └── README.md                      # Pautas de arquitectura y mobile-first para devs
├── odd/
│   └── tasks/                         # Registro duradero de tareas (metodología ODD)
├── brief-cliente-siniestralidad-vial.pdf # Requerimiento de la Subsecretaria de Seguridad Vial
├── simulacion_cliente_traffic_accidents.pdf # Consigna académica de la cátedra
└── siniestralidad_vial.ows            # Workflow reproducible en Orange Data Mining
```
