# Entregable 2 — Dashboard Interactivo y Reorganización de Vistas

Objetivo: Reestructurar el dashboard interactivo en Next.js con las 5 vistas exigidas por el cliente y la consigna, consumiendo el dataset limpio, eliminando el diseño viejo de 4 pestañas y asegurando soporte mobile-first 9:16 con bottom navigation.
Rama: `feature/ISS-008_dashboard_reorganizacion` (vinculada a issue #8).
Runners: `pytest backend/tests` (Python) y `npm run build` / `npx tsc --noEmit` (Frontend).

## Specs

- **S1 — 5 Vistas Obligatorias:** "Armar las 5 vistas requeridas: Resumen ejecutivo, Cuándo ocurren, Condiciones, Por qué ocurren, y Severidad."
- **S2 — Heatmap día × hora:** "Patrón temporal: año, mes, día de la semana y heatmap día x hora."
- **S3 — Trazabilidad y Datos Limpios:** Cero cifras escritas a mano en el JSX; los datos deben provenir de `backend/build_dashboard_data.py` generado a partir de `data/clean/traffic_accidents_clean.csv`.
- **S4 — Ergonomía Mobile-First 9:16:** Diseño responsivo vertical optimizado para smartphone (relación 9:16) con barra de navegación inferior fija (*bottom navbar*) y áreas táctiles de fácil acceso.
- **S5 — Priorización sin GPS:** Responder al cliente dónde intervenir mediante el cruce de `trafficway_type` e `interseccion`.

## Tasks

| ID | Spec | Ruta | Estado | Commit / evidencia |
| --- | --- | --- | --- | --- |
| T1 | S3 | `backend/build_dashboard_data.py` | completada | Generador automático de payload JSON desde CSV limpio con pruebas unitarias |
| T2 | S1, S4 | `frontend/src/app/page.tsx` | completada | Reorganización completa en 5 pestañas con Bottom Navbar en formato 9:16 |
| T3 | S2 | `frontend/src/app/page.tsx` | completada | Componente de matriz térmica Heatmap (7 días × 24 horas) interactivo |
| T4 | S5 | `frontend/src/app/page.tsx` | completada | Gráficos de priorización en intersecciones y tramos rectos por tipo de vía |
| T5 | S3 | `frontend/README.md` | completada | Documentación de advertencia y guía técnica clara para el equipo dev |
| T6 | S1..S5 | `master` / Vercel | pendiente | Merge de PR a master y nuevo despliegue en Vercel |

## Log

### L1 — Solicitud del usuario
> claro mejor deja avisado al dev, que todo ese diseño es viejo y hay que reorganizar los nuevos datos limpios con la web. que utilice el nav inferior para seguir siendo compatible con el formato 9:16 vertical mobile. quisiera que ajustes la estructura, para evitar confuciones al dev junior
