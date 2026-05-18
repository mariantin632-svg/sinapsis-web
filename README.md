# Sinapsis Web

Sitio institucional de **Sinapsis** — Centro de Rehabilitación Traumatológica y Deportiva (José C. Paz, Buenos Aires).

**Producción (cuando esté desplegado):** https://sinapsiskinesio.com.ar
**Stack:** Astro 5 + Tailwind CSS 4 + TypeScript · Hosted on Netlify

---

## Estructura del sitio (23 páginas)

| Sección | Páginas |
|---|---|
| Home | `/` |
| Planes (suscripciones) | `/planes` + `/planes/{essence,focus,total,elite}` |
| Packs (pago único) | `/packs` + `/packs/{sos-express, reset-lumbar, cuello-libre, postura-pro, rodilla-total, recovery-athlete, retorno-seguro, movilidad-60, mujer-bienestar, post-cirugia, empresa-10}` |
| Servicios sueltos | `/servicios-sueltos` |
| Equipo | `/equipo` |
| Obras sociales | `/obras-sociales` |
| FAQ | `/faq` |
| Contacto | `/contacto` |

Todo conversiona vía WhatsApp directo (`wa.me/5491163678308`) con mensajes pre-cargados según el plan/pack.

---

## Editar contenido (sin tocar código)

Los datos del sitio viven en archivos JSON en `src/content/`:

| Archivo | Qué controla |
|---|---|
| `sitio.json` | Dirección, horarios, WhatsApp, Instagram, rating Google |
| `planes.json` | 4 planes de suscripción × 4 duraciones (mes/3m/6m/12m) cada uno |
| `packs.json` | 11 packs por necesidad (precio carta, precio sugerido, público ideal) |
| `servicios-sueltos.json` | Sesiones individuales con precios |
| `equipo.json` | Profesionales (foto, matrícula, especialidades, bio) |
| `obras-sociales.json` | Lista de obras sociales aceptadas |
| `faq.json` | Preguntas frecuentes agrupadas por categoría |
| `testimonios.json` | Reseñas destacadas |

**Para actualizar un precio:** editar el JSON, commit, push → Netlify reconstruye solo en ~2 minutos.

**Para sumar un pack nuevo:** agregar una entrada al array de `packs.json` siguiendo el formato de los existentes. La página `/packs/[slug]` lo recoge automáticamente.

---

## Inputs pendientes (placeholders a reemplazar)

Antes del go-live, hay placeholders temporales que conviene reemplazar con material real:

- [ ] **Foto hero del centro** → reemplazar el placeholder gris en `src/components/home/Hero.astro`
- [ ] **Fotos del centro (4)** → poner en `public/galeria/foto-{1..4}.jpg` (referenciadas desde `src/components/home/GaleriaSection.astro`)
- [ ] **Fotos del equipo** → `public/equipo/martin-niro.jpg`, `public/equipo/santiago-duahu.jpg`
- [ ] **Logos obras sociales (PNG transparente)** → `public/logos-obras-sociales/{osde,galeno,swiss-medical,ioma}.png` + actualizar `src/content/obras-sociales.json` si la lista cambia
- [ ] **og-image.jpg** (preview en redes) → `public/og-image.jpg` (recomendado 1200×630px)
- [ ] **Favicon real** → `public/favicon.svg`
- [ ] **Matrículas reales** de Martín y Santi → `src/content/equipo.json` (hoy dice "MN PLACEHOLDER")
- [ ] **Bios largas** de cada profesional → agregar campo `bio_larga` y `formacion` opcionales a cada entrada de `equipo.json`
- [ ] **URL real de reseñas Google** → `sitio.json > google_reviews.url` (hoy `cid=PLACEHOLDER`)
- [ ] **8-12 FAQs reales** con respuestas → ampliar `src/content/faq.json` (hoy hay 5 placeholder)
- [ ] **Testimonios reales** con autorización → `src/content/testimonios.json`

Las imágenes faltantes degradan elegantemente (las cards y placeholders no rompen el layout si la imagen no carga).

---

## Desarrollo local

Pre-requisitos: Node 20+, pnpm 9+, Git.

```bash
pnpm install         # instalar dependencias (1ra vez)
pnpm dev             # dev server en http://localhost:4321
pnpm build           # build estático en dist/
pnpm preview         # servir el build local en :4321
pnpm test            # unit tests con Vitest
pnpm test:e2e        # E2E con Playwright (smoke de las 23 páginas)
pnpm test:all        # ambos
```

---

## Deploy a Netlify (primera vez — pasos manuales)

1. **Crear repo en GitHub** (público o privado, da igual):
   ```bash
   git remote add origin git@github.com:<tu-usuario>/sinapsis-web.git
   git branch -M main
   git push -u origin main
   ```

2. **Conectar a Netlify:**
   - Entrar a https://app.netlify.com → "Add new site" → "Import an existing project"
   - Autorizar GitHub, elegir el repo `sinapsis-web`
   - Settings auto-detectados desde `netlify.toml`: build command `pnpm build`, publish dir `dist`
   - Click "Deploy site" — primera build tarda ~2 minutos
   - Anotar la URL temporal `<algo>.netlify.app`

3. **Conectar dominio `sinapsiskinesio.com.ar`:**
   - En Netlify: Site → Domain settings → "Add custom domain" → `sinapsiskinesio.com.ar`
   - Netlify mostrará un IP / CNAME. Copiarlos.
   - En el panel del registrador del dominio (NIC.ar o donde lo compraste):
     - Registro **A** apex (`@`) → IP de Netlify (típicamente `75.2.60.5`)
     - Registro **CNAME** `www` → la URL `.netlify.app` del sitio
   - Esperar propagación DNS (5-30 min)
   - En Netlify, click "Provision certificate" — SSL automático Let's Encrypt
   - Verificar: `curl -I https://sinapsiskinesio.com.ar` debe devolver `HTTP/2 200`

4. **Decisión sobre `sinapsiskinesio.com` (Hostinger viejo):**
   - **Recomendado:** configurar redirect 301 desde Hostinger hacia `sinapsiskinesio.com.ar` para no perder SEO acumulado
   - Alternativas: dejarla viva con banner "Visitanos en nuestro nuevo sitio", o dar de baja al expirar

5. **Validar deploy con tests E2E:**
   ```bash
   PLAYWRIGHT_BASE_URL=https://sinapsiskinesio.com.ar pnpm test:e2e
   ```
   Expected: 26/26 PASS contra producción.

---

## Updates posteriores

Una vez conectado el repo a Netlify, cualquier `git push origin main` dispara un build + deploy automático en ~2 minutos. Workflow típico:

```bash
# Cambiar un precio
$EDITOR src/content/planes.json
git add -A && git commit -m "chore: update plan Focus monthly price"
git push
# → Netlify reconstruye y deploya solo en ~2 min
```

---

## Stack y dependencias clave

- **Astro 5.18** — generador estático con TypeScript strict
- **Tailwind CSS 4** (via `@tailwindcss/vite`) con brand tokens en `src/styles/global.css` usando `@theme`
- **@fontsource/inter** — Inter self-hosted (no Google Fonts blocking)
- **@astrojs/sitemap** — sitemap.xml automático en cada build
- **Vitest 4** — unit tests (lib/whatsapp, lib/precios)
- **Playwright 1.60** — E2E smoke + interactivity tests
- **Lighthouse** (devDep) — auditorías locales antes de deploy

---

## Métricas de calidad actuales

- **Build:** 23 páginas + sitemap-index.xml en ~2-3s
- **Tests:** 9 unit + 26 E2E = 35/35 pasando
- **Lighthouse:**
  - Performance: 98-100
  - SEO: 100 / 100
  - Accessibility: 89-91 (pendiente fix de contraste de labels opacity-55 y target-size de chips/buttons para 100%)

---

## Convenciones del repo

- Branch principal: `main`
- Commit messages: convencionales (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`)
- Sin CI configurado todavía (la build de Netlify es el quality gate de facto)

---

## Contexto

Este sitio reemplaza al one-page anterior `sinapsiskinesio.com` (en Hostinger, builder visual). Lo nuevo expone la oferta completa (planes recurrentes + packs únicos), separa por página cada plan/pack (mejor SEO), y mantiene todo el contenido editable desde JSONs sin tocar código.

La app de gestión interna de Sinapsis (Google Apps Script + Sheets) es un sistema **completamente separado** y este sitio no se conecta con ella — son dos proyectos independientes que comparten solo la marca.
