# Tienda "Obras hechas con Amor" (obrashechasconamor.com.ar)

Sitio estático de Cintia Alloco (gorras decoradas a mano). Repo: `cintiaalloco-art/tienda-cintia-2026`. Deploy: Netlify (rama `main`). Idioma de trabajo: español. Cintia no es técnica: dar pasos explícitos y archivos completos listos para copiar/pegar.

## Estructura
- `index.html` (raíz): tienda pública. Lee SOLO `data/productos.json` con fetch y arma las tarjetas (`buildCard`). Filtros de categoría fijos en el HTML (`filterCat(this,'Niñas')`); el valor debe coincidir EXACTO con `categoria` en el JSON.
- `data/productos.json`: fuente de verdad del catálogo: `{"productos":[{numero,nombre,categoria,descripcion,precio,fotos:[rutas]}]}`. Numeración N001, N002...
- `data/gorras/`: entradas sueltas del CMS. La tienda NO las lee (no usar como fuente).
- `data/categorias/`: entradas `{nombre}` de la colección Categorias del CMS.
- `images/`: fotos (JPG, máx. 1600px).
- `subir.html`: herramienta propia para Cintia (celular/PC). Usa la API de GitHub con un token clásico (`ghp_`, permiso `repo`) guardado en localStorage del navegador. Sube fotos, agrupa de a 3, publica en `productos.json`, edita/borra catálogo, cambia fotos, agrega categorías (estas últimas solo en localStorage de ese dispositivo).
- `admin/index.html` + `admin/config.yml`: Decap CMS (git-gateway, editorial_workflow). Colecciones: `productos` (archivo viejo), `gorras`, `categorias`. NO confundir `admin/index.html` con el `index.html` de la raíz.

## Reglas
- Categorías actuales: Airbag, Fuxion, Niñas, Otras ("Niño" fue renombrado a "Niñas").
- Diseño: paleta `--cream:#FBF3F0; --ink:#3B2A2C; --ink-soft:#7A5C5F; --rose:#C98A95; --deep:#A85D6B; --line:#ECD9D9`. Fuentes: Bodoni Moda (títulos, h1 en itálica), Jost (cuerpo), Parisienne SOLO en marca y "historia distinta". NO cambiar tipografías (se probó otra y se rechazó). Padding móvil uniforme, esquinas redondeadas, CTA a WhatsApp.
- Nunca escribir tokens ni claves en archivos del repo.
- Pegar texto con tildes/ñ desde el editor móvil de GitHub puede corromper la codificación (Ã¡). Preferir `github.dev` desde PC, o commits desde Code.
- En `subir.html`, el orden de fotos de un grupo sale de `g.photoIds` (no de `pool`); no cambiar eso.
- Cambios de categoría: actualizar a la vez `index.html`, `productos.json` y `admin/config.yml`.

## Pendiente
- Hecho: `index.html` y `productos.json` ya usan "Niñas"; `data/categorias/nino.json` pasó a `ninas.json` ("Niñas").
- Revisar: 2 productos (N088 y N099, "Grace 2" y "Grace 3") tienen categoría "Grace", que no existe en los filtros (solo se ven en "Todas").
- Revisar: `data/categorias/map-nombre-bugué.json` ("Bugué ", con espacio) es una categoría suelta del CMS; borrar o confirmar.
- Unificar: hoy hay 3 vías de carga (subir.html, CMS gorras, CMS catálogo viejo). Objetivo: una sola, que Cintia maneje sola.
