// Netlify Function: /pedido-foto?n=N001,N005,N010
// Arma una imagen JPG para la vista previa de WhatsApp de un pedido, adaptada a la cantidad de gorras:
//   1 gorra  -> una foto de 600x600
//   2 gorras -> el cuadrado partido en dos mitades iguales, una arriba y otra abajo
//   3 gorras -> una grande arriba y dos más chicas abajo
//   4 gorras -> cuadrícula de 2x2 (600x600)
//   5 o más  -> la primera grande y hasta 4 miniaturas abajo (600x600)
// Usa jpeg-js (JavaScript puro, sin dependencias nativas).
// Todas las imágenes son cuadradas de 600x600.
import jpeg from 'jpeg-js';

const W = 600;              // ancho de la imagen final
const GAP = 8;              // separación entre fotos
const MAX = 5;              // gorras que entran en la imagen
const BG = [251, 243, 240]; // --cream
const HALF = (W - GAP) / 2; // 296: celda de las grillas de 2 columnas
const THUMB = (W - GAP * 3) / 4; // 144: miniaturas cuando son 5 o más
const MAIN_H = W - GAP - THUMB;  // 448: foto grande cuando son 5 o más
const TOP3 = 380;                // foto grande de arriba cuando son 3

// Rectángulos donde va cada foto, según la cantidad de gorras
export function disenio(n) {
  if (n <= 1) return { w: W, h: W, celdas: [[0, 0, W, W]] };
  // 2: el cuadrado partido en dos mitades, una arriba y otra abajo (las gorras son más anchas que altas)
  if (n === 2) return { w: W, h: W, celdas: [[0, 0, W, HALF], [0, HALF + GAP, W, HALF]] };
  // 3: una grande arriba y dos abajo
  if (n === 3) return { w: W, h: W, celdas: [[0, 0, W, TOP3], [0, TOP3 + GAP, HALF, W - TOP3 - GAP], [HALF + GAP, TOP3 + GAP, HALF, W - TOP3 - GAP]] };
  if (n === 4) return { w: W, h: W, celdas: [[0, 0, HALF, HALF], [HALF + GAP, 0, HALF, HALF], [0, HALF + GAP, HALF, HALF], [HALF + GAP, HALF + GAP, HALF, HALF]] };
  const celdas = [[0, 0, W, MAIN_H]];
  for (let k = 0; k < 4; k++) celdas.push([k * (THUMB + GAP), MAIN_H + GAP, THUMB, THUMB]);
  return { w: W, h: W, celdas };
}

function nuevaImagen(w, h) {
  const data = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = BG[0]; data[i * 4 + 1] = BG[1]; data[i * 4 + 2] = BG[2]; data[i * 4 + 3] = 255; }
  return { width: w, height: h, data };
}

// Copia src dentro de dst en el rectángulo (x,y,w,h) recortando como "object-fit: cover"
export function dibujarCover(dst, src, x, y, w, h) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
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
  const fs = fotos.slice(0, MAX);
  const d = disenio(fs.length);
  const out = nuevaImagen(d.w, d.h);
  fs.forEach((f, k) => { const [x, y, w, h] = d.celdas[k]; dibujarCover(out, f, x, y, w, h); });
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
    const nums = (url.searchParams.get('n') || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, MAX);
    const data = await (await fetch(origin + '/data/productos.json')).json();
    const items = nums.map(n => (data.productos || []).find(p => p.numero === n)).filter(p => p && p.fotos && p.fotos.length);
    if (!items.length) return Response.redirect(origin + '/images/hero.jpg', 302);
    // Tamaño a pedir de cada foto según dónde va a ir
    const d = disenio(items.length);
    // Si alguna foto no se puede leer, se saltea (no arruina toda la imagen)
    const res = await Promise.allSettled(items.map((p, i) => {
      const [, , w, h] = d.celdas[i];
      return bajarFoto(origin, p.fotos[0], Math.round(w), Math.round(h));
    }));
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
