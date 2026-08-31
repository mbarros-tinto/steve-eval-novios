// ===================================================================
// Gate de login Google contra feedback-api (login / usuarioActual).
// Mismo patron que bonos-web: el portal muestra nombres de clientes y
// evaluaciones internas — antes estaba abierto a Internet.
// Requiere en la pagina: window.WORKER_URL, window.OAUTH_CLIENT_ID,
// un overlay #fb-login con #fb-login-boton y #fb-login-error, y
// opcionalmente #topbarUser. Emite 'feedback:sesion-lista' al entrar.
// ===================================================================
(function () {
  var CLAVE = 'feedback_jwt';

  window.feedbackToken = function () { return localStorage.getItem(CLAVE) || ''; };
  function guardarToken(t) {
    if (t) localStorage.setItem(CLAVE, t);
    else localStorage.removeItem(CLAVE);
  }

  function overlay() { return document.getElementById('fb-login'); }

  function mostrarLogin(msg) {
    overlay().style.display = 'flex';
    var err = document.getElementById('fb-login-error');
    if (err) {
      err.textContent = msg || '';
      err.style.display = msg ? 'block' : 'none';
    }
    var gsi = function () {
      if (!window.google || !google.accounts) { setTimeout(gsi, 200); return; }
      google.accounts.id.initialize({
        client_id: window.OAUTH_CLIENT_ID,
        callback: function (resp) {
          fetch(window.WORKER_URL + '?action=login', {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // simple request, sin preflight
            body: JSON.stringify({ action: 'login', idToken: resp.credential }),
          })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (!j.ok) throw new Error(j.mensaje || j.error || 'Login rechazado');
              guardarToken(j.token);
              sesionLista(j.usuario);
            })
            .catch(function (e) { mostrarLogin(e.message); });
        },
      });
      google.accounts.id.renderButton(document.getElementById('fb-login-boton'),
        { theme: 'outline', size: 'large', text: 'signin_with' });
    };
    gsi();
  }

  function sesionLista(usuario) {
    overlay().style.display = 'none';
    window.CURRENT_USER = usuario || {};
    var tb = document.getElementById('topbarUser');
    if (tb) tb.textContent = (usuario && (usuario.nombre || usuario.email)) || '—';
    document.dispatchEvent(new Event('feedback:sesion-lista'));
  }

  window.addEventListener('feedback:sesion-perdida', function () {
    guardarToken('');
    mostrarLogin('La sesión expiró. Entra de nuevo.');
  });

  // ── Capa API con el token: la usan todas las paginas del portal ──
  window.fbGet = function (action, params) {
    var qs = new URLSearchParams(Object.assign({ action: action, token: window.feedbackToken() }, params || {}));
    return fetch(window.WORKER_URL + '?' + qs.toString())
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok && (j.error === 'AUTH_REQUIRED' || j.error === 'FORBIDDEN')) {
          window.dispatchEvent(new Event('feedback:sesion-perdida'));
          throw new Error(j.mensaje || 'Sesión expirada');
        }
        return j;
      });
  };
  window.fbPost = function (action, body) {
    return fetch(window.WORKER_URL, {
      method: 'POST',
      body: JSON.stringify(Object.assign({ action: action, token: window.feedbackToken() }, body || {})),
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok && (j.error === 'AUTH_REQUIRED' || j.error === 'FORBIDDEN')) {
          window.dispatchEvent(new Event('feedback:sesion-perdida'));
          throw new Error(j.mensaje || 'Sesión expirada');
        }
        return j;
      });
  };

  document.addEventListener('DOMContentLoaded', function () {
    // Entrada por token firmado en el link (?t=...): puerta de emergencia si
    // Google falla y camino de prueba sin OAuth (mismo secreto y expiración
    // que una sesión normal). Se borra de la barra apenas se guarda.
    var m = location.search.match(/[?&]t=([^&]+)/);
    if (m) {
      localStorage.setItem(CLAVE, decodeURIComponent(m[1]));
      history.replaceState(null, '', location.pathname);
    }
    var t = window.feedbackToken();
    if (!t) { mostrarLogin(); return; }
    fetch(window.WORKER_URL + '?action=usuarioActual&token=' + encodeURIComponent(t))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) sesionLista(j.usuario);
        else { guardarToken(''); mostrarLogin(); }
      })
      .catch(function () { mostrarLogin('Sin conexión con el servidor. Reintenta.'); });
  });
})();
