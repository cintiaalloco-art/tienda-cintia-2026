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
// Número visible: categoría + número dentro de la categoría (ej. "Airbag Nº16")
function numTexto(p){return p.nro?`${p.sub||p.categoria} Nº${p.nro}`:'Nº'+String(p.numero||'').replace(/^N/,'')}
function esVideo(src){return /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src||'')}
// Mensaje para consultar por una gorra. El link va en la 2ª línea: WhatsApp muestra la foto
// de la gorra en miniatura (la pone netlify/edge-functions/pedido.js) y al tocarlo se ve la gorra.
function textoConsulta(p){
  const link=SITE+'/pedido?n='+encodeURIComponent(p.numero);
  return p.vendida
    ?`Hola Cintia! Vi esta gorra que figura vendida. ¿Me harías una similar?\n${link}\n\n${numTexto(p)} — ${p.nombre}`
    :`Hola Cintia! Me interesa esta gorra 💕\n${link}\n\n${numTexto(p)} — ${p.nombre} — ${precioTexto(p.precio)}`;
}
function waLink(text){return 'https://wa.me/'+WA_NUM+'?text='+encodeURIComponent(text)}
function fotosDe(p){let f=(p.fotos&&p.fotos.length)?p.fotos:[p.foto1,p.foto2,p.foto3].filter(Boolean);return f.length?f:['images/hero.jpg']}
function videosDe(p){return (p.videos||[]).filter(Boolean)}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),1800)}
const ICON_CART='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L21 7H6"/></svg>';
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
function buildCard(p, idx, pre){
  const cid=(pre||'card')+idx;
  const rot=(idx%2===0)?'-2deg':'2deg';
  const fotos=fotosDe(p);
  const slides=fotos.map((src,i)=>`<div class="slide${i===0?' active':''}"><img src="${escapeHtml(src)}" alt="${escapeHtml(p.nombre)}" loading="lazy"></div>`).join('');
  const dots=fotos.length>1?`<div class="carousel-dots">${fotos.map((_,i)=>`<span class="dot${i===0?' active':''}" onclick="event.stopPropagation();goSlide('${cid}',${i})"></span>`).join('')}</div>`:'';
  const vids=videosDe(p).length?`<span class="video-badge">▶ video</span>`:'';
  const sold=p.vendida?`<span class="sold-ribbon">Vendida</span>`:'';
  const waText=textoConsulta(p);
  const cartBtn=p.vendida?'':`<button class="add-cart" data-num="${escapeHtml(p.numero)}" onclick="toggleCart('${escapeHtml(p.numero)}')" aria-label="Comprar">${ICON_CART}<span class="ac-txt">Comprar</span></button>`;
  return `<article class="card${p.vendida?' sold':''}" data-cat="${escapeHtml(p.categoria)}" data-idx="${idx}">${p.nro?`<span class="tag" style="--rot:${rot}">N&ordm;${p.nro}</span>`:''}<div class="card-img">${sold}<div class="carousel" id="${cid}" onclick="openModal(${idx})">${slides}${dots}</div>${vids}</div><div class="card-body"><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.descripcion)}</p><div class="card-foot"><span class="price">${escapeHtml(precioTexto(p.precio))}</span><span class="card-actions"><a class="mini-wa" href="${waLink(waText)}" target="_blank" rel="noopener" aria-label="${p.vendida?'Pedir similar':'Consultar'} por WhatsApp">${ICON_WA}<span class="wa-txt">${p.vendida?'Pedir similar':'Consultar'}</span></a>${cartBtn}</span></div></div></article>`;
}

// ---------- Vistas del catálogo ----------
// "inicio": una fila por categoría (y una por cada subcategoría, debajo de su categoría) con algunas
// gorras para deslizar + botón "Ver todas". "todas": todas las gorras. Si no, una categoría,
// opcionalmente filtrada por subcategoría (vistaSub; "" = sin subcategoría, null = todas).
// La vista va en la dirección (?cat=Airbag&sub=Sardelli%2096) para que el botón "atrás" funcione.
let CATEGORIAS=[];
let SUBS={};          // { "Airbag": ["Sardelli 96"] }
let vista='inicio', vistaSub=null;
const POR_FILA=8; // gorras que se muestran en cada fila del inicio (después viene "Ver todas")
function contar(cat){return PRODUCTOS.filter(p=>p.categoria===cat).length}
function conIdx(f){return PRODUCTOS.map((p,i)=>({p,i})).filter(x=>f(x.p))}
function jsq(v){return JSON.stringify(v).replace(/"/g,'&quot;')}
function buildFilters(){
  const bar=document.getElementById('filterBar');
  bar.innerHTML='';
  const mk=(v,label,n)=>{
    const b=document.createElement('button');
    b.className='filter-btn';b.dataset.cat=v;
    b.innerHTML=escapeHtml(label)+(n!=null?`<span class="count">${n}</span>`:'');
    b.onclick=()=>setVista(v);
    bar.appendChild(b);
  };
  mk('inicio','Inicio');
  // Solo se muestran las categorías que tienen al menos una gorra (las subcategorías van adentro)
  CATEGORIAS.forEach(c=>{const n=contar(c);if(n)mk(c,c,n)});
  mk('todas','Todas',PRODUCTOS.length);
}
function setVista(v,sub,desdeHistorial){
  vista=v||'inicio';
  vistaSub=(sub===undefined?null:sub);
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===vista));
  const home=document.getElementById('home'),grid=document.querySelector('.grid'),head=document.getElementById('vistaHead');
  if(vista==='inicio'){
    home.style.display='';grid.style.display='none';head.style.display='none';
    home.innerHTML=renderInicio();
  }else if(vista==='todas'){
    const lista=conIdx(()=>true);
    head.style.display='';
    head.innerHTML=`<button class="vh-back" onclick="setVista('inicio')">‹ Inicio</button><h3>Todas las gorras</h3><span class="vh-count">${lista.length} gorras</span>`;
    grid.innerHTML=lista.map(x=>buildCard(x.p,x.i,'g')).join('');
    home.style.display='none';grid.style.display='';
  }else{
    const subs=(SUBS[vista]||[]).filter(sb=>PRODUCTOS.some(p=>p.categoria===vista&&p.sub===sb));
    const todas=conIdx(p=>p.categoria===vista);
    const sinSub=todas.filter(x=>!x.p.sub);
    let titulo=escapeHtml(vista), lista=todas, html='';
    if(vistaSub){titulo=`<span class="vh-parent">${escapeHtml(vista)} ›</span> ${escapeHtml(vistaSub)}`;lista=todas.filter(x=>x.p.sub===vistaSub)}
    else if(vistaSub===''){lista=sinSub}
    // Botones de subcategoría: Todas · Airbag · Sardelli 96
    const chips=subs.length?`<div class="sub-chips"><button class="sub-chip${vistaSub===null?' on':''}" onclick="setVista(${jsq(vista)},null)">Todas <span>${todas.length}</span></button>${sinSub.length?`<button class="sub-chip${vistaSub===''?' on':''}" onclick="setVista(${jsq(vista)},'')">${escapeHtml(vista)} <span>${sinSub.length}</span></button>`:''}${subs.map(sb=>`<button class="sub-chip${vistaSub===sb?' on':''}" onclick="setVista(${jsq(vista)},${jsq(sb)})">${escapeHtml(sb)} <span>${todas.filter(x=>x.p.sub===sb).length}</span></button>`).join('')}</div>`:'';
    head.style.display='';
    head.innerHTML=`<button class="vh-back" onclick="setVista('inicio')">‹ Inicio</button><h3>${titulo}</h3><span class="vh-count">${lista.length} gorra${lista.length===1?'':'s'}</span>${chips}`;
    if(vistaSub===null&&subs.length){
      // Todas: primero las de la categoría y después un bloque por subcategoría, con su título
      html=sinSub.map(x=>buildCard(x.p,x.i,'g')).join('');
      subs.forEach(sb=>{html+=`<h4 class="grid-sub">${escapeHtml(sb)}</h4>`+todas.filter(x=>x.p.sub===sb).map(x=>buildCard(x.p,x.i,'g')).join('')});
    }else html=lista.map(x=>buildCard(x.p,x.i,'g')).join('');
    grid.innerHTML=html;
    home.style.display='none';grid.style.display='';
  }
  renderCart();
  if(!desdeHistorial){
    const url=new URL(location.href);
    if(vista==='inicio')url.searchParams.delete('cat');else url.searchParams.set('cat',vista);
    if(vistaSub===null)url.searchParams.delete('sub');else url.searchParams.set('sub',vistaSub);
    url.searchParams.delete('g');
    history.pushState({vista,sub:vistaSub},'',url);
    const cat=document.getElementById('catalogo');
    if(cat&&window.scrollY>cat.offsetTop)window.scrollTo({top:cat.offsetTop-70,behavior:'smooth'});
  }
}
function filaInicio(titulo,padre,items,abrir,cuantas){
  // Primero las disponibles, después las vendidas
  const orden=items.filter(x=>!x.p.vendida).concat(items.filter(x=>x.p.vendida)).slice(0,POR_FILA);
  const nombre=padre?`${padre} › ${titulo}`:titulo;
  const mas=items.length>orden.length||items.length>2
    ?`<button class="row-more" onclick="${abrir}"><span class="rm-n">${cuantas}</span><span>Ver todas<br>las de ${escapeHtml(titulo)}</span><span class="rm-arrow">→</span></button>`:'';
  return `<section class="cat-row${padre?' sub-row':''}"><div class="cat-row-head">${padre?`<span class="cr-parent">${escapeHtml(padre)} ›</span>`:''}<h3>${escapeHtml(titulo)}</h3><span class="cr-count">${cuantas} gorra${cuantas===1?'':'s'}</span><button class="cr-link" onclick="${abrir}">Ver todas ›</button></div><div class="cat-strip">${orden.map(x=>buildCard(x.p,x.i,'s')).join('')}${mas}</div></section>`;
}
function renderInicio(){
  const filas=CATEGORIAS.map(c=>{
    const todas=conIdx(p=>p.categoria===c);
    if(!todas.length)return '';
    const sinSub=todas.filter(x=>!x.p.sub);
    let html='';
    // Fila de la categoría (sin las de subcategoría); "Ver todas" abre la categoría completa
    if(sinSub.length)html+=filaInicio(c,'',sinSub,`setVista(${jsq(c)},null)`,todas.length);
    (SUBS[c]||[]).forEach(sb=>{
      const items=todas.filter(x=>x.p.sub===sb);
      if(items.length)html+=filaInicio(sb,sinSub.length?c:'',items,`setVista(${jsq(c)},${jsq(sb)})`,items.length);
    });
    return html;
  }).join('');
  return filas+`<button class="see-all" onclick="setVista('todas')">Ver todas las gorras <span>(${PRODUCTOS.length})</span></button>`;
}
window.addEventListener('popstate',e=>{
  const q=new URLSearchParams(location.search);
  const v=(e.state&&e.state.vista)||q.get('cat')||'inicio';
  const sb=e.state&&e.state.sub!==undefined?e.state.sub:q.get('sub');
  setVista(v,sb,true);
});

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
  const waText=textoConsulta(p);
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
  const en=getCart().includes(p.numero);
  mb.innerHTML=en?ICON_CHECK+' En tu pedido':ICON_CART+' Comprar';mb.classList.toggle('in',en);
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
  if(i>=0){c.splice(i,1);setCart(c);toast('Quitada de tu pedido')}
  else{c.push(numero);setCart(c);toast('¡Agregada a tu pedido! ✓');const cc=document.getElementById('cartCount');cc.classList.remove('bump');void cc.offsetWidth;cc.classList.add('bump')}
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
  const bb=document.getElementById('bbCount');
  if(bb){if(bb.textContent!==String(items.length)&&items.length){bb.classList.remove('bump');void bb.offsetWidth;bb.classList.add('bump')}bb.textContent=items.length;bb.classList.toggle('on',items.length>0)}
  document.querySelectorAll('.add-cart').forEach(b=>{
    const inCart=vigentes.includes(b.dataset.num);
    b.classList.toggle('in',inCart);b.innerHTML=inCart?ICON_CHECK+'<span class="ac-txt">Agregada</span>':ICON_CART+'<span class="ac-txt">Comprar</span>';
    b.setAttribute('aria-label',inCart?'Quitar de mi pedido':'Comprar');
  });
  const list=document.getElementById('cartItems');
  if(!items.length){
    list.innerHTML='<div class="cart-empty">Tu carrito está vacío.<br>Tocá 🛒 en las gorras que te gusten.</div>';
    document.getElementById('cartFoot').style.display='none';
  }else{
    list.innerHTML=items.map(p=>`<div class="cart-item"><img src="${escapeHtml(fotosDe(p)[0])}" alt=""><div class="ci-info"><div class="ci-name">${escapeHtml(p.nombre)}</div><div class="ci-meta">${escapeHtml(numTexto(p))}</div><div class="ci-price">${escapeHtml(precioTexto(p.precio))}</div></div><button class="ci-remove" onclick="toggleCart('${escapeHtml(p.numero)}')" aria-label="Quitar">✕</button></div>`).join('');
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
  let nombres=(cats.categorias||[]).map(c=>c.nombre);
  (cats.categorias||[]).forEach(c=>{SUBS[c.nombre]=(c.subcategorias||[]).map(x=>x.nombre||x).filter(Boolean)});
  // Subcategorías que tengan gorras aunque no estén en la lista
  PRODUCTOS.forEach(p=>{if(p.sub){const l=SUBS[p.categoria]=SUBS[p.categoria]||[];if(!l.includes(p.sub))l.push(p.sub)}});
  // Si alguna gorra tiene una categoría que no está en la lista, igual aparece su botón al final
  PRODUCTOS.forEach(p=>{if(p.categoria&&!nombres.includes(p.categoria))nombres.push(p.categoria)});
  CATEGORIAS=nombres;
  // Orden: por categoría (orden de la lista) y, dentro de cada una, por su número
  const ordenCat=c=>{const k=CATEGORIAS.indexOf(c);return k<0?999:k};
  const ordenSub=p=>p.sub?((SUBS[p.categoria]||[]).indexOf(p.sub)+1||99):0;
  PRODUCTOS=PRODUCTOS.map((p,i)=>({p,i})).sort((a,b)=>ordenCat(a.p.categoria)-ordenCat(b.p.categoria)||ordenSub(a.p)-ordenSub(b.p)||(a.p.nro||9999)-(b.p.nro||9999)||a.i-b.i).map(x=>x.p);
  buildFilters();
  const inicial=new URLSearchParams(location.search).get('cat');
  const valida=inicial&&(inicial==='todas'||CATEGORIAS.includes(inicial))?inicial:'inicio';
  const q=new URLSearchParams(location.search);
  const subIni=valida!=='inicio'&&valida!=='todas'&&q.has('sub')?q.get('sub'):null;
  history.replaceState({vista:valida,sub:subIni},'',location.href);
  setVista(valida,subIni,true);
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
