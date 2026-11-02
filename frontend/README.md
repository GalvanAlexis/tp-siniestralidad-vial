# Dashboard — Observatorio de Seguridad Vial (Next.js)

> [!WARNING]
> **AVISO IMPORTANTE PARA EL EQUIPO DE DESARROLLO (DEPRECACIÓN DE DISEÑO VIEJO)**
> El diseño inicial previo (4 pestañas: *General*, *Cruces*, *Estrategia*, *Ficha*) y los valores escritos a mano en el código quedaron **completamente deprecados y obsoletos**. 
> La consigna oficial del cliente y la entrega académica exigen **5 vistas obligatorias** alimentadas directamente del dataset procesado.

---

## 1. Reglas de Diseño y Formato (MANDATORIAS)

1. **Formato Mobile-First 9:16:**  
   El dashboard debe verse y comportarse de manera nativa en formato vertical de smartphone (relación de aspecto 9:16). El contenedor principal está restringido en ancho (`max-w-4xl mx-auto`) para garantizar legibilidad y ergonomía táctil.
2. **Navegación Inferior Fija (Bottom Navbar):**  
   Se utiliza de forma obligatoria el componente de barra de navegación inferior fija (`fixed bottom-0 left-0 w-full z-50 ...`), respetando las zonas seguras (*safe-area-inset-bottom*) de iOS y Android.
3. **Cero Números Hardcodeados en el JSX:**  
   Todas las cifras, porcentajes, promedios y etiquetas deben provenir exclusivamente de `src/data/dashboard_data.json`. No escribir números inventados en los componentes.

---

## 2. Las 5 Vistas Obligatorias

| Pestaña | Clave en Tab | Contenido y Objetivos |
| :--- | :--- | :--- |
| **1. Resumen** | `resumen` | Resumen ejecutivo con 4 KPIs principales (totales, sólo daños, heridos, fatales), tasas calculadas y gráfico de distribución de severidad. |
| **2. Cuándo** | `cuando` | Dimensión temporal: evolución anual (2013-2025), distribución por día de la semana, picos por hora y **Heatmap térmico día × hora** (matriz 7×24). |
| **3. Condiciones** | `condiciones` | Factores ambientales y calzada: clima agrupado, iluminación agrupada, estado de superficie y cruces con severidad. |
| **4. Por Qué** | `por_que` | Causas y vialidad: causas primarias contribuyentes, dispositivos de control (semáforos/señales) y priorización por tipo de vía e intersección (para responder dónde intervenir sin coordenadas GPS). |
| **5. Severidad** | `severidad` | Impacto físico y material: pirámide de víctimas (fatales, incapacitantes, leves) y rangos de daño económico reportado. |

---

## 3. Pipeline de Datos y Regeneración

Si se actualiza o regenera el dataset limpio en `data/clean/traffic_accidents_clean.csv`, el archivo `src/data/dashboard_data.json` se actualiza ejecutando desde la raíz del proyecto:

```powershell
backend\venv\Scripts\python.exe backend\build_dashboard_data.py
```

### Pruebas Automatizadas
Las reglas de agregación y el cumplimiento de las 5 vistas se verifican con `pytest`:

```powershell
backend\venv\Scripts\pytest.exe backend\tests\test_build_dashboard_data.py -v
```

---

## 4. Despliegue en Vercel

El proyecto está vinculado al dominio oficial:
* **Producción:** [https://observatorio-vial-grupo1.vercel.app](https://observatorio-vial-grupo1.vercel.app)
* Despliegue de producción:
  ```powershell
  cd frontend
  npx vercel --prod
  ```
