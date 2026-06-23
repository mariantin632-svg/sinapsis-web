# Rediseño home Sinapsis — turnos primero + reserva por profesional

Fecha: 2026-06-22
Repo: `sinapsis-web` (Astro 5 + Tailwind 4, deploy Netlify)
Web vigente: sinapsiskinesio.com.ar

## Contexto y objetivo

La home actual abre con planes/suscripciones y manda toda la conversión a WhatsApp.
La página anterior (sinapsiskinesio.com) se sentía más "vivida" e intuitiva: abría con
servicios + un botón claro de reservar turno y permitía elegir profesional.

Objetivo: traer ese feeling a la web vigente, poniendo **los turnos primero**, integrando
el motor real de turnos (**turnito**, con agenda por profesional) y manteniendo la marca
y los planes como segunda vía. Sin construir un motor de turnos propio: turnito ya existe.

## Decisiones cerradas (con Tincho)

- **Motor de turnos:** Turnito + WhatsApp (doble vía en cada tarjeta).
- **Alcance:** rediseño integral de la home (reordenar + nuevos componentes), no parche.
- **Jerarquía:** turnos primero, planes después.
- **Hero:** dirección "claro clínico" (fondo claro, tono profesional, turno al frente).
- **Equipo:** Dante Centellas se suma (traumatólogo + clínico, especialista en rodilla).
- **Correcciones:** apellido de Santiago es **Duhau** (hoy slug/foto dicen "duahu").
- **Instagram:** sumar `instagram.com/sinapsis.kinesio` en nav y footer.

## Nuevo orden de la home (`src/pages/index.astro`)

1. `Hero` (reescrito, dirección clara)
2. `ServiciosTurno` (NUEVO) — "Reservá tu turno": servicios con precio + CTA agendar
3. `EquipoPreview` (rediseñado) — tarjetas con foto + Reservar (turnito) + Consultar (WhatsApp)
4. `EnfoqueCards` (igual) — "No tratamos síntomas, buscamos el origen"
5. `PlanesSection` (igual, baja de posición)
6. Quiz "tu plan ideal" (igual)
7. `TestimoniosSection` (igual)
8. `ObrasSocialesPreview` (igual)
9. `FaqPreview` (igual)
10. `UbicacionSection` (igual)

## Capa de datos / contenido

### `src/content/_types.ts`
- `Profesional`: agregar `turnito?: string` (URL de agenda) y `modalidades?: string[]`
  (chips: "Presencial", "Online") y `destacado_label?: string` (ej. "Esp. rodilla").

### `src/content/equipo.json`
- **Martín Niro** — `turnito: https://turnito.app/c/Dp6r8VFBxNgAiY`, modalidades `["Presencial"]`.
- **Santiago Duhau** — corregir `slug: "santiago-duhau"`, `foto: "/equipo/santiago-duhau.jpg"`;
  `turnito: https://turnito.app/c/aJJQ3bDYbHG8Ny`, modalidades `["Presencial"]`.
- **Jimena Avalos** — `turnito: https://turnito.app/c/7f4JQjTZTdWqzZ`, modalidades `["Presencial"]`.
- **Dante Centellas** (NUEVO) — `slug: "dante-centellas"`, especialidades
  `["Traumatología", "Clínica médica"]`, `destacado_label: "Esp. rodilla"`,
  modalidades `["Presencial", "Online"]`, `bio_corta: "Médico traumatólogo y clínico. Especialista en rodilla."`,
  `foto: "/equipo/dante-centellas.jpg"`, `turnito: https://turnito.app/c/3EmPXSBaUUF7Pe`.
- Orden de aparición en home/equipo: Martín, Dante, Santiago, Jimena.

### `src/content/sitio.json`
- `contacto.instagram_url: "https://www.instagram.com/sinapsis.kinesio/"` (se mantiene el handle).
- `turnito.hub: "https://turnito.app/p/940905mcy5gc5b9o"` (fallback / CTAs genéricos).

### Assets
- Renombrar `public/equipo/santiago-duahu.jpg` → `santiago-duhau.jpg` (ídem `presentacion-`).
- **Pendiente (drop-in):** `public/equipo/dante-centellas.jpg`. Hasta que llegue, la tarjeta
  usa fallback de iniciales (`onerror`) — el sitio no se rompe.
- Fotos de Martín/Santiago/Jimena: se mantienen las del repo.

## Componentes

### `Nav.astro`
- Links acortados: Inicio · Servicios · Equipo · Planes · Obras sociales · FAQ.
- A la derecha: **Agendar turno** (botón menta, → turnito hub) como CTA principal;
  WhatsApp pasa a icono/botón secundario; sumar icono de Instagram.
- Mobile: menú colapsable (`<details>`) + "Agendar turno" siempre visible.

### `Hero.astro` (reescrito)
- Fondo claro. Kicker: "Kinesiología · Osteopatía · Traumatología".
- H1: "Tu cuerpo en las mejores manos." (segunda línea acento púrpura).
- Subtítulo: "No tratamos síntomas: buscamos el origen. Reservá con el profesional que necesitás, presencial u online."
- CTAs: **Agendar turno** (púrpura, → turnito hub) + **Ver planes →** (outline, → /planes).
- Trust band: 4.9★ (64 reseñas) · +600 pacientes · 5+ años.

### `ServiciosTurno.astro` (NUEVO, home)
- Título "Reservá tu turno". Reusa `servicios-sueltos.json` (kinesio, osteo, traumato, nutri, domicilio).
- Cada servicio: nombre, descripción corta, precio(s) por modalidad.
- CTA de sección: **Agendar turno** (→ turnito hub) + link "Ver todos los servicios sueltos →" (/servicios-sueltos).
- No es reserva por servicio (turnito reserva por profesional); la sección informa y empuja a agendar.

### `EquipoCard.astro` + `EquipoPreview.astro` (rediseñados)
- Card: foto (circular, fallback iniciales), nombre + apellido, especialidades, chips de modalidad
  y `destacado_label`, bio corta.
- Dos botones: **Reservar turno** (menta, → `profesional.turnito` o hub si falta) y
  **Consultar** (outline púrpura, → WhatsApp con mensaje precargado por profesional).
- `EquipoPreview`: grilla de 4 (2×2 en desktop, 1 col mobile). Mantener link "Ver perfil completo →".

### `equipo.astro` (página /equipo)
- Sumar Dante y los mismos dos CTA de reserva por profesional. Reusa la card rediseñada.

### `Footer.astro`
- Agregar enlace a Instagram y un CTA "Agendar turno" (→ turnito hub).

## Helpers
- `lib/whatsapp.ts`: se mantiene. Mensaje por profesional se arma en la card
  (ej. "Hola! Quería consultar un turno con {nombre}.").
- Links a turnito: simples `<a target="_blank" rel="noopener">`. Si `profesional.turnito`
  falta, cae al hub de `sitio.json`.

## Fuera de alcance
- Cambiar precios o contenido de planes/packs.
- Construir motor de turnos propio (se usa turnito).
- Rediseño de páginas internas más allá de /equipo.

## Testing
- Revisar y actualizar tests en `tests/` que asuman copy de hero o links de nav.
- `pnpm test` (vitest) y `pnpm build` deben pasar antes de cerrar.
- Verificación visual de la home con `pnpm dev`.

## Riesgos / notas
- Foto de Dante pendiente: mitigado con fallback de iniciales.
- Precios de `servicios-sueltos.json` difieren de algunas memorias; se respeta el dato del repo
  (no se tocan precios en este trabajo).
