# Grupo Pioneros · Evaluación Novios

Sistema de encuesta post-evento para novios del Grupo Pioneros (Tinto Banquetería) + dashboard interno de resultados.

Migrado de "todo-en-Apps-Script" a la misma arquitectura que los demás sistemas Tinto: **frontend estático en Cloudflare Pages + backend JSON en Apps Script**.

## Arquitectura

```
Novios → feedback.tintobanqueteria.cl  (Cloudflare Pages · public/feedback)
                      │
Equipo → evaluacion.tintobanqueteria.cl (Cloudflare Pages · public/evaluacion)
                      │
                      │   fetch POST/GET (text/plain JSON)
                      ▼
          script.google.com/macros/s/…/exec  (Apps Script · apps-script/)
                      │   SpreadsheetApp.openById(...)
                      ▼
          Sheet 1VdcezrZOSO03X_1-Njl4Mrz4kdAcYZqZmuzDI4MXpHI
          · hojas "Respuestas Novios" y "Aux"
```

## Datos clave

| | |
|---|---|
| Script ID | `1mBa4pgYuRQoPyuVUVwF1kmX4-T3CAA7bNFiepP61awC62ccbpaqyUuvi` |
| Sheet ID | `1VdcezrZOSO03X_1-Njl4Mrz4kdAcYZqZmuzDI4MXpHI` |
| Deployment actual | `AKfycbyb71s5hczVEASojmRZDcgd5tztHJ5c3_uda0Nb3iM7CnLjlsenFXfJz5V1fmZSQns` |
| Dominio formulario | `feedback.tintobanqueteria.cl` |
| Dominio dashboard | `evaluacion.tintobanqueteria.cl` |
| Informe mensual | `enviarInformeMensual` (trigger el 1 de cada mes, envía PDF a socios + comercial) |

## Estructura del repo

```
apps-script/              # backend — espejo del proyecto Apps Script (clasp)
  appsscript.json         # manifest (webapp ANYONE_ANONYMOUS, USER_DEPLOYING)
  Código.js               # doGet / doPost con routing JSON por `action`
  Enviomail.js            # informe mensual PDF + envío por correo
public/
  feedback/
    index.html            # formulario novios (servido en feedback.tintobanqueteria.cl)
  evaluacion/
    index.html            # dashboard interno (servido en evaluacion.tintobanqueteria.cl)
.clasp.json               # rootDir: apps-script
DEPLOY.md                 # pasos de despliegue (Apps Script + Cloudflare)
```

## API del backend

`APPS_SCRIPT_URL = https://script.google.com/macros/s/{deployment}/exec`

| Método | Query / Body | Respuesta |
|---|---|---|
| GET `?action=centros` | — | `{ ok, centros: [...] }` |
| GET `?action=respuestas` | — | `{ ok, rows: [...] }` |
| POST | `{ action: "registrar", data: {...} }` | `{ ok, mensaje }` |

El header del POST es `Content-Type: text/plain;charset=utf-8` para evitar preflight CORS.

## Desarrollo local

```bash
clasp pull -u tinto                 # trae cambios del editor
# editar apps-script/* o public/*
clasp push -u tinto                 # solo sube apps-script/ (rootDir en .clasp.json)
clasp version "v2: descripcion" -u tinto
clasp redeploy AKfycbyb71s5hczVEASojmRZDcgd5tztHJ5c3_uda0Nb3iM7CnLjlsenFXfJz5V1fmZSQns -V 2 -d "v2" -u tinto
```

Cloudflare Pages despliega automáticamente al hacer push a `main` (dos proyectos distintos apuntando a este repo con root directories `public/feedback` y `public/evaluacion`).

Para probar el dashboard localmente sin backend, abrir `public/evaluacion/index.html?mock` (genera datos falsos).

## Links

- Tablero Grupo Pioneros: <https://mbarros-tinto.github.io/steve-panel/>
- Eval Supervisoras (sistema distinto): `mbarros-tinto/steve-eval-supervisoras`
- Pasos detallados de publicación: [DEPLOY.md](./DEPLOY.md)
