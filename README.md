# Grupo Pioneros · Evaluación Novios

Web App de Apps Script para la **encuesta post-evento de novios** del Grupo Pioneros (Tinto Banquetería).

Dos vistas en el mismo script (`doGet(e).parameter.page`):

- **Formulario** (público, por default) — encuesta de satisfacción de los novios
- **Dashboard** (`?page=dashboard`) — visualizador interno de resultados agregados

## Arquitectura

| Pieza | Detalle |
|---|---|
| Script ID | `1mBa4pgYuRQoPyuVUVwF1kmX4-T3CAA7bNFiepP61awC62ccbpaqyUuvi` |
| Sheet | `1VdcezrZOSO03X_1-Njl4Mrz4kdAcYZqZmuzDI4MXpHI` |
| Backend | `Código.js` + `Enviomail.js` |
| UI | `formulario_novios.html`, `visualizador_novios.html` |

### Deployment vivo (producción)

| Deployment ID | Versión |
|---|---|
| `AKfycbzAiqCVrr96pQ21JiVaB1HOWQr76--7Vian-mgqyG_DlLp-ZjxVuF878bP6BEUSbmKm` | v1 |

- Formulario público: `https://script.google.com/macros/s/AKfycbzAiqCVrr96pQ21JiVaB1HOWQr76--7Vian-mgqyG_DlLp-ZjxVuF878bP6BEUSbmKm/exec`
- Dashboard interno: `...exec?page=dashboard`

## Desarrollo local

```bash
clasp pull -u tinto
# editar Código.js / *.html / Enviomail.js
clasp push -u tinto
clasp version "v2: descripcion" -u tinto
clasp redeploy AKfycbzAiqCVrr96pQ21JiVaB1HOWQr76--7Vian-mgqyG_DlLp-ZjxVuF878bP6BEUSbmKm -V 2 -d "v2" -u tinto
```

## Relación con otros sistemas

- Tablero Grupo Pioneros: <https://mbarros-tinto.github.io/steve-panel/>
- Eval Supervisoras (sistema distinto): `mbarros-tinto/steve-eval-supervisoras`
