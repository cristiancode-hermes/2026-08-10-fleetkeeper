# FleetKeeper — Gestión de Flota y Mantenimiento de Vehículos

Cuaderno de taller digital para flotas pequeñas (2–15 vehículos): registro de vehículos (kilometraje, ITV, seguro), tareas de mantenimiento recurrentes con **recordatorios automáticos** por kilómetros o por fecha, y métricas reales de coste y consumo (l/100km) calculadas entre repostajes.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Angular 22 (standalone, signals, zoneless, lazy routes) |
| Backend | NestJS 11 (modules: auth, users, vehicles, tasks, service-records, fuel-logs, reminders, reports) |
| Base de datos | better-sqlite3 (dev) / Neon PostgreSQL (producción) |
| Auth | JWT + Passport, bcryptjs, login por **username O email** |
| Charts | SVG line/bar charts (custom, sin librería externa) |

## Funcionalidades

- **Auth**: registro/login (username o email), JWT, guard de rutas, token persistente tras recargar.
- **Vehículos**: CRUD con matrícula única, categoría, combustible, odómetro, estado (activo/en taller/baja), búsqueda y filtros.
- **Tareas de mantenimiento**: intervalo por km y/o meses; vencimiento calculado (`nextDueKm = lastOdometerKm + intervalKm`, `nextDueDate = lastDoneAt + intervalMonths`); estado derivado `upcoming → due → overdue`.
- **Servicios**: historial de intervenciones; al completar una tarea se actualiza su última ejecución y se recalcula el vencimiento.
- **Repostajes**: registro con tanque lleno sí/no; consumo medio real (l/100km) entre repostajes consecutivos.
- **Dashboard**: KPIs de flota, alertas due/overdue con ack, coste del mes.
- **Reportes**: coste por mes y por vehículo (bar chart), consumo por vehículo (line chart).
- **Export CSV**: vehículos, servicios y repostajes.
- **Dark/Light mode** (preferencia persistida + `prefers-color-scheme`).

## Endpoints principales (base `/api`, puerto 3044)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crear cuenta `{ username, email, password }` |
| POST | `/api/auth/login` | Login `{ identifier, password }` (username o email) |
| GET | `/api/vehicles/dashboard` | KPIs, alertas y coste del mes |
| POST | `/api/vehicles` | Crear vehículo (admin/manager) |
| POST | `/api/tasks` | Crear tarea de mantenimiento |
| PATCH | `/api/tasks/:id/complete` | Completar tarea → crea servicio + recalcula vencimiento |
| POST | `/api/fuel-logs` | Registrar repostaje |
| GET | `/api/reports/costs` | Coste por mes y por vehículo |
| GET | `/api/reports/efficiency` | Consumo l/100km por vehículo |

Total: **29 endpoints** (Swagger en `/api/docs`).

## Puesta en marcha

```bash
npm install
# API
cd apps/api && npm run build && PORT=3044 node dist/main.js
# Web
cd apps/web && npm run build
```

El seed es idempotente: crea el usuario demo (`demo` / `demo1234`) con 3 vehículos, tareas, servicios y repostajes la primera vez.

## Tests

```bash
cd apps/api && npm test
# 29 tests: auth, vehículos (matrícula única, odómetro monotónico), vencimientos (km y fecha),
# estados (upcoming/due/overdue/done), consumo y agregación de costes, permisos por rol
```

## Screenshot

![FleetKeeper](https://fleetkeeper.proyectos.cristiancode.dev)
