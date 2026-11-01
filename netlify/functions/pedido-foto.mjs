// Netlify Function: /pedido-foto?n=N001,N005,N010
// Arma una imagen JPG cuadrada de 600x600 para la vista previa de WhatsApp:
// arriba la primera gorra grande y abajo, en miniatura, hasta 4 de las otras gorras elegidas.
// Usa jpeg-js (JavaScript puro, sin dependencias nativas).
import jpeg from 'jpeg-js';

const SIZE = 600;          // lado de la imagen final
const GAP = 8;             // separación entre fotos
const THUMBS = 4;          // miniaturas como máximo
const THUMB = (SIZE - GAP * (THUMBS - 1)) / THUMBS; // 144
const MAIN_H = SIZE - GAP - THUMB;                   // 448
const BG = [251, 243, 240]; // --cream

function nuevaImagen(w, h) {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = BG[0]; data[i * 4 + 1] = BG[1]; data[i * 4 + 2] = BG[2]; data[i * 4 + 3] = 255; }
  return { width: w, height: h, data };
}

// Copia src dentro de dst en el rectángulo (x,y,w,h) recortando como "object-fit: cover"
export function dibujarCover(dst, src, x, y, w, h) {
  const escala = Math.max(w / src.width, h / src.height);
  const sw = w / escala, sh = h / escala;
  const sx0 = (src.width - sw) / 2, sy0 = (src.height - sh) / 2;
  for (let j = 0; j < h; j++) {
    const sy = Math.min(src.height - 1, Math.floor(sy0 + (j + 0.5) / escala));
    for (let i = 0; i < w; i++) {
      const sx = Math.min(src.width - 1, Math.floor(sx0 + (i + 0.5) / escala));
      const si = (sy * src.width + sx) * 4;
      const di = ((y + j) * dst.width + (x + i)) * 4;
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = 255;
    }
  }
}

export function armarCollage(fotos) {
  const out = nuevaImagen(SIZE, SIZE);
  const [principal, ...otras] = fotos;
  if (!otras.length) {
    dibujarCover(out, principal, 0, 0, SIZE, SIZE);
  } else {
    dibujarCover(out, principal, 0, 0, SIZE, MAIN_H);
    const n = Math.min(THUMBS, otras.length);
    // Las miniaturas quedan centradas si son menos de 4
    const inicio = (SIZE - (n * THUMB + (n - 1) * GAP)) / 2;
    for (let k = 0; k < n; k++) {
      dibujarCover(out, otras[k], Math.round(inicio + k * (THUMB + GAP)), MAIN_H + GAP, Math.round(THUMB), Math.round(THUMB));
    }
  }
  return jpeg.encode(out, 82).data;
}

async function bajarFoto(origin, ruta, w, h) {
  const limpia = '/' + String(ruta).replace(/^\//, '');
  // Netlify Image CDN la achica y la entrega como JPG
  const url = `${origin}/.netlify/images?url=${encodeURIComponent(limpia)}&w=${w}&h=${h}&fit=cover&fm=jpg&q=80`;
  let r = await fetch(url);
  if (!r.ok) r = await fetch(origin + encodeURI(limpia)); // por las dudas, la foto original
  if (!r.ok) throw new Error('foto ' + ruta);
  const buf = Buffer.from(await r.arrayBuffer());
  return jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
}

export default async (request) => {
  const url = new URL(request.url);
  const origin = url.origin;
  try {
    const nums = (url.searchParams.get('n') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, 1 + THUMBS);
    const data = await (await fetch(origin + '/data/productos.json')).json();
    const items = nums.map(n => (data.productos || []).find(p => p.numero === n)).filter(p => p && p.fotos && p.fotos.length);
    if (!items.length) return Response.redirect(origin + '/images/hero.jpg', 302);
    // Si alguna foto no se puede leer, se saltea (no arruina toda la imagen)
    const res = await Promise.allSettled(items.map((p, i) =>
      i === 0 ? bajarFoto(origin, p.fotos[0], SIZE, items.length > 1 ? MAIN_H : SIZE)
              : bajarFoto(origin, p.fotos[0], 160, 160)));
    const fotos = res.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (!fotos.length) return Response.redirect(origin + '/images/hero.jpg', 302);
    const jpg = armarCollage(fotos);
    return new Response(jpg, {
      headers: {
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=86400',
        'netlify-cdn-cache-control': 'public, durable, max-age=604800'
      }
    });
  } catch (e) {
    return Response.redirect(origin + '/images/hero.jpg', 302);
  }
};

export const config = { path: '/pedido-foto' };
