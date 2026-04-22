# Deployment — Evaluación Novios

Dos pasos: (1) publicar backend Apps Script como Web App JSON, (2) dos proyectos de Cloudflare Pages (feedback + evaluacion) apuntando a este repo.

## 1. Autorizar scopes del Apps Script (una sola vez)

1. Abrir el editor: https://script.google.com/d/1mBa4pgYuRQoPyuVUVwF1kmX4-T3CAA7bNFiepP61awC62ccbpaqyUuvi/edit
2. Ejecutar la función `autorizar` desde el menú del editor.
3. Aceptar los permisos solicitados (SpreadsheetApp + MailApp para el informe mensual).

## 2. Publicar / actualizar el Webapp

En el editor de Apps Script:

**Primera vez** — `Implementar → Nueva implementación → Tipo: Aplicación web`
- **Ejecutar como:** `Yo (mbarros@tintobanqueteria.cl)`
- **Quién tiene acceso:** `Cualquier usuario` (importante: anónimo)
- Implementar → copiar la **URL** tipo `https://script.google.com/macros/s/AKfyc.../exec`
- Pegar esa URL reemplazando `APPS_SCRIPT_URL` en **ambos** archivos:
  - `public/feedback/index.html`
  - `public/evaluacion/index.html`
- Commit + push.

**Cambios posteriores** — Mantener el mismo deployment:
```bash
clasp push -u tinto
clasp version "v2: descripcion" -u tinto
clasp redeploy AKfycbzAiqCVrr96pQ21JiVaB1HOWQr76--7Vian-mgqyG_DlLp-ZjxVuF878bP6BEUSbmKm -V <N> -d "v2" -u tinto
```
La URL de exec no cambia, así que el frontend no necesita tocarse.

## 3. Cloudflare Pages — dos proyectos

Hay **dos** proyectos de Cloudflare Pages conectados al mismo repo, diferenciados por el Root directory.

### Proyecto A — `feedback-tintobanqueteria`

1. Cloudflare Dashboard → **Pages → Create project → Connect to Git**
2. Repo: `mbarros-tinto/steve-eval-novios` · branch: `main`
3. Configuración del build:
   - **Build command:** *(vacío)*
   - **Build output directory:** `public/feedback`
   - **Root directory:** *(vacío)*
4. Deploy. Cloudflare te dará una URL `*.pages.dev`.

### Proyecto B — `evaluacion-tintobanqueteria`

Mismo procedimiento, pero:
   - **Build output directory:** `public/evaluacion`

## 4. Dominios custom en `tintobanqueteria.cl`

### `feedback.tintobanqueteria.cl`

En el proyecto A de Cloudflare Pages:
1. **Custom domains → Set up a custom domain → `feedback.tintobanqueteria.cl`**
2. Cloudflare crea el CNAME automáticamente (porque `tintobanqueteria.cl` ya está en Cloudflare).
   Si no está en Cloudflare, agregar manualmente:
   ```
   Tipo:  CNAME
   Name:  feedback
   Value: feedback-tintobanqueteria.pages.dev
   Proxy: ON (nube naranja)
   ```

### `evaluacion.tintobanqueteria.cl`

En el proyecto B: **Custom domains → `evaluacion.tintobanqueteria.cl`** — misma mecánica.

Tras la verificación, ambos dominios quedan servidos con SSL automático.

## 5. Prueba end-to-end

**Formulario (feedback.tintobanqueteria.cl):**
1. Abrir https://feedback.tintobanqueteria.cl
2. El select "Centro de Eventos" debe poblarse (llama a `?action=centros`).
3. Completar, enviar → debe aparecer fila nueva en hoja `Respuestas Novios`.
4. El modal de confirmación aparece y recarga a los 4 s.

**Dashboard (evaluacion.tintobanqueteria.cl):**
1. Abrir https://evaluacion.tintobanqueteria.cl
2. Debe cargar todas las respuestas y pintar KPIs + gráficos.
3. Para debug sin backend: `https://evaluacion.tintobanqueteria.cl/?mock` (datos falsos).

## 6. Informe mensual

Trigger automático (`enviarInformeMensual`) el día 1 de cada mes, 8-9 AM:
- Destinatarios: `socios@tintobanqueteria.cl` + `comercial@tintobanqueteria.cl`
- Adjunta PDF con resultados del mes + comparativo histórico + oportunidades de mejora.

Configurar el trigger una sola vez desde el editor: **Triggers (⏰) → Agregar trigger → `enviarInformeMensual` → Basado en tiempo → Mes (1, 8-9 AM)**.

Para probar sin esperar al día 1: ejecutar `testEnvioInforme` desde el editor (envía a `barrosvial@gmail.com` con banner de MODO TEST).
