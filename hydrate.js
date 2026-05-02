/* eslint-disable */
/**
 * hydrate.js — runtime CMS content swapper.
 *
 * Reads window.__CMS_SITE = { slug, cdn? } and fetches the published content
 * via the edge-cached endpoint (sub-50ms after first hit). Falls back silently
 * if fetch fails — the hardcoded HTML stays as the source of truth.
 *
 * Empty-value handling per element:
 *   data-cms-empty="hide"           → hide the element
 *   data-cms-fallback-href="..."    → swap href to fallback (e.g. mailto)
 *   data-cms-fallback-text="..."    → swap textContent to fallback
 */
(function () {
  var SITE = window.__CMS_SITE;
  if (!SITE || !SITE.slug) return;

  var CDN = SITE.cdn || 'https://medina-admin.vercel.app';
  var URL = CDN + '/api/content/' + encodeURIComponent(SITE.slug);

  var ALLOWED_TAGS = { EM: 1, BR: 1, STRONG: 1, SPAN: 1, B: 1, I: 1, U: 1 };

  fetch(URL)
    .then(function (r) { return r.ok ? r.json() : null; })
    .catch(function () { return null; })
    .then(function (payload) {
      var content = payload && payload.content;
      if (!content || typeof content !== 'object') return;
      window.__cms = content;
      patchAll(content);
      document.dispatchEvent(new CustomEvent('cms:loaded', { detail: content }));
    });

  function get(obj, path) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, path)) return obj[path];
    return path.split('.').reduce(function (o, k) {
      if (o == null) return undefined;
      if (Array.isArray(o) && /^\d+$/.test(k)) return o[+k];
      return o[k];
    }, obj);
  }

  function sanitize(html) {
    var tmp = document.createElement('template');
    tmp.innerHTML = html;
    walk(tmp.content);
    return tmp.innerHTML;
    function walk(node) {
      Array.from(node.childNodes).forEach(function (n) {
        if (n.nodeType !== 1) return;
        if (!ALLOWED_TAGS[n.tagName]) {
          n.parentNode.replaceChild(document.createTextNode(n.textContent || ''), n);
        } else {
          Array.from(n.attributes).forEach(function (a) { n.removeAttribute(a.name); });
          walk(n);
        }
      });
    }
  }

  function isEmpty(v) {
    return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
  }

  function patchOne(el, value) {
    if (isEmpty(value)) {
      if (el.getAttribute('data-cms-empty') === 'hide') { el.style.display = 'none'; return; }
      var fbHref = el.getAttribute('data-cms-fallback-href');
      var fbText = el.getAttribute('data-cms-fallback-text');
      if (fbHref) el.setAttribute('href', fbHref);
      if (fbText) el.textContent = fbText;
      return;
    }
    var attr = el.getAttribute('data-cms-attr');
    var prefix = el.getAttribute('data-cms-prefix') || '';
    if (attr) {
      el.setAttribute(attr, prefix + value);
    } else if (el.hasAttribute('data-cms-html')) {
      el.innerHTML = sanitize(String(value));
    } else {
      el.textContent = prefix + String(value);
    }
  }

  function patchAll(content) {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      patchOne(el, get(content, el.getAttribute('data-cms')));
    });

    document.querySelectorAll('[data-cms-list]').forEach(function (container) {
      var items = get(content, container.getAttribute('data-cms-list'));
      if (!Array.isArray(items)) return;
      var template = container.firstElementChild;
      if (!template) return;
      Array.from(container.children).forEach(function (c, i) { if (i > 0) container.removeChild(c); });
      items.forEach(function (item, idx) {
        var node = idx === 0 ? template : template.cloneNode(true);
        if (typeof item === 'string') {
          node.textContent = item;
        } else if (item && typeof item === 'object') {
          node.querySelectorAll('[data-cms-field]').forEach(function (sub) {
            var key = sub.getAttribute('data-cms-field');
            if (item[key] != null) sub.textContent = item[key];
          });
        }
        if (idx > 0) container.appendChild(node);
      });
    });
  }
})();
