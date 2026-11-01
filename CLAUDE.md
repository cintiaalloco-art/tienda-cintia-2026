# Tienda "Obras hechas con Amor" (obrashechasconamor.com.ar)

Sitio estático de Cintia Alloco (gorras decoradas a mano). Repo: `cintiaalloco-art/tienda-cintia-2026`. Deploy: Netlify (rama `main`). Idioma de trabajo: español. Cintia no es técnica: dar pasos explícitos y archivos completos listos para copiar/pegar.

## Estructura
- `index.html` (raíz) + `tienda.js`: tienda pública. `tienda.js` lee `data/productos.json`, `data/categorias.json` y `data/videos.json` y arma tarjetas, botones de filtro, carrito y sección de videos. Nada de categorías está escrito a mano en el HTML.
- `data/productos.json`: fuente de verdad del catálogo: `{"productos":[{numero,nombre,categoria,descripcion,precio,fotos:[rutas],videos?:[rutas],vendida?:true}]}`. Numeración N001, N002... El orden del array es el orden en la tienda. Precio con formato `$33.000`.
- `data/categorias.json`: `{"categorias":[{"nombre":"Airbag"},...]}`. El orden es el orden de los botones. La tienda solo muestra botones de categorías con al menos una gorra; si una gorra tiene una categoría que no está en la lista, igual aparece su botón al final.
- `data/videos.json`: `{"videos":[{"titulo","url"}]}`. `url` puede ser YouTube (incluye shorts), Instagram, TikTok o una ruta `videos/x.mp4`. La sección "Videos" y su link del menú solo aparecen si hay al menos uno.
- `images/`: fotos (JPG, máx. 1600px). `videos/`: videos cortos subidos desde el panel (máx. 40 MB).
- `subir.html`: ÚNICO panel de Cintia (celular/PC), con pestañas Subir / Catálogo / Categorías / Videos / Configuración. Usa la API de GitHub con un token clásico (`ghp_`, permiso `repo`) guardado en localStorage. Tiene modo demo que lee los JSON del sitio y no guarda nada.
  - Subir: agrupa fotos de a 3, video opcional por modelo, publica en `productos.json`. Los nombres de archivo llevan número y marca de tiempo para no chocar nunca con fotos existentes.
  - Catálogo: buscar/filtrar, editar, marcar Vendida, ordenar gorras, ordenar/cambiar/agregar fotos, agregar/quitar videos. Los cambios se juntan y se publican con "Publicar cambios".
  - Categorías y Videos: cada cambio se guarda al instante en GitHub. Renombrar o borrar una categoría actualiza también las gorras en `productos.json`.
- `admin/index.html`: el viejo Decap CMS fue retirado; la página solo redirige a `/subir.html`. `admin/config.yml`, `data/gorras/` y `netlify/functions/` (restos del CMS) se borraron.

## Carrito
- Se guarda en localStorage de la clienta (`oha_carrito`, lista de números). Cada gorra se agrega una vez (son únicas). "Enviar pedido" abre WhatsApp (543468598805) con la lista, el total, el nombre y un comentario. No hay pago online (Mercado Pago quedó como opción futura).
- Las gorras `vendida` muestran la etiqueta "Vendida", no se pueden agregar al carrito y tienen el botón "Pedir similar".

## Reglas
- Categorías actuales: Airbag, Fuxion, Bugué, Grace, Niñas, Otras. Se manejan SOLO desde `data/categorias.json` (pestaña Categorías de subir.html).
- Diseño: paleta `--cream:#FBF3F0; --ink:#3B2A2C; --ink-soft:#7A5C5F; --rose:#C98A95; --deep:#A85D6B; --line:#ECD9D9`. Fuentes: Bodoni Moda (títulos, h1 en itálica), Jost (cuerpo), Parisienne SOLO en marca y "historia distinta". NO cambiar tipografías (se probó otra y se rechazó). Padding móvil uniforme, esquinas redondeadas, CTA a WhatsApp.
- En `index.html`, el bloque `@media(max-width:640px)` de las tarjetas tiene que ir al FINAL del `<style>` (si va antes, los estilos generales lo pisan). La grilla móvil usa `repeat(3,minmax(0,1fr))` (con `1fr` solo, los títulos con nowrap la ensanchan más que la pantalla).
- Nunca escribir tokens ni claves en archivos del repo.
- Pegar texto con tildes/ñ desde el editor móvil de GitHub puede corromper la codificación (Ã¡). Preferir `github.dev` desde PC, o commits desde Code.
- En `subir.html`, el orden de fotos de un grupo sale de `g.photoIds` (no de `pool`); no cambiar eso.
- La PR #11 (rama `cms/productos/catalogo`) era un borrador viejo del CMS con un catálogo de 33 gorras: se cerró sin mergear. No reabrirla.

## Pendiente
- Borrar las ramas `cms/...` viejas (lo hace Cintia desde GitHub → Branches).
- Opcional: pago con Mercado Pago sobre el carrito.
- Único repo en uso: `tienda-cintia-2026`. `Tienda-Cintia` y `Tienda-Cintia-2` son viejos (borrarlos lo hace Cintia desde Settings de cada repo).
