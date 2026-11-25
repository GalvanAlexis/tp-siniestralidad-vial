# Informe Final de Proyecto y Plan Metodológico CRISP-DM
## Observatorio de Seguridad Vial — Municipalidad de Costa Serena

> **Trabajo Práctico de Exploración y Minería de Datos — Grupo 1**  
> **Destinatarios:** Ing. Marina Solá (Subsecretaria de Seguridad Vial), Secretaría de Movilidad Urbana y Cuerpo Legislativo del Concejo Deliberante.  
> **Tablero en Producción:** [https://observatorio-vial-grupo1.vercel.app](https://observatorio-vial-grupo1.vercel.app)  
> **Flujo Analítico:** `siniestralidad_vial.ows` (Orange Data Mining 3.40+)  
> **Dataset Procesado:** 209.275 registros únicos (2013–2025) con trazabilidad criptográfica SHA-256.

---

# PARTE I: PLAN DE PROYECTO (FASE 1: COMPRENSIÓN DEL NEGOCIO)

### 1.1. Contexto y Definición del Problema de Negocio
La Municipalidad de Costa Serena (ciudad intermedia de aproximadamente 180.000 habitantes) enfrenta un sostenido incremento de siniestros viales con víctimas humanas durante los últimos dos años, agravado por la ocurrencia de dos hechos fatales con amplia repercusión en la opinión pública local.

Históricamente, la Dirección de Tránsito y el Observatorio Vial han operado bajo un esquema **reactivo**, gestionando solicitudes de semaforización, reductores de velocidad e iluminación basadas en reclamos vecinales o presión mediática. Frente a la próxima sesión presupuestaria, el Concejo Deliberante exige justificaciones técnicas objetivas y medibles para la asignación de fondos de obra pública y operativos de control.

### 1.2. Objetivos del Negocio
1. **Transformar la gestión de la seguridad vial:** Migrar de un enfoque reactivo a un modelo **basado en evidencia empírica**.
2. **Priorizar el gasto público:** Justificar técnicamente ante el Concejo Deliberante dónde, cuándo y cómo intervenir la infraestructura y el control municipal.
3. **Disminuir la morbimortalidad:** Reducir la tasa de siniestros con heridos e incapacitantes en corredores viales críticos.
4. **Fijar una línea base:** Establecer un indicador de referencia para evaluar en 12 meses el impacto real de las políticas implementadas.

### 1.3. Objetivos de Explotación de Datos (Técnicos)
1. **Pipeline de Ingesta y Calidad:** Procesar el registro histórico de 209.306 hechos viales sin pérdida de trazabilidad, estandarizando tipos de datos y tratando categorías faltantes.
2. **Descubrimiento de Patrones Multivariados:** Identificar ventanas temporales críticas (día/hora), condiciones del entorno asociadas a la severidad y conductas predominantes mediante los 7 cruces obligatorios en Orange Data Mining.
3. **Modelado Analítico Supervisado y No Supervisado:** Entrenar y comparar modelos de Machine Learning (Árbol de Decisión, Random Forest, Regresión Logística) para clasificar severidad y segmentar siniestros en clústeres mediante $k$-Means ($k=3$), evaluados rigurosamente mediante validación cruzada (*5-fold CV*).
4. **Despliegue de Dashboard Interactivo:** Desarrollar una herramienta interactiva vertical *Mobile-First (9:16)* con navegación ergonómica para que concejales y funcionarios examinen la evidencia de manera autónoma.

### 1.4. Planificación del Proyecto (Fases y Cronograma de Trabajo)
El proyecto se estructuró en 4 fases principales a lo largo de un ciclo piloto de 5 semanas:

| Semana | Fase CRISP-DM | Actividades y Tareas Principales | Entregables Clave |
| :---: | :--- | :--- | :--- |
| **Semana 1** | **Comprensión del Negocio y Datos** | Entrevistas funcionales (Brief Ing. Marina Solá). Ingesta del CSV original, auditoría de esquema, cálculo de hash SHA-256 e inventario de variables. | [`docs/data-understanding-report.md`](data-understanding-report.md)<br>Requerimientos de negocio |
| **Semana 2** | **Preparación de Datos** | Tratamiento de 31 duplicados, reagrupación de sentinas textuales (`UNKNOWN`), derivación de 10 atributos de negocio y suite de pruebas unitarias. | [`data/clean/traffic_accidents_clean.csv`](../data/clean/traffic_accidents_clean.csv)<br>[`docs/diccionario-de-datos.md`](diccionario-de-datos.md) |
| **Semana 3** | **Modelado y Minería (Orange)** | Construcción del flujo reproducible `.ows` con rutas relativas `${basedir}`. Ejecución de los 7 cruces pivote, muestreo estratificado y entrenamiento de modelos. | [`siniestralidad_vial.ows`](../siniestralidad_vial.ows)<br>[`docs/workflow-orange.md`](workflow-orange.md) |
| **Semana 4** | **Evaluación y Dashboard Web** | Matriz de confusión, evaluación cruzada (*5-fold CV*). Generación del payload JSON y desarrollo del dashboard en Next.js 16 + React 19 (5 vistas). | [Dashboard en Vercel](https://observatorio-vial-grupo1.vercel.app)<br>Tests unitarios (15/15) |
| **Semana 5** | **Implementación y Defensa** | Redacción del informe final ejecutivo y estructuración de la presentación de 10 minutos para el Concejo Deliberante. | [`docs/informe-final-crisp-dm.md`](informe-final-crisp-dm.md)<br>Guion de Pitch Ejecutivo |

### 1.5. Análisis de Riesgos y Planes de Contingencia
* **Riesgo 1: Ausencia de coordenadas geográficas (GPS).**  
  *Impacto:* Imposibilidad de graficar mapas de calor georreferenciados (*lat/long*).  
  *Contingencia:* Resolución topológica del eje espacial cruzando `trafficway_type` (tipo de vía), `traffic_control_device` e `interseccion`.
* **Riesgo 2: Fuerte desbalance de clases en severidad (fatales = 0.17%).**  
  *Impacto:* Modelos sesgados hacia la clase mayoritaria (*Solo Daños*).  
  *Contingencia:* Uso de estratificación en el muestreo, evaluación mediante métricas ponderadas ($F1$-Score y AUC-ROC) y uso de los modelos como herramientas analíticas de exploración, no como clasificadores ciegos.
* **Riesgo 3: Subjetividad en el acta policial.**  
  *Impacto:* Alta concentración de causas en `UNABLE TO DETERMINE`.  
  *Contingencia:* Análisis basado en frecuencias relativas válidas y formulación de una recomendación específica para estandarizar el protocolo de carga policial.

---

# PARTE II: INFORME FINAL DE MINERÍA DE DATOS

## Sección 1: Recolección de Datos y Análisis Exploratorio

### 1.1. Origen e Ingesta
Los datos provienen del repositorio de accidentología vial publicado en Kaggle por Oktay Ördekçi, correspondiente a registros consolidados de siniestros viales urbanos.
* **Archivo de origen:** `traffic_accidents.csv` (51.081.134 bytes).
* **Firma criptográfica SHA-256:** `9493c45d63c21ad259268021b678ef75542087ed6957ef52c8734252cbbde238`.
* **Dimensión cruda:** 209.306 filas y 24 columnas.
* **Período temporal:** 3 de marzo de 2013 al 18 de enero de 2025 (11,88 años de cobertura).

### 1.2. Análisis en Función de las Métricas Solicitadas por el Cliente
El análisis descriptivo sobre el universo de registros evidencia los siguientes indicadores macro:

```
+-------------------------------------------------------------------------------+
| TOTAL SINIESTROS : 209.275      | PROMEDIO VEHÍCULOS / HECHO : 2,02 unidades  |
| TOTAL LESIONADOS : 80.105 pers. | HERIDOS INCAPACITANTES     : 7.975 pers.    |
| TASA DE HERIDOS  : 25,88 %      | TOTAL CASOS FATALES        : 351 (0,17 %)   |
+-------------------------------------------------------------------------------+
```

1. **Magnitud del impacto humano:** Prácticamente **1 de cada 4 siniestros (25,88%) genera consecuencias corporales directas**. Si bien la tasa de fatalidad en el lugar del hecho es reducida (0,17%), se contabilizan **7.975 personas con lesiones incapacitantes permanentes**, lo que representa una carga altísima para el sistema de salud pública y seguros locales.
2. **Dinámica multivehicular:** El promedio de unidades involucradas es de **2,02** ($Q_1=2, Q_3=2$), demostrando que la tipología preponderante es el choque entre dos vehículos particulares, mientras que siniestros de 3 o más unidades representan eventos atípicos en vías rápidas.
3. **Distribución temporal (Patrón Cuándo):**
   * *Estacionalidad anual:* Se verifica un crecimiento progresivo desde 2013 con picos de siniestralidad sostenida previa a 2020 y posterior recuperación de la circulación habitual.
   * *Ciclo semanal:* Los viernes concentran el mayor volumen global de hechos (**34.331 casos**), seguidos por sábados y lunes.
   * *Ciclo diario:* La curva horaria muestra un mínimo pronunciado entre las 03:00 y las 05:00 hs, comenzando a subir con la apertura de actividades matutinas (07:00 a 09:00 hs) y alcanzando una meseta máxima sostenida entre las **14:00 y las 18:00 hs** (con pico a las 16:00 hs, superando los 16.000 hechos).
   * *La disociación del riesgo fatal:* Mientras que el **volumen** de siniestros domina la tarde laboral, la **proporción de letalidad** aumenta sustancialmente durante las madrugadas de sábados y domingos (entre las 23:00 y las 04:00 hs), donde la combinación de menor densidad de tránsito, alcohol y velocidad excesiva incrementa la gravedad relativa.

---

## Sección 2: Preparación de Datos (Data Preparation)

### 2.1. Problemas de Calidad Detectados y Soluciones Aplicadas

#### A. Duplicidad de Registros
* **Problema:** Se identificaron **31 filas idénticas** en las 24 columnas originales, producto de redundancia en la exportación de planillas.
* **Solución (Regla R1):** Remoción determinista de duplicados exactos, reduciendo el corpus a **209.275 filas únicas**.

#### B. Valores Faltantes Ocultos bajo Categorías Textuales (Sentinas)
* **Problema:** El análisis formal de celdas vacías (`NULL` / `NaN`) arrojaba 0. Sin embargo, el dato faltante estaba enmascarado en categorías como `UNKNOWN`, `OTHER`, `NOT APPLICABLE` o `UNABLE TO DETERMINE` (por ejemplo, 58.316 registros en causa primaria y 34.426 en defectos de calzada).
* **Solución (Reglas R9, R10, R11):** No se descartaron estas filas (lo que hubiera destruido el 30% del histórico). En su lugar, se transparentaron en los diccionarios y se agruparon en variables derivadas normalizadas (`clima_grupo`, `iluminacion_grupo`, `calzada_grupo`), evitando distorsiones por categorías residuales de uno o dos casos.

#### C. Inconsistencia Administrativa de `crash_type`
* **Problema:** En el esquema original, la columna `crash_type` contiene el valor `"INJURY AND / OR TOW DUE TO CRASH"` en 76.549 casos. Al auditar minuciosamente las lesiones, se constató que **37.418 de esos casos no tenían ningún herido ni fallecido**, sino únicamente traslado del vehículo por grúa. Utilizar `crash_type` como variable objetivo de severidad distorsionaba la gravedad real.
* **Solución (Regla R7):** Se derivó la variable **`severidad`** basada estrictamente en la integridad física de las personas:
  $$\text{severidad} = \begin{cases} \text{Fatal} & \text{si } \text{injuries\_fatal} > 0 \\ \text{Con Heridos} & \text{si } \text{injuries\_total} > 0 \land \text{injuries\_fatal} = 0 \\ \text{Solo Daños} & \text{en cualquier otro caso} \end{cases}$$

#### D. Verificación Aritmética de Lesiones
Se auditó la consistencia interna de las columnas de víctimas. Se comprobó con 100% de coincidencia (0 discrepancias en 209.275 filas) que:
$$\text{injuries\_total} = \text{injuries\_fatal} + \text{injuries\_incapacitating} + \text{injuries\_non\_incapacitating} + \text{injuries\_reported\_not\_evident}$$
Asimismo, se constató que `injuries_no_indication` (469.683 personas ilesas) representa individuos sin afectación física, por lo que debe quedar excluida de la métrica de lesionados.

### 2.2. Resumen de las 12 Reglas de Transformación Implementadas

```
+-----+----------------------------+--------------------------------------------------------------------------+
| ID  | Variable Derivada          | Justificación Operativa / Negocio                                        |
+-----+----------------------------+--------------------------------------------------------------------------+
| R1  | Filtro Duplicados          | Elimina 31 filas repetidas sin aporte informativo.                       |
| R2  | Strip Strings              | Sanea espacios invisibles al inicio y fin de textos.                    |
| R3  | fecha (ISO)                | Estandariza fechas de formato US a AAAA-MM-DD HH:MM:SS para ordenación.  |
| R4  | anio                       | Permite agrupaciones anuales directas sin sobrecosto de cómputo.         |
| R5  | dia_semana                 | Traduce codificación (1=Domingo ... 7=Sábado) a nombres legibles.        |
| R6  | mes_nombre                 | Convierte mes numérico a etiquetas en español para visualización.       |
| R7  | severidad                  | Segmentación médica: Fatal (351), Con Heridos (54.157), Solo Daños.     |
| R8  | lesionados                 | Casting de float64 a entero sin decimales artificiales.                  |
| R9  | clima_grupo                | Agrupa 12 categorías en 6 macroclases (Despejado, Precipitación, etc.).  |
| R10 | iluminacion_grupo          | Agrupa 6 categorías en Día, Noche iluminada, Noche oscura, Transición.   |
| R11 | calzada_grupo              | Agrupa 7 superficies en Seca, Mojada, Invernal (nieve/hielo), Suelta.    |
| R12 | interseccion               | Convierte intersection_related_i (Y/N) a booleano numérico (1/0).       |
+-----+----------------------------+--------------------------------------------------------------------------+
```

### 2.3. Criterio de Selección y Exclusión de Variables para Modelado (Prevención de Fuga de Información)
Para garantizar la validez metodológica en Orange, el nodo de selección de variables aplicó un criterio riguroso de **exclusión deliberada**:
* **Se excluyeron todas las columnas de daño y lesiones posteriores:** `injuries_*`, `most_severe_injury`, `lesionados` y `damage`. Dado que la clase a predecir es `severidad`, incluir estas variables implicaría **Target Leakage** (predecir el resultado utilizando datos que solo se conocen tras la consumación del hecho).
* **Se excluyeron identificadores y variables redundantes:** `crash_date`, `fecha`, `anio`, `dia_semana` (se mantuvieron `crash_hour`, `crash_day_of_week` y `crash_month`).
* **Variables predictoras seleccionadas (14 factores pre-siniestro):** Tipo de control de tránsito, condición climática, condición de iluminación, primer tipo de impacto, tipo de calzada, alineación vial, estado de la calzada, defecto del camino, causa contributiva primaria, cantidad de vehículos involucrados, hora, día de la semana, mes e intersección.

---

## Sección 3: Selección y Justificación Teórica de Modelos

Para dar respuesta integral a la consigna, se exploraron técnicas de aprendizaje supervisado (clasificación multiclase) y no supervisado (agrupamiento):

```
                                    +----------------------------------+
                                    | Muestra Estratificada (20.000)   |
                                    | Semilla: 42 (Balanceada en clase)|
                                    +-----------------+----------------+
                                                      |
                    +---------------------------------+--------------------------------+
                    |                                 |                                |
        +-----------v-----------+         +-----------v-----------+        +-----------v-----------+
        |  Árbol de Decisión    |         |     Random Forest     |        |  Regresión Logística  |
        |  Profundidad máx: 8   |         | 100 árboles / prof: 12|        |  Multinomial (L2)     |
        |  (Interpretabilidad)  |         | (Reducción varianza)  |        |  (Referencia lineal)  |
        +-----------------------+         +-----------------------+        +-----------------------+
```

### 3.1. Modelos Supervisados

#### 1. Árbol de Decisión (Decision Tree)
* **Justificación en el Negocio:** Es el modelo por excelencia para la función pública. Genera un conjunto jerárquico de reglas lógicas del tipo `SI (hora > 22 Y via == "NO DIVIDIDA" Y luz == "OSCURA") ENTONCES severidad = Con Heridos`. Su estructura permite que funcionarios del Concejo Deliberante sin formación matemática comprendan con claridad la secuencia de riesgo.
* **Fundamento Teórico:** Algoritmo que particiona recursivamente el espacio de características seleccionando en cada nodo la variable y el umbral de corte que maximizan la homogeneidad de la clase resultante. En Orange se utiliza el criterio de **Ganancia de Información** o **Índice de Gini**:
  $$I_G(p) = 1 - \sum_{i=1}^{C} p_i^2$$
  Para evitar sobreajuste (*overfitting*) en categorías con pocas observaciones, se limitó la profundidad máxima a 8 niveles.

#### 2. Bosques Aleatorios (Random Forest)
* **Justificación en el Negocio:** Si bien los árboles individuales son transparentes, presentan alta varianza (inestabilidad ante pequeñas variaciones en los datos). Random Forest combina múltiples árboles para obtener un clasificador robusto y medir la importancia relativa de cada factor en la siniestralidad.
* **Fundamento Teórico:** Técnica de ensamble basada en *Bagging* (Bootstrap Aggregating) y selección aleatoria de predictores (*Random Subspace Method*). Se entrenan $B = 100$ árboles independientes construidos a partir de muestras bootstrap con reemplazo. En cada bifurcación, el algoritmo no evalúa todas las variables disponibles, sino un subconjunto aleatorio de tamaño $\approx \sqrt{M}$ (donde $M$ es la cantidad de predictoras). La predicción final se obtiene mediante votación mayoritaria:
  $$\hat{y} = \text{moda} \left\{ \hat{y}_1, \hat{y}_2, \dots, \hat{y}_B \right\}$$
  Se configuró una profundidad máxima de 12 para controlar el costo computacional.

#### 3. Regresión Logística Multinomial
* **Justificación en el Negocio:** Sirve como línea de base (*baseline*) lineal paramétrica. Permite cuantificar en términos de probabilidades cómo la presencia de un factor de riesgo (ej. lluvia nocturna) aumenta o disminuye las chances de pasar de *Solo Daños* a *Con Heridos*.
* **Fundamento Teórico:** Modela la probabilidad de pertenencia a cada clase $k \in \{\text{Solo Daños, Con Heridos, Fatal}\}$ mediante combinaciones lineales ponderadas transformadas por la función Softmax:
  $$P(Y = k \mid \mathbf{x}) = \frac{e^{\mathbf{w}_k^T \mathbf{x} + b_k}}{\sum_{j=1}^{K} e^{\mathbf{w}_j^T \mathbf{x} + b_j}}$$
  Se aplicó regularización Ridge ($L_2$) para estabilizar los coeficientes frente a la colinealidad de categorías ambientales:
  $$\mathcal{L}_{reg} = -\sum \log P(Y = y_i \mid \mathbf{x}_i) + \lambda \sum \|\mathbf{w}\|^2$$

### 3.2. Modelo No Supervisado: Agrupamiento $k$-Means
* **Justificación en el Negocio:** Permite agrupar los siniestros sin utilizar la etiqueta de severidad predefinida, descubriendo si existen "perfiles naturales" de siniestralidad en la ciudad (ej. choques diurnos por alcance vs siniestros nocturnos por pérdida de control).
* **Fundamento Teórico:** Algoritmo particional que divide las $N$ observaciones en $k$ clústeres disjuntos minimizando la suma de distancias cuadradas intra-clúster (inercia o *Within-Cluster Sum of Squares*):
  $$J = \sum_{j=1}^{k} \sum_{\mathbf{x}_i \in S_j} \|\mathbf{x}_i - \boldsymbol{\mu}_j\|^2$$
  Se configuró $k=3$ sobre los atributos normalizados numéricamente (hora, día, mes, número de unidades, intersección).

---

## Sección 4: Proceso de Evaluación de Resultados y Conclusiones

### 4.1. Esquema de Validación y Muestreo
Para garantizar robustez metodológica y permitir que el flujo en Orange sea ágil y reproducible en entorno de aula o reunión directiva, se configuró:
* **Muestra representativa de 20.000 observaciones** con semilla pseudoaleatoria fija (`42`), estratificada por la variable `severidad` para preservar exactamente la tasa de eventos críticos.
* **Validación Cruzada Estratificada de 5 Pliegues (5-Fold Stratified Cross-Validation):** El conjunto de datos se dividió en 5 subconjuntos balanceados; cada modelo se entrenó 5 veces utilizando 4 pliegues para ajuste y 1 para testeo ciego, promediando las métricas de rendimiento.

### 4.2. Resultados Comparativos de Rendimiento en Clasificación

```
+---------------------+---------+---------+----------+-----------+--------+
| Modelo              | AUC-ROC | CA (Acc)| F1-Score | Precisión | Recall |
+---------------------+---------+---------+----------+-----------+--------+
| Random Forest       |  0,642  |  0,741  |  0,652   |   0,683   | 0,741  |
| Árbol de Decisión   |  0,618  |  0,735  |  0,644   |   0,659   | 0,735  |
| Regresión Logística |  0,635  |  0,740  |  0,638   |   0,671   | 0,740  |
+---------------------+---------+---------+----------+-----------+--------+
```

#### Interpretación Crítica de las Métricas
1. **La trampa de la Exactitud Global (CA $\approx$ 74%):** Una lectura ingenua concluiría que los modelos tienen un 74% de acierto. En realidad, debido a que el 73,95% de los siniestros son de *Solo Daños*, un modelo nulo que prediga siempre daño material obtendría exactamente ese valor.
2. **Desafío en la clase minoritaria (*Fatal*):** Al representar solo el 0,17% del total (apenas 35 casos en la muestra de 20.000), el $Recall$ sobre la clase fatal es prácticamente nulo en modelos estándar sin remuestreo extremo (SMOTE). Esto confirma la regla de oro exigida por la cátedra: **el modelo predictivo debe utilizarse como una herramienta analítica de exploración y ponderación de variables de riesgo, nunca como un automatismo causal cerrado.**
3. **Poder explicativo de los atributos:** Los factores con mayor ganancia de información en los árboles son:
   * `first_crash_type` (los impactos con peatones, ciclistas y choques en ángulo muestran probabilidad desproporcionada de lesiones).
   * `trafficway_type` e `interseccion` (los tramos no divididos de 4 carriles multiplican los puntos de conflicto).
   * `crash_hour` y `lighting_condition` (diferenciador clave entre daño material y daño físico grave).

### 4.3. Resultados de la Segmentación No Supervisada ($k$-Means, $k=3$)
El agrupamiento reveló tres perfiles nítidos de eventos viales en la ciudad:

```
+----------------------------------------------------------------------------------------------------+
| CLÚSTER 1 : Siniestros Diurnos Comerciales (54 % del volumen)                                      |
| Choques por alcance y roces en horario laboral (08:00 a 17:00 hs). Predominio de calzada seca y   |
| dos unidades. Severidad: 82 % Solo Daños materiales. Causa: Seguimiento indebido y distracción.    |
+----------------------------------------------------------------------------------------------------+
| CLÚSTER 2 : Colisiones Complejas en Intersecciones (31 % del volumen)                              |
| Concentrados en cruces de 4 vías semaforizados o con cartel de PARE. Choques en ángulo y giros.    |
| Severidad: 38 % Con Heridos. Causa preponderante: Violación de la prioridad de paso.               |
+----------------------------------------------------------------------------------------------------+
| CLÚSTER 3 : Eventos Críticos Nocturnos y Fin de Semana (15 % del volumen)                          |
| Horario de 21:00 a 05:00 hs, viernes a domingos. Vías rápidas, curvas o iluminación deficiente.    |
| Severidad: Mayor tasa de lesionados incapacitantes y fatales. Causa: Velocidad y alcohol.          |
+----------------------------------------------------------------------------------------------------+
```

---

### 4.4. Conclusiones y 3 Intervenciones Priorizadas para el Concejo Deliberante

Basado en la evidencia contrastada, se formulan tres intervenciones concretas, medibles y viables:

```
                            3 INTERVENCIONES ESTRATÉGICAS
                               (Concejo Deliberante)
                                         |
     +-----------------------------------+-----------------------------------+
     |                                   |                                   |
+----v--------------------+     +--------v----------------+     +------------v------------+
| 1. INFRAESTRUCTURA      |     | 2. FISCALIZACIÓN        |     | 3. CONCIENTIZACIÓN      |
| Cruces Críticos         |     | Operativos Móviles      |     | Campaña Prioridad Paso  |
| - Tiempos giro protegido|     | - Ventana 15 a 21 hs    |     | - 42.000+ casos en actas|
| - Reductores velocidad  |     | - Viernes a Domingos    |     | - Foco en rotondas y    |
| - Iluminación LED focal |     | - Control nocturno vel. |     |   distancia de frenado  |
+-------------------------+     +-------------------------+     +-------------------------+
```

1. **Intervención 1 (Infraestructura Vial en Intersecciones):**
   * *Evidencia:* Las intersecciones en calzadas no divididas representan el mayor foco de colisiones con personas lesionadas.
   * *Acción:* Modificar la programación semafórica para incorporar fases de **giro protegido exclusivo a la izquierda**, instalar reductores trapezoidales de velocidad 30 metros antes del cruce y reforzar la luminaria LED cenital en las esquinas críticas.
2. **Intervención 2 (Fiscalización Horaria Inteligente):**
   * *Evidencia:* El Heatmap 7×24 demuestra que el 40% de los siniestros y los picos de letalidad se concentran entre las 15:00 y las 22:00 hs de viernes a domingos.
   * *Acción:* Reestructurar los cuadrantes de la Policía Municipal de Tránsito para abandonar el patrullaje administrativo diurno lineal y concentrar postas de control vehicular y alcoholemia en esa ventana horaria específica.
3. **Intervención 3 (Campaña de Educación y Prioridad de Paso):**
   * *Evidencia:* La causa número 1 tipificada con 42.909 casos es *"Failing to yield right-of-way"* (no respetar la prioridad de paso de la derecha o en giros), seguida por *"Following too closely"* (19.074 casos).
   * *Acción:* Lanzar una campaña de comunicación institucional intensiva en medios locales y licencias de conducir centrada en la regla de prioridad en rotondas y cruces no semaforizados.

---

## Sección 5: Sugerencias Futuras y Plan de Monitoreo

### 5.1. Plan de Monitoreo y Mantenimiento del Tablero
* **Línea Base Trimestral:** Establecer el valor histórico actual como línea base ($T_0$). Cada trimestre, la Dirección de Tránsito debe contrastar los siniestros ocurridos en los corredores intervenidos contra este valor.
* **Regeneración en Un Solo Paso:** Gracias a la arquitectura implementada, cuando el municipio incorpore nuevos cortes mensuales de datos en `traffic_accidents.csv`, todo el ecosistema analítico se reconstruye de manera automática con un único comando:
  ```powershell
  backend\venv\Scripts\python.exe backend\prepare_dataset.py && backend\venv\Scripts\python.exe backend\build_dashboard_data.py
  ```

### 5.2. Hoja de Ruta Analítica Recomendada
1. **Incorporación de Coordenadas Geográficas (GPS):** Digitalizar el parte policial para capturar latitud y longitud directas en el lugar del hecho mediante un formulario móvil, habilitando mapas de calor por densidad de kernel (KDE).
2. **Integración de Aforos de Tránsito (Exposición al Riesgo):** Incorporar sensores de conteo vehicular o estimaciones de Aforo Medio Diario Anual (TMDA). Una avenida con 100 choques puede ser estadísticamente más segura que una calle secundaria con 10 si por la primera transitan 50 veces más vehículos.
3. **Estandarización de Tipificación Policial:** Capacitar a los agentes viales para reducir el porcentaje de causas rotuladas como `UNABLE TO DETERMINE`, introduciendo cuestionarios de selección múltiple estandarizados en el labrado de actas.

---

# PARTE III: GUION PARA LA PRESENTACIÓN EJECUTIVA (10 MINUTOS)

Estructura diseñada para la defensa ante la Ing. Marina Solá y el Concejo Deliberante:

| Diapositiva / Minuto | Título y Enfoque | Mensaje Fuerza a Transmitir |
| :---: | :--- | :--- |
| **Minuto 0–2** | **1. ¿Cuál es el problema?** | "Costa Serena dejó de gestionar la seguridad vial por intuición o reclamos vecinales. Analizamos 209.275 hechos reales para justificar técnicamente el presupuesto de prevención." |
| **Minuto 2–4** | **2. ¿Qué encontramos?** | "1 de cada 4 siniestros deja víctimas corporales (80.105 lesionados y casi 8.000 heridos incapacitantes). El 74% de los choques son solo daños materiales, pero el costo de salud pública está concentrado." |
| **Minuto 4–6** | **3. ¿Qué factores se asocian?** | "Desmitificamos que los accidentes graves ocurren por lluvia o defectos del asfalto: el 78% ocurren en asfalto seco y buen clima. El factor crítico es el comportamiento en cruces (no ceder el paso) y la ventana crítica de viernes a domingo por la tarde/noche." |
| **Minuto 6–8** | **4. ¿Qué debe priorizar el Concejo?** | "Presentamos 3 intervenciones concretas: 1) Semaforización con giro protegido en cruces de 4 vías; 2) Despliegue policial enfocado en la ventana horaria crítica del fin de semana; 3) Campaña en prioridad de paso." |
| **Minuto 8–10** | **5. Próximos pasos y Tablero** | "El municipio cuenta desde hoy con un Observatorio Web interactivo mobile-first para consulta permanente de los concejales y un plan de monitoreo para evaluar el éxito en 12 meses." |
