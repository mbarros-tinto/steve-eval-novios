// ═══════════════════════════════════════════════════════════════════
//  Tinto Banquetería · Experiencia Novios — Backend (JSON API)
//
//  Frontends (Cloudflare Pages):
//    - feedback.tintobanqueteria.cl     → formulario (público para novios)
//    - evaluacion.tintobanqueteria.cl   → dashboard interno
//
//  Backend: este script (bound al Sheet Evaluacion_Novios).
//  Deployment: Web App, executeAs=USER_DEPLOYING, access=ANYONE_ANONYMOUS.
//
//  Endpoints:
//    GET  ?action=centros               → { ok, centros: [...] }
//    GET  ?action=respuestas            → { ok, rows: [...] }
//    POST { action:'registrar', data }  → { ok, mensaje }
//    POST { action:'centros' }          → { ok, centros }
//    POST { action:'respuestas' }       → { ok, rows }
//
//  ESTRUCTURA HOJA "Respuestas Novios" (fila 1 = headers):
//    A  Timestamp            L  dec_calidad       (Q9)
//    B  novios               M  dec_capacidad     (Q10)
//    C  centro               N  dec_cumplimiento  (Q11)
//    D  fecha                O  dec_flexibilidad  (Q12)
//    E  rc_comunicacion (Q2) P  dec_planimetria   (Q13)
//    F  rc_respuestas   (Q3) Q  dec_comentario    (Q14)
//    G  rc_coordinacion (Q4) R  comida            (Q15)
//    H  rc_flexibilidad (Q5) S  comida_comentario (Q16)
//    I  rc_cotizacion   (Q6) T  barra             (Q17)
//    J  rc_degustacion  (Q7) U  barra_comentario  (Q18)
//    K  rc_comentario   (Q8) V  mejoras           (Q19)
//
//  ESTRUCTURA HOJA "Aux":
//    Col A = centros (lista)
// ═══════════════════════════════════════════════════════════════════

var SHEET_ID   = '1VdcezrZOSO03X_1-Njl4Mrz4kdAcYZqZmuzDI4MXpHI';
var SHEET_RESP = 'Respuestas Novios';
var SHEET_AUX  = 'Aux';

// ── Routing ──────────────────────────────────────────────────────────
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'health';
  try {
    if (action === 'centros')    return _json({ ok: true, centros: _getCentros() });
    if (action === 'respuestas') return _json({ ok: true, rows: _getRespuestas() });
    return _json({
      ok: true,
      service: 'eval-novios',
      endpoints: {
        get:  ['?action=centros', '?action=respuestas'],
        post: ['{action:"registrar", data:{...}}']
      }
    });
  } catch (err) {
    return _json({ ok: false, error: 'INTERNAL', mensaje: String(err && err.message || err) });
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = e.parameter || {}; }
    } else if (e && e.parameter) {
      body = e.parameter;
    }
    var action = body.action || 'registrar';

    if (action === 'registrar')  return _json(_registrarRespuesta(body.data || body));
    if (action === 'centros')    return _json({ ok: true, centros: _getCentros() });
    if (action === 'respuestas') return _json({ ok: true, rows: _getRespuestas() });

    return _json({ ok: false, error: 'UNKNOWN_ACTION', action: action });
  } catch (err) {
    return _json({ ok: false, error: 'INTERNAL', mensaje: String(err && err.message || err) });
  }
}

function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════════════════════════════════
//  AUX — Centros para el formulario
// ════════════════════════════════════════════════════════════════════
function _getCentros() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_AUX);
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var data = sh.getRange(2, 1, lastRow - 1, 1).getValues();
  var seen = {};
  data.forEach(function(r) {
    var c = String(r[0] || '').trim();
    if (c) seen[c] = true;
  });
  return Object.keys(seen).sort(function(a, b) { return a.localeCompare(b, 'es'); });
}

// alias legacy para compatibilidad con posibles llamadas bound
function getCentrosNovios() { return { centros: _getCentros() }; }

// ════════════════════════════════════════════════════════════════════
//  REGISTRAR RESPUESTA
// ════════════════════════════════════════════════════════════════════
function _registrarRespuesta(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_RESP);
  if (!sh) return { ok: false, error: 'SHEET_NOT_FOUND' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sh.appendRow([
      new Date(),                         // A
      data.novios            || '',       // B
      data.centro            || '',       // C
      data.fecha             || '',       // D
      _toNum(data.rc_comunicacion),       // E
      _toNum(data.rc_respuestas),         // F
      _toNum(data.rc_coordinacion),       // G
      _toNum(data.rc_flexibilidad),       // H
      _toNum(data.rc_cotizacion),         // I
      _toNum(data.rc_degustacion),        // J
      data.rc_comentario     || '',       // K
      _toNum(data.dec_calidad),           // L
      _toNum(data.dec_capacidad),         // M
      _toNum(data.dec_cumplimiento),      // N
      _toNum(data.dec_flexibilidad),      // O
      _toNum(data.dec_planimetria),       // P
      data.dec_comentario    || '',       // Q
      _toNum(data.comida),                // R
      data.comida_comentario || '',       // S
      _toNum(data.barra),                 // T
      data.barra_comentario  || '',       // U
      data.mejoras           || '',       // V
    ]);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
  return { ok: true, success: true, mensaje: 'Evaluación registrada correctamente.' };
}

function registrarRespuestaNovios(data) { return _registrarRespuesta(data); }

// ════════════════════════════════════════════════════════════════════
//  OBTENER RESPUESTAS (Dashboard)
// ════════════════════════════════════════════════════════════════════
function _getRespuestas() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sh = ss.getSheetByName(SHEET_RESP);
  if (!sh) return [];
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return [];

  var data = sh.getRange(2, 1, lastRow - 1, 22).getValues();
  var out = [];
  data.forEach(function(row) {
    var novios = String(row[1] || '').trim();
    if (!novios) return;

    function rNum(i) {
      var v = row[i];
      if (v === '' || v === null || v === undefined) return null;
      var n = parseFloat(v);
      return isNaN(n) ? null : n;
    }
    function rStr(i) {
      var v = row[i];
      return (v === undefined || v === null) ? '' : String(v).trim();
    }

    var ts = row[0];
    var tsStr = (ts instanceof Date)
      ? Utilities.formatDate(ts, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm')
      : String(ts || '');
    var fecha = row[3];
    var fechaStr = (fecha instanceof Date)
      ? Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : (fecha ? String(fecha).slice(0, 10) : '');

    out.push({
      timestamp:         tsStr,
      novios:            novios,
      centro:            rStr(2),
      fecha:             fechaStr || tsStr.slice(0, 10),
      rc_comunicacion:   rNum(4),
      rc_respuestas:     rNum(5),
      rc_coordinacion:   rNum(6),
      rc_flexibilidad:   rNum(7),
      rc_cotizacion:     rNum(8),
      rc_degustacion:    rNum(9),
      rc_comentario:     rStr(10),
      dec_calidad:       rNum(11),
      dec_capacidad:     rNum(12),
      dec_cumplimiento:  rNum(13),
      dec_flexibilidad:  rNum(14),
      dec_planimetria:   rNum(15),
      dec_comentario:    rStr(16),
      comida:            rNum(17),
      comida_comentario: rStr(18),
      barra:             rNum(19),
      barra_comentario:  rStr(20),
      mejoras:           rStr(21),
    });
  });

  out.sort(function(a, b) {
    return (b.fecha || b.timestamp).localeCompare(a.fecha || a.timestamp);
  });
  return out;
}

function getRespuestasNovios() { return _getRespuestas(); }

// ════════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════════
function _toNum(v) {
  if (v === '' || v === null || v === undefined) return '';
  var n = parseFloat(v);
  return isNaN(n) ? '' : n;
}
function toNum(v) { return _toNum(v); }

// ════════════════════════════════════════════════════════════════════
//  TEST (ejecutar manualmente desde el editor)
// ════════════════════════════════════════════════════════════════════
function testNovios() {
  Logger.log('centros: ' + _getCentros().join(', '));
  var rows = _getRespuestas();
  Logger.log('respuestas: ' + rows.length);
  if (rows.length) {
    Logger.log('última: ' + rows[0].novios + ' | ' + rows[0].centro + ' | ' + rows[0].fecha);
  }
}

function autorizar() {
  // Ejecutar una vez desde el editor para otorgar scopes de SpreadsheetApp
  SpreadsheetApp.openById(SHEET_ID).getSheets()[0].getName();
  Logger.log('Autorización OK');
}
