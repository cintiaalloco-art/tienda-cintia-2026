// Tienda pública "Obras hechas con Amor".
// Lee data/productos.json, data/categorias.json y data/videos.json
// (los tres se editan desde subir.html) y arma catálogo, filtros, carrito y videos.

const WA_NUM = '543468598805';
const CART_KEY = 'oha_carrito';
const SITE = 'https://obrashechasconamor.com.ar';
let PRODUCTOS = [];

// ---------- Utilidades ----------
function escapeHtml(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function precioNum(p){const d=String(p||'').replace(/\D/g,'');return d?parseInt(d,10):0}
function formatoPrecio(n){return '$'+n.toLocaleString('es-AR')}
function precioTexto(p){const n=precioNum(p);return n?formatoPrecio(n):(p||'')}
function numTexto(p){return 'Nº'+String(p.numero||'').replace(/^N/,'')}
function esVideo(src){return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src||'')}
function waLink(text){return 'https://wa.me/'+WA_NUM+'?text='+encodeURIComponent(text)}
function fotosDe(p){let f=(p.fotos&&p.fotos.length)?p.fotos:[p.foto1,p.foto2,p.foto3].filter(Boolean);return f.length?f:['images/hero.jpg']}
function videosDe(p){return (p.videos||[]).filter(Boolean)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),1800)}
const ICON_CART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>';
const ICON_WA='<svg class="wa-ico" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.9 9.9 0 0 0 4.77 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.86 9.86 0 0 0 12.04 2zm5.84 14.07c-.25.7-1.45 1.34-2 1.43-.51.08-1.15.11-1.86-.12-.43-.13-.98-.32-1.69-.62-2.97-1.28-4.91-4.27-5.06-4.47-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.47.27-.29.6-.37.8-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.77 1.27 1.65 2.06 1.13 1.01 2.09 1.33 2.38 1.48.29.15.46.13.63-.05.17-.18.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.74.82 2.04.97.3.15.5.22.57.35.07.13.07.74-.18 1.44z"/></svg>';
const ICON_CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';

// ---------- Carrusel ----------
function pausarVideos(c){c.querySelectorAll('video').forEach(v=>{try{v.pause()}catch(e){}})}
function goSlide(c,idx){
  if(typeof c==='string')c=document.getElementById(c);
  const s=c.querySelectorAll('.slide'),d=c.querySelectorAll('.dot');
  if(!s.length)return;
  pausarVideos(c);
  s.forEach(x=>x.classList.remove('active'));d.forEach(x=>x.classList.remove('active'));
  s[idx].classList.add('active');if(d[idx])d[idx].classList.add('active');
}
function nextSlide(c,dir){
  const s=c.querySelectorAll('.slide');if(s.length<2)return;
  let i=[...s].findIndex(x=>x.classList.contains('active'));
  goSlide(c,(i+(dir||1)+s.length)%s.length);
}
function tcStart(el,e){el._tx=e.touches[0].clientX}
function tcEnd(el,e){const dx=e.changedTouches[0].clientX-el._tx;if(Math.abs(dx)>40)nextSlide(el,dx<0?1:-1)}

// ---------- Tarjetas ----------
function buildCard(p, idx){
  const rot=(idx%2===0)?'-2deg':'2deg';
  const fotos=fotosDe(p);
  const slides=fotos.map((src,i)=>`<div class="slide${i===0?' active':''}"><img src="${escapeHtml(src)}" alt="${escapeHtml(p.nombre)}" loading="lazy"></div>`).join('');
  const dots=fotos.length>1?`<div class="carousel-dots">${fotos.map((_,i)=>`<span class="dot${i===0?' active':''}" onclick="event.stopPropagation();goSlide('card${idx}',${i})"></span>`).join('')}</div>`:'';
  const vids=videosDe(p).length?`<span class="video-badge">▶ video</span>`:'';
  const sold=p.vendida?`<span class="sold-ribbon">Vendida</span>`:'';
  const waText=p.vendida
    ?`Hola Cintia! Vi la gorra "${p.nombre}" (${numTexto(p)}) que figura vendida. ¿Me harías una similar?`
    :`Hola Cintia! Me interesa la gorra "${p.nombre}" (${numTexto(p)})`;
  const cartBtn=p.vendida?'':`<button class="add-cart" data-num="${escapeHtml(p.numero)}" onclick="toggleCart('${escapeHtml(p.numero)}')" aria-label="Agregar al carrito">${ICON_CART}</button>`;
  return `<article class="card${p.vendida?' sold':''}" data-cat="${escapeHtml(p.categoria)}" data-idx="${idx}"><span class="tag" style="--rot:${rot}">N&ordm;${escapeHtml(String(p.numero||'').replace(/^N/,''))}</span><div class="card-img">${sold}<div class="carousel" id="card${idx}" onclick="openModal(${idx})">${slides}${dots}</div>${vids}</div><div class="card-body"><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.descripcion)}</p><div class="card-foot"><span class="price">${escapeHtml(precioTexto(p.precio))}</span><span class="card-actions"><a class="mini-wa" href="${waLink(waText)}" target="_blank" rel="noopener" aria-label="${p.vendida?'Pedir similar':'Consultar'} por WhatsApp">${ICON_WA}<span class="wa-txt">${p.vendida?'Pedir similar':'Consultar'}</span></a>${cartBtn}</span></div></div></article>`;
}

// ---------- Filtros de categoría (salen de data/categorias.json) ----------
function buildFilters(categorias){
  const bar=document.getElementById('filterBar');
  const conteo={};
  PRODUCTOS.forEach(p=>{conteo[p.categoria]=(conteo[p.categoria]||0)+1});
  bar.innerHTML='';
  const mk=(cat,label,n)=>{
    const b=document.createElement('button');
    b.className='filter-btn'+(cat==='all'?' active':'');
    b.dataset.cat=cat;
    b.innerHTML=escapeHtml(label)+(n!=null?`<span class="count">${n}</span>`:'');
    b.onclick=()=>filterCat(b,cat);
    bar.appendChild(b);
  };
  mk('all','Todas',PRODUCTOS.length);
  // Solo se muestran las categorías que tienen al menos una gorra
  categorias.forEach(c=>{if(conteo[c])mk(c,c,conteo[c])});
}
function filterCat(btn,cat){
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.grid .card').forEach(card=>{
    card.style.display=(cat==='all'||card.getAttribute('data-cat')===cat)?'':'none';
  });
}

// ---------- Ventana de detalle ----------
let modalIdx=null;
function openModal(idx){
  const p=PRODUCTOS[idx];if(!p)return;
  modalIdx=idx;
  const mc=document.getElementById('modalCarousel');
  mc.querySelectorAll('.slide').forEach(s=>s.remove());
  const dotsWrap=document.getElementById('modalDots');
  dotsWrap.innerHTML='';
  const items=fotosDe(p).map(src=>({src,video:false})).concat(videosDe(p).map(src=>({src,video:true})));
  items.forEach((it,i)=>{
    const slide=document.createElement('div');
    slide.className='slide'+(i===0?' active':'');
    if(it.video){
      const v=document.createElement('video');
      v.src=it.src+'#t=0.1';v.controls=true;v.playsInline=true;v.preload='metadata';v.loop=true;
      v.onclick=e=>e.stopPropagation();
      slide.appendChild(v);
    }else{
      const im=document.createElement('img');im.src=it.src;im.alt=p.nombre;slide.appendChild(im);
    }
    mc.insertBefore(slide,dotsWrap);
    if(items.length>1){
      const dot=document.createElement('span');
      dot.className='dot'+(i===0?' active':'');
      if(it.video)dot.style.cssText='width:auto;height:auto;background:none;color:#fff;font-size:9px;line-height:6px';
      if(it.video)dot.textContent='▶';
      dot.onclick=e=>{e.stopPropagation();goSlide(mc,i)};
      dotsWrap.appendChild(dot);
    }
  });
  dotsWrap.style.display=items.length>1?'flex':'none';
  document.getElementById('mPrev').style.display=items.length>1?'':'none';
  document.getElementById('mNext').style.display=items.length>1?'':'none';
  document.getElementById('modalTitle').textContent=p.nombre||'';
  document.getElementById('modalDesc').textContent=p.descripcion||'';
  document.getElementById('modalPrice').textContent=precioTexto(p.precio);
  document.getElementById('modalNum').textContent=numTexto(p)+(p.vendida?' · Vendida':'');
  const waText=p.vendida
    ?`Hola Cintia! Vi la gorra "${p.nombre}" (${numTexto(p)}) que figura vendida. ¿Me harías una similar?`
    :`Hola Cintia! Me interesa la gorra "${p.nombre}" (${numTexto(p)})`;
  const wa=document.getElementById('modalWa');
  wa.href=waLink(waText);wa.textContent=p.vendida?'💬 Pedir similar':'💬 Consultar';
  const mb=document.getElementById('modalCart');
  mb.style.display=p.vendida?'none':'';
  mb.onclick=()=>toggleCart(p.numero);
  updateModalCartBtn();
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow='hidden';
}
function updateModalCartBtn(){
  if(modalIdx==null)return;
  const p=PRODUCTOS[modalIdx];const mb=document.getElementById('modalCart');
  mb.textContent=getCart().includes(p.numero)?'✓ En el carrito':'🛒 Agregar';
}
// ---------- Visor de fotos a pantalla completa (con zoom) ----------
let vFotos=[],vIdx=0,vZoom=false,vDrag=null,vOx=50,vOy=50;
function openViewerFromModal(){
  if(modalIdx==null)return;
  const mc=document.getElementById('modalCarousel');
  const slides=[...mc.querySelectorAll('.slide')];
  const act=slides.findIndex(x=>x.classList.contains('active'));
  if(slides[act]&&slides[act].querySelector('video'))return;
  vFotos=fotosDe(PRODUCTOS[modalIdx]);
  vIdx=Math.max(0,Math.min(act,vFotos.length-1));
  document.getElementById('viewer').classList.add('open');
  viewerShow();
}
function viewerShow(){
  const img=document.getElementById('viewerImg');
  vZoom=false;vOx=50;vOy=50;
  document.getElementById('viewer').classList.remove('zoomed');
  img.style.transform='';img.style.transformOrigin='50% 50%';
  img.src=vFotos[vIdx];
  const varias=vFotos.length>1;
  document.getElementById('vPrev').style.display=varias?'':'none';
  document.getElementById('vNext').style.display=varias?'':'none';
  document.getElementById('vCount').textContent=varias?(vIdx+1)+' / '+vFotos.length:'';
  document.getElementById('vHint').textContent='Tocá la foto para hacer zoom'+(varias?' · deslizá para ver las otras':'');
}
function viewerGo(d){if(vFotos.length<2)return;vIdx=(vIdx+d+vFotos.length)%vFotos.length;viewerShow()}
function closeViewer(){document.getElementById('viewer').classList.remove('open');
  // Al cerrar, la ventana de la gorra queda en la misma foto que se estaba mirando
  if(modalIdx!=null)goSlide(document.getElementById('modalCarousel'),vIdx);}
function viewerZoomAt(x,y){
  const img=document.getElementById('viewerImg');const r=img.getBoundingClientRect();
  vOx=Math.max(0,Math.min(100,(x-r.left)/r.width*100));vOy=Math.max(0,Math.min(100,(y-r.top)/r.height*100));
  vZoom=true;document.getElementById('viewer').classList.add('zoomed');
  img.style.transformOrigin=vOx+'% '+vOy+'%';img.style.transform='scale(2.6)';
  document.getElementById('vHint').textContent='Arrastrá para mover · tocá de nuevo para alejar';
}
(function(){
  const v=document.getElementById('viewer');if(!v)return;
  const img=document.getElementById('viewerImg');
  v.addEventListener('pointerdown',e=>{if(e.target.closest('.v-btn'))return;vDrag={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false,type:e.pointerType};});
  v.addEventListener('pointermove',e=>{
    if(vZoom&&e.pointerType==='mouse'&&!vDrag){ // con mouse, la foto sigue al puntero
      const r=img.getBoundingClientRect();
      vOx=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));vOy=Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100));
      img.style.transformOrigin=vOx+'% '+vOy+'%';return;
    }
    if(!vDrag)return;
    const dx=e.clientX-vDrag.x,dy=e.clientY-vDrag.y;
    if(Math.hypot(e.clientX-vDrag.sx,e.clientY-vDrag.sy)>8)vDrag.moved=true;
    if(vZoom&&vDrag.moved){ // arrastrar mueve la foto ampliada
      const r=img.getBoundingClientRect();
      vOx=Math.max(0,Math.min(100,vOx-dx/r.width*100));vOy=Math.max(0,Math.min(100,vOy-dy/r.height*100));
      img.style.transformOrigin=vOx+'% '+vOy+'%';
      vDrag.x=e.clientX;vDrag.y=e.clientY;
    }
  });
  v.addEventListener('pointerup',e=>{
    if(!vDrag)return;const d=vDrag;vDrag=null;
    const dx=e.clientX-d.sx;
    if(!d.moved){
      if(e.target===img){if(vZoom)viewerShow();else viewerZoomAt(e.clientX,e.clientY);}
      else if(!vZoom)closeViewer(); // tocar el fondo negro cierra
      return;
    }
    if(!vZoom&&Math.abs(dx)>50)viewerGo(dx<0?1:-1);
  });
  v.addEventListener('pointercancel',()=>{vDrag=null});
})();

function closeModal(){
  pausarVideos(document.getElementById('modalCarousel'));
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow='';
  modalIdx=null;
}

// ---------- Carrito (se guarda en el celular de la clienta) ----------
function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch(e){return []}}
function setCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));renderCart()}
function toggleCart(numero){
  const c=getCart();const i=c.indexOf(numero);
  if(i>=0){c.splice(i,1);setCart(c);toast('Quitada del carrito')}
  else{c.push(numero);setCart(c);toast('Agregada al carrito ✓');const cc=document.getElementById('cartCount');cc.classList.remove('bump');void cc.offsetWidth;cc.classList.add('bump')}
}
function itemsCarrito(){
  const c=getCart();
  return c.map(n=>PRODUCTOS.find(p=>p.numero===n&&!p.vendida)).filter(Boolean);
}
function renderCart(){
  const items=itemsCarrito();
  // Limpia gorras que ya no existen o se vendieron
  const vigentes=items.map(p=>p.numero);
  if(PRODUCTOS.length&&vigentes.length!==getCart().length)localStorage.setItem(CART_KEY,JSON.stringify(vigentes));
  document.getElementById('cartCount').textContent=items.length;
  document.getElementById('cartFloat').classList.toggle('show',items.length>0);
  document.querySelectorAll('.add-cart').forEach(b=>{
    const inCart=vigentes.includes(b.dataset.num);
    b.classList.toggle('in',inCart);b.innerHTML=inCart?ICON_CHECK:ICON_CART;
    b.setAttribute('aria-label',inCart?'Quitar del carrito':'Agregar al carrito');
  });
  const list=document.getElementById('cartItems');
  if(!items.length){
    list.innerHTML='<div class="cart-empty">Tu carrito está vacío.<br>Tocá 🛒 en las gorras que te gusten.</div>';
    document.getElementById('cartFoot').style.display='none';
  }else{
    list.innerHTML=items.map(p=>`<div class="cart-item"><img src="${escapeHtml(fotosDe(p)[0])}" alt=""><div class="ci-info"><div class="ci-name">${escapeHtml(p.nombre)}</div><div class="ci-meta">${escapeHtml(numTexto(p))} · ${escapeHtml(p.categoria||'')}</div><div class="ci-price">${escapeHtml(precioTexto(p.precio))}</div></div><button class="ci-remove" onclick="toggleCart('${escapeHtml(p.numero)}')" aria-label="Quitar">✕</button></div>`).join('');
    document.getElementById('cartFoot').style.display='';
    const total=items.reduce((s,p)=>s+precioNum(p.precio),0);
    const sinPrecio=items.some(p=>!precioNum(p.precio));
    document.getElementById('cartTotal').textContent=formatoPrecio(total)+(sinPrecio?' + a consultar':'');
  }
  updateModalCartBtn();
}
function openCart(){renderCart();document.getElementById('cartOverlay').classList.add('open');document.getElementById('cartPanel').classList.add('open');document.body.style.overflow='hidden'}
function closeCart(){document.getElementById('cartOverlay').classList.remove('open');document.getElementById('cartPanel').classList.remove('open');document.body.style.overflow=''}
function clearCart(){if(confirm('¿Vaciar el carrito?')){setCart([]);closeCart()}}
function sendCart(){
  const items=itemsCarrito();if(!items.length)return;
  const nombre=document.getElementById('cartName').value.trim();
  const msg=document.getElementById('cartMsg').value.trim();
  // El link al pedido va primero: WhatsApp muestra la foto de la gorra como vista previa
  // y al abrirlo se ven todas las gorras elegidas con su foto.
  const link=SITE+'/pedido?n='+items.map(p=>encodeURIComponent(p.numero)).join(',');
  let t=`Hola Cintia! Quiero hacer este pedido 🛍️\n${link}\n\n`;
  items.forEach(p=>{t+=`• ${numTexto(p)} — ${p.nombre} — ${precioTexto(p.precio)}\n`});
  const total=items.reduce((s,p)=>s+precioNum(p.precio),0);
  t+=`\nTotal: ${formatoPrecio(total)}`;
  if(nombre)t+=`\nNombre: ${nombre}`;
  if(msg)t+=`\nComentario: ${msg}`;
  window.open(waLink(t),'_blank');
}

// ---------- Sección de videos (sale de data/videos.json) ----------
function embedVideo(url){
  let m;
  if((m=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/))){
    const corto=/shorts\//.test(url);
    return {html:`<iframe src="https://www.youtube-nocookie.com/embed/${m[1]}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`,wide:!corto};
  }
  if((m=url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/))){
    return {html:`<iframe src="https://www.instagram.com/reel/${m[1]}/embed" loading="lazy" scrolling="no" allowtransparency="true"></iframe>`,wide:false};
  }
  if((m=url.match(/tiktok\.com\/.*\/video\/(\d+)/))){
    return {html:`<iframe src="https://www.tiktok.com/embed/v2/${m[1]}" loading="lazy" allowfullscreen></iframe>`,wide:false};
  }
  if(esVideo(url)){
    return {html:`<video src="${escapeHtml(url)}#t=0.1" controls playsinline preload="metadata"></video>`,wide:false};
  }
  return {html:`<a class="video-link" href="${escapeHtml(url)}" target="_blank" rel="noopener"><span style="font-size:2rem">▶</span>Ver video</a>`,wide:false};
}
function buildVideos(videos){
  if(!videos||!videos.length)return;
  document.getElementById('videosGrid').innerHTML=videos.map(v=>{
    const e=embedVideo(v.url||'');
    return `<div class="video-card"><div class="video-frame${e.wide?' wide':''}">${e.html}</div>${v.titulo?`<div class="vc-title">${escapeHtml(v.titulo)}</div>`:''}</div>`;
  }).join('');
  document.getElementById('videos').style.display='';
  document.getElementById('navVideos').style.display='';
}

// ---------- Portada: va mostrando gorras al azar ----------
function startHero(){
  const box=document.getElementById('heroImgs');if(!box)return;
  const pool=PRODUCTOS.map((p,i)=>({p,i})).filter(x=>!x.p.vendida&&x.p.fotos&&x.p.fotos.length);
  if(!pool.length)return;
  const imgs=box.querySelectorAll('img');
  let front=0,actual=null,cola=[];
  const siguiente=()=>{
    if(!cola.length){cola=pool.slice().sort(()=>Math.random()-.5);if(actual&&cola[0]===actual)cola.push(cola.shift())}
    return cola.shift();
  };
  const mostrar=x=>{
    const back=imgs[1-front];
    const pre=new Image();
    pre.onload=()=>{
      back.src=pre.src;back.alt=x.p.nombre||'';
      back.classList.add('on');imgs[front].classList.remove('on');
      front=1-front;actual=x;
    };
    pre.src=x.p.fotos[0];
  };
  box.onclick=()=>{if(actual)openModal(actual.i);else document.getElementById('catalogo').scrollIntoView()};
  mostrar(siguiente());
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  setInterval(()=>{if(!document.hidden)mostrar(siguiente())},4500);
}

// Link directo a una gorra: obrashechasconamor.com.ar/?g=N012 abre su ventana
function abrirDesdeLink(){
  const g=new URLSearchParams(location.search).get('g');
  if(!g)return;
  const i=PRODUCTOS.findIndex(p=>p.numero===g);
  if(i>=0)openModal(i);
}

// ---------- Carga inicial ----------
const sinCache='?v='+Date.now();
function getJson(url,porDefecto){return fetch(url+sinCache).then(r=>r.ok?r.json():porDefecto).catch(()=>porDefecto)}
Promise.all([
  fetch('data/productos.json'+sinCache).then(r=>r.json()),
  getJson('data/categorias.json',{categorias:[]}),
  getJson('data/videos.json',{videos:[]})
]).then(([data,cats,vids])=>{
  PRODUCTOS=data.productos||[];
  const grid=document.querySelector('.grid');
  grid.innerHTML=PRODUCTOS.map((p,i)=>buildCard(p,i)).join('');
  let nombres=(cats.categorias||[]).map(c=>c.nombre);
  // Si alguna gorra tiene una categoría que no está en la lista, igual aparece su botón al final
  PRODUCTOS.forEach(p=>{if(p.categoria&&!nombres.includes(p.categoria))nombres.push(p.categoria)});
  buildFilters(nombres);
  buildVideos(vids.videos);
  renderCart();
  startHero();
  abrirDesdeLink();
}).catch(err=>{
  document.querySelector('.grid').innerHTML='<p style="padding:40px;text-align:center;color:#7A5C5F">No se pudo cargar el cat&aacute;logo. Revis&aacute; tu conexi&oacute;n e intent&aacute; de nuevo.</p>';
  console.error(err);
});
document.addEventListener('keydown',e=>{
  const vOpen=document.getElementById('viewer').classList.contains('open');
  if(e.key==='Escape'){if(vOpen)closeViewer();else{closeModal();closeCart()}}
  if(vOpen&&e.key==='ArrowRight')viewerGo(1);
  if(vOpen&&e.key==='ArrowLeft')viewerGo(-1);
});
