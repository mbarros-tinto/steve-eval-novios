// ═══════════════════════════════════════════════════════════════════
//  Tinto Banquetería · Experiencia Novios v1.0
//  Code_Novios.gs — Google Apps Script Backend
//
//  CONFIGURACIÓN:
//  1. Reemplaza SHEET_ID con el ID de tu Google Sheet (Evaluacion_Novios)
//  2. Sube al proyecto los archivos:
//       formulario_novios.html
//       visualizador_novios.html
//  3. Despliega como Web App:
//       Ejecutar como: Yo  /  Acceso: Cualquier persona con el vínculo
//  4. Cada vez que cambies el código: Desplegar > Administrar despliegues >
//     editar (lápiz) > Versión: Nueva versión > Guardar
//
//  ESTRUCTURA HOJA "Respuestas Novios" (headers en fila 1):
//  A  = Timestamp
//  B  = novios
//  C  = centro
//  D  = fecha
//  E  = rc_comunicacion   (Q2)
//  F  = rc_respuestas     (Q3)
//  G  = rc_coordinacion   (Q4)
//  H  = rc_flexibilidad   (Q5)
//  I  = rc_cotizacion     (Q6)
//  J  = rc_degustacion    (Q7)
//  K  = rc_comentario     (Q8)
//  L  = dec_calidad       (Q9)
//  M  = dec_capacidad     (Q10)
//  N  = dec_cumplimiento  (Q11)
//  O  = dec_flexibilidad  (Q12)
//  P  = dec_planimetria   (Q13)
//  Q  = dec_comentario    (Q14)
//  R  = comida            (Q15)
//  S  = comida_comentario (Q16)
//  T  = barra             (Q17)
//  U  = barra_comentario  (Q18)
//  V  = mejoras           (Q19)
//
//  ESTRUCTURA HOJA "Aux":
//  Col A = lista de centros
//  Col B = nombre novios/evento
//  Col C = código evento ("NombreCentro DD/MM/YYYY")
// ═══════════════════════════════════════════════════════════════════

var SHEET_ID      = '1VdcezrZOSO03X_1-Njl4Mrz4kdAcYZqZmuzDI4MXpHI';  // ← REEMPLAZAR
var SHEET_RESP    = 'Respuestas Novios';
var SHEET_AUX     = 'Aux';

// ── Routing ──────────────────────────────────────────────────────────
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'formulario';
  var file = (page === 'dashboard') ? 'visualizador_novios' : 'formulario_novios';
  return HtmlService
    .createHtmlOutputFromFile(file)
    .setTitle(page === 'dashboard'
      ? 'Dashboard Novios · Tinto Banquetería'
      : 'Experiencia Tinto · Formulario Novios')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ════════════════════════════════════════════════════════════════════
//  AUX — Centros para el formulario
// ════════════════════════════════════════════════════════════════════
function getCentrosNovios() {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_AUX);
    if (!sheet) return { centros: [], error: 'Hoja Aux no encontrada' };

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return { centros: [] };

    // Lee col A (centros) y col B (nombres) para evitar duplicados
    var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    var centroSet = {};
    data.forEach(function(row) {
      var c = String(row[0] || '').trim();
      if (c) centroSet[c] = true;
    });

    var centros = Object.keys(centroSet).sort(function(a, b) {
      return a.localeCompare(b, 'es');
    });

    return { centros: centros };

  } catch(err) {
    Logger.log('getCentrosNovios ERROR: ' + err.toString());
    return { centros: [], error: err.toString() };
  }
}

// ════════════════════════════════════════════════════════════════════
//  REGISTRAR RESPUESTA DE NOVIOS
// ════════════════════════════════════════════════════════════════════
function registrarRespuestaNovios(data) {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_RESP);
    if (!sheet) throw new Error('Hoja "' + SHEET_RESP + '" no encontrada');

    var row = [
      new Date(),                         // A  timestamp
      data.novios           || '',        // B
      data.centro           || '',        // C
      data.fecha            || '',        // D
      toNum(data.rc_comunicacion),        // E  Q2
      toNum(data.rc_respuestas),          // F  Q3
      toNum(data.rc_coordinacion),        // G  Q4
      toNum(data.rc_flexibilidad),        // H  Q5
      toNum(data.rc_cotizacion),          // I  Q6
      toNum(data.rc_degustacion),         // J  Q7
      data.rc_comentario    || '',        // K  Q8
      toNum(data.dec_calidad),            // L  Q9
      toNum(data.dec_capacidad),          // M  Q10
      toNum(data.dec_cumplimiento),       // N  Q11
      toNum(data.dec_flexibilidad),       // O  Q12
      toNum(data.dec_planimetria),        // P  Q13
      data.dec_comentario   || '',        // Q  Q14
      toNum(data.comida),                 // R  Q15
      data.comida_comentario|| '',        // S  Q16
      toNum(data.barra),                  // T  Q17
      data.barra_comentario || '',        // U  Q18
      data.mejoras          || '',        // V  Q19
    ];

    sheet.appendRow(row);
    return { success: true };

  } catch(err) {
    Logger.log('registrarRespuestaNovios ERROR: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

// ════════════════════════════════════════════════════════════════════
//  OBTENER RESPUESTAS (para el Dashboard)
//  Retorna array de objetos con todas las respuestas
// ════════════════════════════════════════════════════════════════════
function getRespuestasNovios() {
  try {
    var ss    = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_RESP);
    if (!sheet) return [];

    var lastRow = sheet.getLastRow();
    Logger.log('getRespuestasNovios - lastRow: ' + lastRow);
    if (lastRow < 2) return [];

    var data = sheet.getRange(2, 1, lastRow - 1, 22).getValues();

    var result = [];
    data.forEach(function(row) {
      var novios = String(row[1] || '').trim();
      if (!novios) return; // skip empty rows

      function rNum(idx) {
        var v = row[idx];
        if (v === '' || v === null || v === undefined) return null;
        var n = parseFloat(v);
        return isNaN(n) ? null : n;
      }
      function rStr(idx) {
        var v = row[idx];
        return (v === undefined || v === null) ? '' : String(v).trim();
      }

      // Format timestamp
      var ts = row[0];
      var tsStr = '';
      if (ts instanceof Date) {
        tsStr = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
      } else {
        tsStr = String(ts || '');
      }

      // Format fecha
      var fecha = row[3];
      var fechaStr = '';
      if (fecha instanceof Date) {
        fechaStr = Utilities.formatDate(fecha, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      } else if (fecha) {
        fechaStr = String(fecha).slice(0, 10);
      }

      result.push({
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

    // Sort by fecha DESC
    result.sort(function(a, b) {
      return (b.fecha || b.timestamp).localeCompare(a.fecha || a.timestamp);
    });

    Logger.log('getRespuestasNovios: retornando ' + result.length + ' filas');
    return result;

  } catch(err) {
    Logger.log('getRespuestasNovios ERROR: ' + err.toString());
    throw err;
  }
}

// ════════════════════════════════════════════════════════════════════
//  HELPER
// ════════════════════════════════════════════════════════════════════
function toNum(val) {
  if (val === '' || val === null || val === undefined) return '';
  var n = parseFloat(val);
  return isNaN(n) ? '' : n;
}

// ════════════════════════════════════════════════════════════════════
//  TEST
// ════════════════════════════════════════════════════════════════════
function testNovios() {
  Logger.log('=== TEST getCentrosNovios ===');
  var aux = getCentrosNovios();
  Logger.log('Centros: ' + aux.centros.join(', '));

  Logger.log('\n=== TEST getRespuestasNovios ===');
  var resp = getRespuestasNovios();
  Logger.log('Respuestas: ' + resp.length);
  if (resp.length > 0) {
    var first = resp[0];
    Logger.log('Primera: ' + first.novios + ' | ' + first.centro + ' | ' + first.fecha);
    Logger.log('Comida: ' + first.comida + ' | Barra: ' + first.barra);
  }
}