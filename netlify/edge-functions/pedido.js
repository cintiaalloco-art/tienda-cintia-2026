// Netlify Edge Function para /pedido?n=N001,N005
// Pone en la página la foto y el nombre de la primera gorra del pedido (etiquetas og:),
// así cuando la clienta manda el link por WhatsApp se ve la foto en miniatura.
// Si algo falla, devuelve la página tal cual (sin vista previa personalizada).

function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function precioNum(p) { const d = String(p || '').replace(/\D/g, ''); return d ? parseInt(d, 10) : 0; }
function fmt(n) { return '$' + n.toLocaleString('es-AR'); }
function numTexto(p) { return 'Nº' + String(p.numero || '').replace(/^N/, ''); }

export function altoCollage() { return 600; } // todas las imágenes son cuadradas

export function armarOg(items, origin) {
  const first = items[0];
  const foto = (first.fotos || [])[0];
  // Una gorra: su foto achicada con Netlify Image CDN (WhatsApp no muestra imágenes pesadas).
  // Varias: collage armado por netlify/functions/pedido-foto.mjs, adaptado a la cantidad.
  const image = items.length > 1
    ? `${origin}/pedido-foto?n=${items.map(p => encodeURIComponent(p.numero)).join(',')}`
    : foto
      ? `${origin}/.netlify/images?url=${encodeURIComponent('/' + foto.replace(/^\//, ''))}&w=600&h=600&fit=cover&fm=jpg&q=75`
      : `${origin}/images/hero.jpg`;
  const total = items.reduce((s, p) => s + precioNum(p.precio), 0);
  const title = items.length === 1
    ? `${numTexto(first)} — ${first.nombre}`
    : `Pedido de ${items.length} gorras — ${fmt(total)}`;
  const description = items.map(p => `${numTexto(p)} ${p.nombre}`).join(' · ') + (items.length === 1 ? ` — ${fmt(total)}` : '');
  return { title, description, image, height: altoCollage(items.length) };
}

export function reemplazarOg(html, og) {
  const set = (prop, value) => {
    html = html.replace(new RegExp(`<meta property="${prop}" content="[^"]*">`), `<meta property="${prop}" content="${esc(value)}">`);
  };
  set('og:title', og.title);
  set('og:description', og.description);
  set('og:image', og.image);
  html = html.replace('</head>', `<meta property="og:image:width" content="600"><meta property="og:image:height" content="${og.height || 600}">\n</head>`);
  return html;
}

export default async (request, context) => {
  const res = await context.next();
  let og;
  try {
    const url = new URL(request.url);
    const nums = (url.searchParams.get('n') || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!nums.length) return res;
    const r = await fetch(new URL('/data/productos.json', url.origin));
    if (!r.ok) return res;
    const data = await r.json();
    const items = nums.map(n => (data.productos || []).find(p => p.numero === n)).filter(Boolean);
    if (!items.length) return res;
    og = armarOg(items, url.origin);
  } catch (e) {
    return res;
  }
  const html = await res.text();
  const headers = new Headers(res.headers);
  headers.delete('content-length');
  headers.set('content-type', 'text/html; charset=utf-8');
  return new Response(reemplazarOg(html, og), { status: res.status, headers });
};

export const config = { path: ['/pedido', '/pedido.html'] };
