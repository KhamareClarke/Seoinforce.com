(function () {
  'use strict';

  var HOST = 'https://seoinforce.com';

  // Read config from the script tag itself
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var brand = currentScript.getAttribute('data-brand') || '';
  var color = (currentScript.getAttribute('data-color') || 'FFD700').replace('#', '');
  var logo = currentScript.getAttribute('data-logo') || '';
  var position = currentScript.getAttribute('data-position') || 'bottom-right';

  var widgetUrl =
    HOST + '/widget?brand=' + encodeURIComponent(brand) +
    '&color=' + encodeURIComponent(color) +
    '&logo=' + encodeURIComponent(logo);

  var GOLD = '#' + color;

  // Position styles
  var posMap = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    'top-left': { top: '20px', left: '20px' },
  };
  var pos = posMap[position] || posMap['bottom-right'];

  // ---- Inject styles ----
  var style = document.createElement('style');
  style.textContent = [
    '#_seoif-btn{position:fixed;z-index:99999;cursor:pointer;border:none;outline:none;',
    'display:flex;align-items:center;gap:8px;padding:12px 20px;border-radius:9999px;',
    'background:' + GOLD + ';color:#0a0a0c;font-family:system-ui,sans-serif;',
    'font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;',
    'box-shadow:0 4px 24px ' + GOLD + '55;transition:transform .15s,box-shadow .15s;}',
    '#_seoif-btn:hover{transform:scale(1.04);box-shadow:0 6px 32px ' + GOLD + '88;}',
    Object.entries(pos).map(function(e){return '#_seoif-btn{'+e[0]+':'+e[1]+'}'}).join(''),
    '#_seoif-panel{position:fixed;z-index:99998;width:340px;',
    Object.entries(pos).map(function(e){
      var k = e[0]; var v = e[1];
      // offset by button height + gap
      if (k === 'bottom') return '#_seoif-panel{bottom:72px}';
      if (k === 'top') return '#_seoif-panel{top:72px}';
      return '#_seoif-panel{' + k + ':' + v + '}';
    }).join(''),
    'display:none;border-radius:16px;overflow:hidden;',
    'box-shadow:0 24px 64px rgba(0,0,0,0.8);}',
    '#_seoif-panel iframe{width:100%;height:480px;border:none;display:block;}',
    '#_seoif-panel.open{display:block;}',
  ].join('');
  document.head.appendChild(style);

  // ---- Create button ----
  var btn = document.createElement('button');
  btn.id = '_seoif-btn';
  btn.setAttribute('aria-label', 'Free SEO Audit');
  btn.innerHTML =
    '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">' +
    '<circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>' +
    'Free SEO Audit';
  document.body.appendChild(btn);

  // ---- Create panel ----
  var panel = document.createElement('div');
  panel.id = '_seoif-panel';
  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.title = 'SEO Audit';
  iframe.setAttribute('loading', 'lazy');
  panel.appendChild(iframe);
  document.body.appendChild(panel);

  // ---- Toggle ----
  var open = false;
  btn.addEventListener('click', function () {
    open = !open;
    panel.className = open ? 'open' : '';
    btn.innerHTML = open
      ? '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" d="M18 6 6 18M6 6l12 12"/></svg> Close'
      : '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg> Free SEO Audit';
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (open && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      open = false;
      panel.className = '';
      btn.innerHTML =
        '<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">' +
        '<circle cx="11" cy="11" r="8"/><path stroke-linecap="round" d="m21 21-4.35-4.35"/></svg>' +
        'Free SEO Audit';
    }
  });
})();
