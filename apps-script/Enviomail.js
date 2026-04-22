// ═══════════════════════════════════════════════════════════════════
//  FUNCIÓN DE ENVÍO MENSUAL DE INFORME
//  Agregar al archivo Code_Novios.gs
//
//  CONFIGURACIÓN DEL TRIGGER AUTOMÁTICO:
//  1. En el editor de Apps Script: Triggers (reloj) → Agregar trigger
//  2. Función:          enviarInformeMensual
//  3. Tipo de evento:   Basado en tiempo
//  4. Tipo de tiempo:   Mes (timer)
//  5. Día:              1 (primero de cada mes)
//  6. Hora:             8:00 – 9:00 AM
//
//  También puedes ejecutarlo manualmente desde el editor para probar.
// ═══════════════════════════════════════════════════════════════════

var EMAIL_SOCIOS    = 'socios@tintobanqueteria.cl';
var EMAIL_COMERCIAL = 'comercial@tintobanqueteria.cl';
var NOTA_MIN        = 6;  // umbral para marcar notas bajas

// ────────────────────────────────────────────────────────────────────
//  TRIGGER MENSUAL (se ejecuta automáticamente el día 1)
// ────────────────────────────────────────────────────────────────────
function enviarInformeMensual() {
  try {
    Logger.log('=== Iniciando envío de informe mensual ===');

    var html   = buildInformePDF_();
    var blob   = generarPDF_(html);
    var ahora  = new Date();
    var mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    var mesLabel = formatMes_(mesAnterior);
    var fileName = 'Informe_Novios_' + formatMesArchivo_(mesAnterior) + '.pdf';

    blob = blob.setName(fileName);

    var asunto  = 'Informe Mensual Experiencia Novios · ' + mesLabel + ' · Tinto Banquetería';
    var cuerpo  = buildEmailBody_(mesLabel);

    MailApp.sendEmail({
      to:          EMAIL_SOCIOS,
      cc:          EMAIL_COMERCIAL,
      subject:     asunto,
      htmlBody:    cuerpo,
      attachments: [blob],
    });

    Logger.log('Informe enviado correctamente a ' + EMAIL_SOCIOS + ' y ' + EMAIL_COMERCIAL);
    return { success: true, mensaje: 'Informe enviado: ' + fileName };

  } catch(err) {
    Logger.log('ERROR enviarInformeMensual: ' + err.toString());
    MailApp.sendEmail({
      to:      EMAIL_SOCIOS,
      subject: '⚠ Error al generar informe mensual · Tinto Banquetería',
      body:    'Ocurrió un error al generar el informe mensual: \n\n' + err.toString(),
    });
    return { success: false, error: err.toString() };
  }
}

// ────────────────────────────────────────────────────────────────────
//  PROBAR MANUALMENTE — envía el informe a correo de prueba
//  Ejecutar desde el editor: selecciona testEnvioInforme → ▶ Ejecutar
// ────────────────────────────────────────────────────────────────────
var EMAIL_TEST = 'barrosvial@gmail.com';

function testEnvioInforme() {
  Logger.log('=== TEST: Enviando informe de prueba a ' + EMAIL_TEST + ' ===');
  try {
    var html      = buildInformePDF_();
    var blob      = generarPDF_(html);
    var ahora     = new Date();
    var mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
    var mesLabel  = formatMes_(mesAnterior);
    var fileName  = 'TEST_Informe_Novios_' + formatMesArchivo_(mesAnterior) + '.pdf';

    blob = blob.setName(fileName);

    var asunto = '[TEST] Informe Mensual Experiencia Novios · ' + mesLabel + ' · Tinto Banquetería';
    var cuerpo = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#c0392b;color:#fff;padding:12px 20px;border-radius:6px 6px 0 0;font-size:11px">'
      + '⚙ <b>MODO TEST</b> — Este correo fue enviado manualmente desde el editor de Apps Script.'
      + '</div>'
      + buildEmailBody_(mesLabel).replace(
          '<div style="font-family:Arial',
          '<div style="display:none;font-family:Arial'   // oculta el div exterior duplicado
        )
      + '</div>';

    // Reconstruir cuerpo limpio
    cuerpo = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
      + '<div style="background:#c0392b;color:#fff;padding:10px 20px;border-radius:6px 6px 0 0;font-size:11px;font-weight:bold">'
      + '⚙ MODO TEST · Destinatario real: ' + EMAIL_SOCIOS + ', ' + EMAIL_COMERCIAL
      + '</div>'
      + '<div style="border:1px solid #e0e0e0;border-top:none;padding:20px;background:#fafafa">'
      + '<p style="font-size:13px;color:#333">Hola,</p>'
      + '<p style="font-size:12px;color:#555;line-height:1.6">Este es el informe de prueba correspondiente a <b>' + mesLabel + '</b>. '
      + 'En producción se enviará automáticamente a <b>' + EMAIL_SOCIOS + '</b> y <b>' + EMAIL_COMERCIAL + '</b> el día 1 de cada mes.</p>'
      + '<p style="font-size:12px;color:#555;line-height:1.6">El informe incluye:</p>'
      + '<ul style="font-size:12px;color:#555;line-height:1.8">'
      + '<li>📊 <b>Página 1:</b> Resultados generales, promedios históricos, desglose por pregunta y resultados por centro.</li>'
      + '<li>⚠ <b>Página 2:</b> Oportunidades de mejora del mes: notas &lt; 6.0, comentarios asociados y sugerencias Q19.</li>'
      + '</ul>'
      + '<p style="font-size:11px;color:#888;border-top:1px solid #e0e0e0;padding-top:12px;margin-top:16px">'
      + 'Enviado manualmente en modo test · ' + Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm')
      + '</p></div></div>';

    MailApp.sendEmail({
      to:          EMAIL_TEST,
      subject:     asunto,
      htmlBody:    cuerpo,
      attachments: [blob],
    });

    Logger.log('✓ Informe de prueba enviado correctamente a ' + EMAIL_TEST);
    return { success: true, destino: EMAIL_TEST, archivo: fileName };

  } catch(err) {
    Logger.log('✗ ERROR en testEnvioInforme: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

// ────────────────────────────────────────────────────────────────────
//  CONSTRUIR HTML DEL INFORME (2 secciones: General + Oportunidades)
// ────────────────────────────────────────────────────────────────────
function buildInformePDF_() {
  var ss       = SpreadsheetApp.openById(SHEET_ID);
  var sheet    = ss.getSheetByName(SHEET_RESP);
  var lastRow  = sheet.getLastRow();
  var ahora    = new Date();
  var mesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  var mesLabel = formatMes_(mesAnterior);
  var mesKey   = Utilities.formatDate(mesAnterior, Session.getScriptTimeZone(), 'yyyy-MM');

  if (lastRow < 2) {
    return buildHTMLVacio_(mesLabel);
  }

  var rawData = sheet.getRange(2, 1, lastRow - 1, 22).getValues();

  // Parsear todas las filas
  var todas   = [];
  var delMes  = [];

  rawData.forEach(function(row) {
    var novios = String(row[1] || '').trim();
    if (!novios) return;

    var ts = row[0];
    var tsStr = ts instanceof Date
      ? Utilities.formatDate(ts, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
      : String(ts || '');

    var fecha = row[3];
    var fechaStr = '';
    if (fecha instanceof Date) {
      fechaStr = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (fecha) {
      fechaStr = String(fecha).slice(0, 10);
    } else {
      fechaStr = tsStr.slice(0, 10);
    }

    var obj = {
      timestamp: tsStr,
      novios:    novios,
      centro:    String(row[2] || '').trim(),
      fecha:     fechaStr,
      rc_comunicacion:  parseNum_(row[4]),
      rc_respuestas:    parseNum_(row[5]),
      rc_coordinacion:  parseNum_(row[6]),
      rc_flexibilidad:  parseNum_(row[7]),
      rc_cotizacion:    parseNum_(row[8]),
      rc_degustacion:   parseNum_(row[9]),
      rc_comentario:    String(row[10] || '').trim(),
      dec_calidad:      parseNum_(row[11]),
      dec_capacidad:    parseNum_(row[12]),
      dec_cumplimiento: parseNum_(row[13]),
      dec_flexibilidad: parseNum_(row[14]),
      dec_planimetria:  parseNum_(row[15]),
      dec_comentario:   String(row[16] || '').trim(),
      comida:           parseNum_(row[17]),
      comida_comentario:String(row[18] || '').trim(),
      barra:            parseNum_(row[19]),
      barra_comentario: String(row[20] || '').trim(),
      mejoras:          String(row[21] || '').trim(),
    };

    todas.push(obj);
    if (fechaStr.slice(0, 7) === mesKey) delMes.push(obj);
  });

  // Métricas globales
  var gRC   = avgRows_(todas, ['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion']);
  var gDec  = avgRows_(todas, ['dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria']);
  var gFood = avgRows_(todas, ['comida']);
  var gBar  = avgRows_(todas, ['barra']);
  var gAll  = avgRows_(todas, ['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion','dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria','comida','barra']);

  // Métricas del mes
  var mRC   = avgRows_(delMes, ['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion']);
  var mDec  = avgRows_(delMes, ['dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria']);
  var mFood = avgRows_(delMes, ['comida']);
  var mBar  = avgRows_(delMes, ['barra']);
  var mAll  = avgRows_(delMes, ['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion','dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria','comida','barra']);

  // Por centro
  var centros = {};
  todas.forEach(function(r) {
    if (!centros[r.centro]) centros[r.centro] = [];
    centros[r.centro].push(r);
  });

  var nowStr = Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  // ── Construir HTML ─────────────────────────────────────────────
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">';
  html += '<style>';
  html += 'body{font-family:Arial,sans-serif;font-size:11px;color:#222;margin:0;padding:0}';
  html += '.page{width:750px;margin:0 auto;padding:20px}';
  html += '.hdr{background:#2a2a2a;color:#fff;padding:18px 24px;border-radius:6px;margin-bottom:16px}';
  html += '.hdr h1{font-size:18px;margin:0 0 4px;letter-spacing:1px}';
  html += '.hdr p{font-size:10px;color:#aaa;margin:0}';
  html += '.kpi-row{display:flex;gap:10px;margin-bottom:14px}';
  html += '.kpi{flex:1;background:#f5f5f5;border-radius:6px;padding:12px;text-align:center;border-top:4px solid #2a2a2a}';
  html += '.kpi-val{font-size:26px;font-weight:bold;line-height:1}';
  html += '.kpi-lbl{font-size:9px;color:#666;margin-top:3px;font-weight:bold;text-transform:uppercase}';
  html += '.kpi-sub{font-size:8px;color:#aaa;margin-top:2px}';
  html += '.sec-hdr{background:#2a2a2a;color:#fff;padding:7px 12px;border-radius:4px;font-size:10px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin:14px 0 8px}';
  html += '.sec-hdr.red{background:#c0392b}';
  html += '.sec-hdr.rc{background:#34495e}';
  html += '.sec-hdr.dec{background:#1a6b3a}';
  html += '.sec-hdr.food{background:#b7410e}';
  html += '.sec-hdr.bar{background:#1a3a6b}';
  html += 'table{width:100%;border-collapse:collapse;font-size:10px;margin-bottom:10px}';
  html += 'th{background:#2a2a2a;color:#fff;padding:6px 8px;text-align:center}';
  html += 'td{padding:5px 8px;border-bottom:1px solid #e0e0e0;text-align:center}';
  html += 'tr:nth-child(even) td{background:#f9f9f9}';
  html += '.good{color:#27ae60;font-weight:bold}';
  html += '.ok{color:#f39c12;font-weight:bold}';
  html += '.bad{color:#c0392b;font-weight:bold}';
  html += '.alert{background:#fff3cd;border:1px solid #f0c040;border-radius:4px;padding:8px 12px;font-size:10px;color:#7d6608;margin-bottom:10px}';
  html += '.alert.red{background:#fdf2f8;border-color:#c0392b;color:#c0392b}';
  html += '.comment-block{border-left:3px solid #ccc;padding:6px 10px;margin:5px 0;font-size:10px;background:#fafafa}';
  html += '.comment-block.rc{border-left-color:#34495e}';
  html += '.comment-block.dec{border-left-color:#1a6b3a}';
  html += '.comment-block.food{border-left-color:#b7410e}';
  html += '.comment-block.bar{border-left-color:#1a3a6b}';
  html += '.comment-block .meta{font-size:9px;color:#888;margin-bottom:3px}';
  html += '.comment-block .text{font-style:italic;color:#444}';
  html += '.pg-break{page-break-after:always;margin:0;padding:0;height:0}';
  html += '.footer{font-size:8px;color:#aaa;text-align:center;margin-top:20px;border-top:1px solid #e0e0e0;padding-top:8px}';
  html += '.bar-wrap{display:flex;align-items:center;gap:6px;margin:3px 0}';
  html += '.bar-lbl{width:175px;font-size:9px;text-align:right;color:#444;flex-shrink:0}';
  html += '.bar-track{flex:1;height:10px;background:#e0e0e0;border-radius:5px;overflow:hidden}';
  html += '.bar-fill{height:100%;border-radius:5px}';
  html += '.bar-val{width:28px;font-size:9px;font-weight:bold;text-align:right}';
  html += '</style></head><body><div class="page">';

  // ════════════════════════ PÁGINA 1: GENERAL ════════════════════
  html += '<div class="hdr">';
  html += '<h1>Experiencia Tinto · Informe Mensual Novios</h1>';
  html += '<p>Período: <b>' + mesLabel + '</b> &nbsp;·&nbsp; Total histórico: <b>' + todas.length + ' evaluaciones</b> &nbsp;·&nbsp; Generado: ' + nowStr + '</p>';
  html += '</div>';

  // KPIs globales
  html += '<div style="font-size:10px;color:#666;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Promedios Históricos</div>';
  html += '<div class="kpi-row">';
  html += kpiBox_('Global', gAll, '#2a2a2a', 'Todas las categorías');
  html += kpiBox_('Rel. Comercial', gRC, '#34495e', 'Q2 – Q7');
  html += kpiBox_('Decoración', gDec, '#1a6b3a', 'Q9 – Q13');
  html += kpiBox_('Comida', gFood, '#b7410e', 'Q15');
  html += kpiBox_('Servicio & Barra', gBar, '#1a3a6b', 'Q17');
  html += '</div>';

  // Alertas globales
  var alertas = buildAlertas_(gRC, gDec, gFood, gBar, 'Historial completo');
  if (alertas) html += alertas;

  // Desglose por pregunta (barras)
  html += '<div class="sec-hdr">Desglose por Pregunta · Historial Completo</div>';
  var preguntas = [
    {lbl:'Comunicación planificación', keys:['rc_comunicacion'], col:'#34495e'},
    {lbl:'Respuestas rápidas',          keys:['rc_respuestas'],   col:'#34495e'},
    {lbl:'Coordinación detalles',       keys:['rc_coordinacion'], col:'#34495e'},
    {lbl:'Flexibilidad servicios',      keys:['rc_flexibilidad'], col:'#34495e'},
    {lbl:'Experiencia cotización',      keys:['rc_cotizacion'],   col:'#34495e'},
    {lbl:'Proceso degustación',         keys:['rc_degustacion'],  col:'#34495e'},
    {lbl:'Calidad decoración',          keys:['dec_calidad'],     col:'#1a6b3a'},
    {lbl:'Escucha en decoración',       keys:['dec_capacidad'],   col:'#1a6b3a'},
    {lbl:'Cumplimiento decoración',     keys:['dec_cumplimiento'],col:'#1a6b3a'},
    {lbl:'Flexibilidad decoración',     keys:['dec_flexibilidad'],col:'#1a6b3a'},
    {lbl:'Planimetría',                 keys:['dec_planimetria'], col:'#1a6b3a'},
    {lbl:'Comida (cóctel → bajón)',     keys:['comida'],           col:'#b7410e'},
    {lbl:'Servicio y Barra',            keys:['barra'],            col:'#1a3a6b'},
  ];
  preguntas.forEach(function(p) {
    var v = avgRows_(todas, p.keys);
    var pct = v ? Math.round((v/7)*100) : 0;
    var textCol = scoreColor_(v);
    html += '<div class="bar-wrap">';
    html += '<div class="bar-lbl">' + p.lbl + '</div>';
    html += '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:' + p.col + '"></div></div>';
    html += '<div class="bar-val" style="color:' + textCol + '">' + fmtV_(v) + '</div>';
    html += '</div>';
  });

  // Tabla por centro
  html += '<div class="sec-hdr">Resultados por Centro de Eventos</div>';
  html += '<table><thead><tr>';
  html += '<th style="text-align:left">Centro</th><th>Eval.</th>';
  html += '<th>Rel.Com.</th><th>Decoración</th><th>Comida</th><th>Barra</th><th>Global</th><th>Estado</th>';
  html += '</tr></thead><tbody>';
  Object.keys(centros).sort().forEach(function(c) {
    var rs = centros[c];
    var vRC   = avgRows_(rs,['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion']);
    var vDec  = avgRows_(rs,['dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria']);
    var vFood = avgRows_(rs,['comida']);
    var vBar  = avgRows_(rs,['barra']);
    var vAll  = avgRows_(rs,['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion','dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria','comida','barra']);
    html += '<tr>';
    html += '<td style="text-align:left"><b>' + c + '</b></td>';
    html += '<td>' + rs.length + '</td>';
    html += '<td class="' + scoreClass_(vRC)   + '">' + fmtV_(vRC)   + '</td>';
    html += '<td class="' + scoreClass_(vDec)  + '">' + fmtV_(vDec)  + '</td>';
    html += '<td class="' + scoreClass_(vFood) + '">' + fmtV_(vFood) + '</td>';
    html += '<td class="' + scoreClass_(vBar)  + '">' + fmtV_(vBar)  + '</td>';
    html += '<td class="' + scoreClass_(vAll)  + '" style="font-size:12px"><b>' + fmtV_(vAll) + '</b></td>';
    html += '<td class="' + scoreClass_(vAll)  + '">' + scoreLbl_(vAll) + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table>';

  html += '<div class="footer">Tinto Banquetería · ' + nowStr + ' · Continúa en página 2</div>';

  // ════════════════════════ PÁGINA 2: OPORTUNIDADES ═════════════
  html += '<div class="pg-break"></div>';

  html += '<div class="hdr" style="background:#c0392b">';
  html += '<h1>Oportunidades de Mejora · ' + mesLabel + '</h1>';
  html += '<p>Notas &lt; 6.0 y comentarios asociados &nbsp;·&nbsp; <b>' + delMes.length + ' evaluaciones</b> en el período</p>';
  html += '</div>';

  // KPIs del mes
  html += '<div style="font-size:10px;color:#666;font-weight:bold;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px">Promedios del Mes</div>';
  html += '<div class="kpi-row">';
  html += kpiBox_('Global Mes', mAll, '#2a2a2a', delMes.length + ' evaluaciones');
  html += kpiBox_('Rel. Comercial', mRC, '#34495e', 'Mes actual');
  html += kpiBox_('Decoración', mDec, '#1a6b3a', 'Mes actual');
  html += kpiBox_('Comida', mFood, '#b7410e', 'Mes actual');
  html += kpiBox_('Servicio & Barra', mBar, '#1a3a6b', 'Mes actual');
  html += '</div>';

  var alertasMes = buildAlertas_(mRC, mDec, mFood, mBar, mesLabel);
  if (alertasMes) html += alertasMes;

  if (delMes.length === 0) {
    html += '<div class="alert">No hay evaluaciones registradas para ' + mesLabel + '.</div>';
  } else {

    // Tabla detallada de todas las evaluaciones del mes
    html += '<div class="sec-hdr red">Detalle por Evaluación · ' + mesLabel + '</div>';
    html += '<table><thead><tr>';
    html += '<th style="text-align:left">Novios</th><th>Centro</th><th>Fecha</th>';
    html += '<th>RC</th><th>Dec.</th><th>Comida</th><th>Barra</th><th>Global</th>';
    html += '</tr></thead><tbody>';
    delMes.forEach(function(r) {
      var vRC_r   = avgRows_([r],['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion']);
      var vDec_r  = avgRows_([r],['dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria']);
      var vFood_r = avgRows_([r],['comida']);
      var vBar_r  = avgRows_([r],['barra']);
      var vAll_r  = avgRows_([r],['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion','dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria','comida','barra']);
      html += '<tr>';
      html += '<td style="text-align:left"><b>' + r.novios + '</b></td>';
      html += '<td style="font-size:9px">' + (r.centro || '') + '</td>';
      html += '<td>' + r.fecha + '</td>';
      html += '<td class="' + scoreClass_(vRC_r)   + '">' + fmtV_(vRC_r)   + '</td>';
      html += '<td class="' + scoreClass_(vDec_r)  + '">' + fmtV_(vDec_r)  + '</td>';
      html += '<td class="' + scoreClass_(vFood_r) + '">' + fmtV_(vFood_r) + '</td>';
      html += '<td class="' + scoreClass_(vBar_r)  + '">' + fmtV_(vBar_r)  + '</td>';
      html += '<td class="' + scoreClass_(vAll_r)  + '"><b>' + fmtV_(vAll_r) + '</b></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';

    // Preguntas con < 6 en el mes
    html += '<div class="sec-hdr red">Preguntas con Nota Promedio &lt; 6.0 este Mes</div>';
    var lowQ = preguntas.filter(function(p){ return (avgRows_(delMes,p.keys)||7) < NOTA_MIN; });
    if (lowQ.length === 0) {
      html += '<div class="alert" style="background:#d5f5e3;border-color:#27ae60;color:#1a6b3a">✓ Todas las preguntas tienen promedio ≥ 6.0 este mes. ¡Excelente!</div>';
    } else {
      lowQ.forEach(function(p) {
        var v = avgRows_(delMes, p.keys);
        var pct = v ? Math.round((v/7)*100) : 0;
        html += '<div class="bar-wrap">';
        html += '<div class="bar-lbl">' + p.lbl + '</div>';
        html += '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%;background:#c0392b"></div></div>';
        html += '<div class="bar-val bad">' + fmtV_(v) + '</div>';
        html += '</div>';
      });
    }

    // Comentarios asociados a notas bajas
    var catDefs = [
      {name:'Relación Comercial', keys:['rc_comunicacion','rc_respuestas','rc_coordinacion','rc_flexibilidad','rc_cotizacion','rc_degustacion'], comKey:'rc_comentario', cls:'rc', avg:mRC},
      {name:'Decoración',         keys:['dec_calidad','dec_capacidad','dec_cumplimiento','dec_flexibilidad','dec_planimetria'], comKey:'dec_comentario', cls:'dec', avg:mDec},
      {name:'Comida',             keys:['comida'], comKey:'comida_comentario', cls:'food', avg:mFood},
      {name:'Servicio y Barra',   keys:['barra'],  comKey:'barra_comentario',  cls:'bar',  avg:mBar},
    ];

    html += '<div class="sec-hdr red">Comentarios Asociados a Notas &lt; 6.0</div>';
    var hayComentarios = false;
    catDefs.forEach(function(cat) {
      if (cat.avg && cat.avg >= NOTA_MIN) return;
      var badRows = delMes.filter(function(r){
        return (avgRows_([r], cat.keys)||7) < NOTA_MIN && r[cat.comKey];
      });
      if (!badRows.length) return;
      hayComentarios = true;
      html += '<div style="font-size:10px;font-weight:bold;color:#fff;background:';
      var bgMap = {rc:'#34495e',dec:'#1a6b3a',food:'#b7410e',bar:'#1a3a6b'};
      html += bgMap[cat.cls] + ';padding:5px 10px;border-radius:3px;margin:8px 0 4px">';
      html += cat.name + '  ·  Promedio mes: ' + fmtV_(cat.avg) + '</div>';
      badRows.slice(0,6).forEach(function(r) {
        var v = avgRows_([r], cat.keys);
        html += '<div class="comment-block ' + cat.cls + '">';
        html += '<div class="meta"><b>' + r.novios + '</b> · ' + r.centro + ' · ' + r.fecha + ' → Nota: <b class="bad">' + fmtV_(v) + '</b></div>';
        html += '<div class="text">"' + r[cat.comKey] + '"</div>';
        html += '</div>';
      });
    });
    if (!hayComentarios) {
      html += '<div class="alert" style="background:#d5f5e3;border-color:#27ae60;color:#1a6b3a">✓ No se registraron comentarios en notas bajas este mes.</div>';
    }

    // Mejoras generales Q19
    html += '<div class="sec-hdr">Sugerencias de Mejora · Q19</div>';
    var mejRows = delMes.filter(function(r){ return r.mejoras; });
    if (!mejRows.length) {
      html += '<p style="font-size:10px;color:#888">No hay sugerencias de mejora este período.</p>';
    } else {
      mejRows.forEach(function(r) {
        html += '<div class="comment-block" style="border-left-color:#555">';
        html += '<div class="meta"><b>' + r.novios + '</b> · ' + r.centro + ' · ' + r.fecha + '</div>';
        html += '<div class="text">"' + r.mejoras + '"</div>';
        html += '</div>';
      });
    }
  }

  html += '<div class="footer">Tinto Banquetería · Informe generado automáticamente · socios@tintobanqueteria.cl · comercial@tintobanqueteria.cl · ' + nowStr + '</div>';
  html += '</div></body></html>';

  return html;
}

// ────────────────────────────────────────────────────────────────────
//  GENERAR PDF DESDE HTML
// ────────────────────────────────────────────────────────────────────
function generarPDF_(htmlContent) {
  // Crear un doc de Google Docs temporal para convertir a PDF
  var tmpDoc  = DocumentApp.create('_informe_tmp_novios');
  var body    = tmpDoc.getBody();
  body.clear();

  // Guardamos el HTML en un archivo Drive temporal y lo convertimos
  var tmpFile = DriveApp.createFile(
    'informe_tmp.html',
    htmlContent,
    MimeType.HTML
  );

  // Convertir HTML → PDF usando Drive API
  var pdfBlob = tmpFile.getAs(MimeType.PDF);

  // Limpiar temporales
  tmpFile.setTrashed(true);
  DriveApp.getFileById(tmpDoc.getId()).setTrashed(true);

  return pdfBlob;
}

// ────────────────────────────────────────────────────────────────────
//  CUERPO DEL EMAIL HTML
// ────────────────────────────────────────────────────────────────────
function buildEmailBody_(mesLabel) {
  return '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">'
    + '<div style="background:#2a2a2a;color:#fff;padding:20px;border-radius:6px 6px 0 0">'
    + '<h2 style="margin:0;font-size:18px">Informe Mensual · Experiencia Novios</h2>'
    + '<p style="margin:4px 0 0;font-size:11px;color:#aaa">Tinto Banquetería · ' + mesLabel + '</p>'
    + '</div>'
    + '<div style="border:1px solid #e0e0e0;border-top:none;padding:20px;background:#fafafa">'
    + '<p style="font-size:13px;color:#333">Estimado equipo,</p>'
    + '<p style="font-size:12px;color:#555;line-height:1.6">Adjunto encontrarán el informe mensual de experiencia de novios correspondiente a <b>' + mesLabel + '</b>.</p>'
    + '<p style="font-size:12px;color:#555;line-height:1.6">El informe incluye:</p>'
    + '<ul style="font-size:12px;color:#555;line-height:1.8">'
    + '<li>📊 <b>Página 1:</b> Resultados generales, promedios históricos, desglose por pregunta y resultados por centro.</li>'
    + '<li>⚠ <b>Página 2:</b> Oportunidades de mejora del mes: notas &lt; 6.0, comentarios asociados y sugerencias Q19.</li>'
    + '</ul>'
    + '<p style="font-size:11px;color:#888;border-top:1px solid #e0e0e0;padding-top:12px;margin-top:16px">'
    + 'Este correo fue generado automáticamente el primer día del mes por el sistema de evaluaciones Tinto Banquetería.</p>'
    + '</div>'
    + '</div>';
}

// ────────────────────────────────────────────────────────────────────
//  HELPERS
// ────────────────────────────────────────────────────────────────────
function parseNum_(v) {
  if (v === '' || v === null || v === undefined) return null;
  var n = parseFloat(v);
  return isNaN(n) ? null : n;
}

function avgRows_(rows, keys) {
  var vals = [];
  rows.forEach(function(r) {
    keys.forEach(function(k) {
      var v = r[k];
      if (typeof v === 'number' && !isNaN(v)) vals.push(v);
    });
  });
  return vals.length ? Math.round(vals.reduce(function(s,v){return s+v},0)/vals.length*100)/100 : null;
}

function fmtV_(v) {
  return v !== null && v !== undefined ? v.toFixed(1) : '—';
}

function scoreColor_(v) {
  if (!v) return '#888';
  if (v >= 6) return '#27ae60';
  if (v >= 4) return '#f39c12';
  return '#c0392b';
}

function scoreClass_(v) {
  if (!v) return '';
  if (v >= 6) return 'good';
  if (v >= 4) return 'ok';
  return 'bad';
}

function scoreLbl_(v) {
  if (!v) return '—';
  if (v >= 6) return 'Excelente';
  if (v >= 5) return 'Bueno';
  if (v >= 4) return 'Regular';
  return 'Por mejorar';
}

function kpiBox_(label, value, borderColor, sub) {
  var col = scoreColor_(value);
  return '<div class="kpi" style="border-top-color:' + borderColor + '">'
    + '<div class="kpi-val" style="color:' + col + '">' + fmtV_(value) + '</div>'
    + '<div style="font-size:9px;color:#aaa">/ 7.0</div>'
    + '<div class="kpi-lbl">' + label + '</div>'
    + '<div class="kpi-sub">' + sub + '</div>'
    + '</div>';
}

function buildAlertas_(rc, dec, food, bar, periodo) {
  var low = [];
  if (rc   && rc   < NOTA_MIN) low.push('Rel. Comercial: ' + fmtV_(rc));
  if (dec  && dec  < NOTA_MIN) low.push('Decoración: ' + fmtV_(dec));
  if (food && food < NOTA_MIN) low.push('Comida: ' + fmtV_(food));
  if (bar  && bar  < NOTA_MIN) low.push('Barra: ' + fmtV_(bar));
  if (!low.length) return '';
  return '<div class="alert">⚠ <b>Áreas bajo el umbral óptimo (< ' + NOTA_MIN + '.0) · ' + periodo + ':</b> '
    + low.join(' &nbsp;·&nbsp; ') + '</div>';
}

function buildHTMLVacio_(mesLabel) {
  return '<html><body style="font-family:Arial;padding:30px">'
    + '<h2>Informe ' + mesLabel + ' · Tinto Banquetería</h2>'
    + '<p>No hay evaluaciones registradas para este período.</p>'
    + '</body></html>';
}

function formatMes_(date) {
  var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return meses[date.getMonth()] + ' ' + date.getFullYear();
}

function formatMesArchivo_(date) {
  var m = date.getMonth() + 1;
  return date.getFullYear() + '_' + (m < 10 ? '0'+m : m);
}