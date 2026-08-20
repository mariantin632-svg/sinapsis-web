# Orientador de pacientes — "¿Por dónde empiezo?" (diseño)

**Fecha:** 2026-08-20
**Estado:** Implementado y ABIERTO AL PÚBLICO desde el 20/08/2026
**Repo:** sinapsis-web (Astro 5 + TS + Tailwind 4)

## Objetivo

Que un paciente que llega a la web sin saber qué necesita conteste unas pocas preguntas
sobre lo que le pasa y salga con **un camino sugerido**: consulta médica urgente,
traumatología primero, kinesiología u osteopatía.

Orienta, **no diagnostica**. No nombra patologías, no promete certezas y no reemplaza
la evaluación presencial.

## Alcance v1

**Entra:** página propia, cuestionario adaptativo por zona, corte por banderas rojas,
cuatro resultados posibles, cierre por WhatsApp con resumen prellenado.

**No entra:** guardar respuestas, pedir nombre o mail, sugerir un plan comercial concreto,
sumar nutrición / online / evaluación funcional como salidas, analytics.

**Reemplaza:** el `MapaCorporal` de `/tests` — daba una recomendación fija por zona, sin
banderas rojas ni criterio. Su lugar en la página lo toma el orientador (decisión de Tincho,
20/08). El componente se borró; vive en la historia de git si alguna vez hace falta.

---

## 1 · Arquitectura

| Archivo | Rol |
|---|---|
| `src/pages/orientador.astro` | Página: BaseLayout + hero + wizard + encuadre legal |
| `src/components/orientador/Orientador.astro` | Wizard: una pregunta por pantalla, progreso, atrás |
| `src/content/orientador.json` | **Contenido clínico**: zonas, preguntas, banderas, textos |
| `src/lib/orientador.ts` | **Motor**: `evaluar(respuestas) → Resultado`, función pura |
| `tests/unit/orientador.test.ts` | Casos clínicos del motor (vitest, sin browser) |
| `src/components/home/OrientadorCta.astro` | Bloque de la home: chips de zona que entran con deep link |
| `tests/e2e/orientador.spec.ts` | Playwright: flujo completo, corte, atrás, deep link, mobile |

**Principio de separación.** El motor no sabe nada de DOM y el JSON no sabe nada de lógica.
Consecuencias buscadas:

- Tincho corrige contenido clínico y copy editando **solo el JSON**.
- Una regla nueva se prueba con casos escritos (`lumbar + 2 semanas + sin trauma + mejora
  con movimiento → kine`) que corren solos y avisan si rompen otra regla.
- El wizard se puede rediseñar sin tocar criterio clínico.

**Sin framework nuevo.** Astro + un `<script>` bundleado por Vite que importa el motor y el
JSON de contenido. Estado en memoria, cero dependencias en runtime.

**Motor por scoring, no por árbol de `if`.** Un árbol anidado se vuelve inmanejable con 8
zonas y no sabe expresar el caso mixto. Acá: las urgencias y traumatología son **cortes
duros** evaluados primero; el reparto kine/osteo sale de una suma de puntos, y el empate es
un resultado legítimo (kine con complemento osteopático), no un error a desempatar.

---

## 2 · Flujo de preguntas

Nueve preguntas en el recorrido completo, más una condicional si hubo trauma reciente.
Si el paciente marca una bandera roja el test corta en la segunda. Una por pantalla, barra
de progreso, botón atrás, sin datos personales.

### Fijas — todas las zonas

**P1 · ¿Dónde te molesta?**
Cuello · Hombro · Codo o muñeca · Espalda baja (lumbar) · Cadera o pelvis · Rodilla ·
Tobillo o pie · Varias zonas o dolor difuso

**P2 · ¿Alguna de estas cosas te está pasando?** *(selección múltiple + "ninguna")*
Corta el test si marca cualquiera. Ver §3.

**P3 · ¿Cómo empezó?**
De un golpe, torcedura o accidente · De a poco, sin causa clara · Después de un esfuerzo o
de entrenar · Después de una cirugía

**P4 · ¿Hace cuánto?**
Menos de 72 horas · Menos de un mes · Entre 1 y 3 meses · Más de 3 meses

**P5 · ¿Te vio un médico por esto?**
Sí, y me pidió estudios · Sí, pero sin estudios · No, nunca

**P5b · condicional — solo si P3 = golpe/torcedura y P4 = menos de 72 h**
¿Se hinchó enseguida, sentiste un crujido o desgarro, o sentís que la zona falla o se te va?
Sí · No

Es la pregunta que alimenta R1a, y va acá porque las ramas de cuello, lumbar, cadera y codo
no preguntan por esos signos y sin ella un trauma reciente en esas zonas no dispararía
traumatología.

### Rama por zona — 2 preguntas + recurrencia

**Recurrencia (todas las zonas):** ¿Es la primera vez que te pasa, o te vuelve seguido?

| Zona | Pregunta A | Pregunta B |
|---|---|---|
| Cuello | ¿Baja al brazo, con hormigueo o adormecimiento? | ¿Empeora con la pantalla, el estrés o al final del día? |
| Hombro | ¿Podés levantar el brazo por encima de la cabeza? | ¿Te duele de noche al acostarte de ese lado? |
| Codo / muñeca | ¿Duele al agarrar o hacer fuerza con la mano? | ¿Sentís hormigueo en los dedos? |
| Lumbar | ¿El dolor baja a la pierna? | ¿Mejora cuando te movés o empeora? |
| Cadera / pelvis | ¿Duele al caminar o subir escaleras? | ¿Sentís que un lado traba o perdió movilidad? |
| Rodilla | ¿Se hinchó? | ¿Se traba, falla o sentís que se te va? |
| Tobillo / pie | ¿Te lo torciste alguna vez? | ¿Sentís inestabilidad en terreno irregular? |
| Varias zonas | ¿Estás rígido a la mañana y aflojás al moverte? | ¿Coincide con épocas de estrés o de dormir mal? |

### Cierre — todas las zonas

**P9 · ¿Qué buscás?**
Que se me vaya el dolor · Volver a entrenar o competir · Que deje de volver ·
Recuperarme de una cirugía o de una lesión

---

## 3 · Motor: reglas

Se evalúan en orden. La primera que matchea gana y detiene el resto.

**Corte anticipado.** Después de cada respuesta el wizard le pregunta al motor si ya hay un
corte duro (R0 o cualquier R1). Si lo hay, muestra el resultado sin seguir preguntando: lo
que falta no puede cambiar la conducta. Quien decide es el motor, no la UI.

### R0 · Urgencia — corta el test

Cualquiera de estas dispara el resultado 🚨 y cancela las preguntas siguientes:

- Pérdida de fuerza que va en aumento
- Alteración para controlar la orina o la materia fecal, o adormecimiento en la zona del pantalón
- Fiebre junto con el dolor
- Dolor de noche que no cede con nada y no depende de la posición
- Accidente de alto impacto (auto, moto, caída de altura)
- Deformidad visible, o no poder apoyar ni mover nada el miembro
- Antecedente de cáncer, o uso prolongado de corticoides
- Pérdida de peso sin explicación

### R1 · Traumatología primero

Cualquiera de estas tres:

- **a)** Empezó de un golpe/torcedura, hace menos de 72 h, **y** P5b es "sí" (hinchazón
  inmediata, crujido o desgarro, o sensación de que falla o se va).
  *(La imposibilidad total de apoyar o mover ya es R0.)*
- **b)** Es post-quirúrgico y no tiene indicación médica de rehabilitación.
- **c)** Lleva más de 3 meses y nunca lo vio un médico por esto.

### R2 / R3 · Kinesiología vs osteopatía — scoring

Si no disparó R0 ni R1, cada respuesta suma puntos:

| Respuesta | kine | osteo |
|---|---|---|
| Empezó de golpe / torcedura | 3 | 0 |
| Empezó después de esfuerzo o de entrenar | 2 | 1 |
| Empezó de a poco, sin causa clara | 0 | 3 |
| Post-operatorio (con indicación) | 4 | 0 |
| Menos de 72 h | 2 | 0 |
| Menos de un mes | 1 | 1 |
| 1 a 3 meses | 0 | 2 |
| Más de 3 meses | 0 | 2 |
| Médico sí, con estudios | 2 | 0 |
| Médico sí, sin estudios | 1 | 1 |
| Nunca lo vio un médico | 0 | 1 |
| Zona: varias / difuso | 0 | 4 |
| Le vuelve seguido | 0 | 3 |
| Es la primera vez | 1 | 0 |
| Irradia, hormiguea o adormece | 2 | 1 |
| Se hinchó / se traba / falla / inestabilidad | 3 | 0 |
| Duele al cargar o usar la zona (sobrecarga) | 2 | 0 |
| Rigidez que afloja al moverse | 0 | 2 |
| Empeora con estrés, pantalla o dormir mal | 0 | 2 |
| Objetivo: que se me vaya el dolor | 1 | 1 |
| Objetivo: volver a entrenar | 3 | 0 |
| Objetivo: que deje de volver | 0 | 2 |
| Objetivo: recuperarme de cirugía o lesión | 4 | 0 |

**Decisión** sobre `diff = kine - osteo`:

| Condición | Resultado |
|---|---|
| `diff >= 3` | 💪 Kinesiología |
| `diff <= -3` | 🖐️ Osteopatía |
| `-3 < diff < 3` | 💪 Kinesiología con complemento osteopático |

**Guarda de seguridad:** si empezó de un golpe/torcedura y lleva menos de un mes, nunca
devuelve osteopatía sola — el piso es kinesiología. Un cuadro traumático reciente se
rehabilita, no se "libera".

---

## 4 · Resultados y copy

Fórmula fija, sin nombrar patologías:

> **Por lo que contás, lo más probable es que te convenga empezar por [camino].**
> [2 o 3 razones en lenguaje de paciente, armadas con las respuestas que más pesaron]
> **Qué pasa en la primera visita:** [3 líneas]
> *Esto es una orientación, no un diagnóstico. Con una evaluación presencial nos acercamos
> lo más posible a lo que te está pasando.*

| Resultado | Encuadre |
|---|---|
| 🚨 Urgencia | No vende nada. "Lo que contás necesita que te vea un médico hoy." Guardia o médico de cabecera. Ofrece la consulta traumatológica del centro como opción, sin insistir. |
| 🩺 Traumatología primero | "Antes de rehabilitar hay que saber qué hay." Explica que el centro tiene consulta traumatológica, así no lo mandamos a dar vueltas. |
| 💪 Kinesiología | Rehabilitación activa, personalizada, con ejercicios para casa. Sin "uno a uno". |
| 🖐️ Osteopatía | Terapia manual, sesión individual de una hora. Sin prometer que resuelve todo. |
| 💪 + 🖐️ Combinado | Kinesiología como eje, complemento osteopático para lo que no afloja. |

**Restricciones de copy (no negociables):**

- Nunca "sabés qué tenés" ni "te decimos qué es". Siempre "nos acercamos lo más posible".
- Kinesiología es **personalizada**, nunca "uno a uno". Osteopatía sí es individual.
- Osteopatía no entrega informe.
- Nada de cargos ni de "el director te atiende": los profesionales se nombran como
  profesionales.

---

## 5 · Cierre

**CTA principal — WhatsApp con el resumen ya escrito**, vía `buildWhatsAppUrl` de
`src/lib/whatsapp.ts` y el número de `content/sitio.json`:

> Hola! Hice el test de orientación en la web. Me molesta [zona] hace [tiempo], empezó
> [causa], y me sugirió empezar por [camino]. Quería consultar.

**CTA secundario:** Turnito (`sitio.turnito.hub`).

**En resultado 🚨** el orden se invierte: primero el mensaje de consulta médica, el WhatsApp
queda como "si querés que te orientemos, escribinos" y Turnito no aparece.

**Rehacer el test:** botón de reinicio siempre visible en la pantalla de resultado.

---

## 6 · Accesibilidad y UX

- Navegable por teclado completo; foco visible; opciones como `<button>` reales, no divs.
- `aria-live` en el cambio de pregunta para que un lector de pantalla anuncie el avance.
- Respeta `prefers-reduced-motion`, como el resto de la web.
- Mobile primero: una columna, targets de 44 px mínimo.
- Tokens `sn-*` de `src/styles`, tipografía y paleta de la marca. Sin salmón.

---

## 7 · Testing

**Unitarios del motor** (`orientador.test.ts`) — como mínimo un caso por regla:

1. Cualquier bandera roja → urgencia, sin importar el resto.
2. Golpe + menos de 72 h + se hinchó → traumatología.
3. Post-quirúrgico sin indicación → traumatología.
4. Más de 3 meses + nunca vio médico → traumatología.
5. Lumbar + 2 semanas + esfuerzo + mejora al moverse + primera vez → kinesiología.
6. Cuello + 4 meses + de a poco + vuelve seguido + estrés → osteopatía.
7. Varias zonas + rigidez matinal + vuelve seguido → osteopatía.
8. Rodilla + golpe hace 2 semanas → nunca osteopatía sola (guarda de seguridad).
9. Caso ambiguo → combinado.

**E2E (Playwright)** — flujo completo hasta resultado, corte por bandera roja y por
traumatología, botón atrás, deep link `?zona=`, links entrantes en las dos barras y el footer,
link de WhatsApp bien formado, render en 375 / 768 / 1440.

---

## 8 · Publicación

La v1 salió en vivo sin difundir (noindex, fuera del sitemap, sin links) el 20/08/2026 y se
**abrió al público el mismo día**, por decisión de Tincho después de revisarla.

Puntos de entrada, en orden de tráfico esperado:

| Dónde | Qué |
|---|---|
| Home | Bloque `OrientadorCta` con los 8 chips de zona, después de `ServiciosTurno` |
| Los dos menús | `Nav.astro` (interiores) y el header propio dentro de `Hero.astro` — son dos archivos, hay que tocar los dos |
| Footer | Columna Servicios, primero de la lista |
| `/tests` | Test 1, en el lugar que ocupaba el `MapaCorporal` |

**Deep link.** Los chips de la home apuntan a `/orientador?zona=<id>`: el wizard entra con la
primera pregunta ya contestada y el botón atrás sigue funcionando. Una zona inexistente en la
query se ignora y el test arranca de cero.

**Costo de la barra.** Con el link nuevo el nav pasó a 9 ítems y a 1280 px se desbordaba 54 px
—lo cazó el test `apoyar.spec.ts` que mide las dos barras—. Se resolvió comprimiendo el
espaciado de la píldora (`gap-0`, `px-1.5` en el contenedor, `px-[5px]` por link) en los dos
archivos. **La píldora quedó sin holgura: un décimo ítem no entra sin sacar otro.**

## 9 · Encuadre medicolegal

- Disclaimer visible en la pantalla inicial y repetido en el resultado.
- El test no guarda ni transmite nada: las respuestas viven en memoria del navegador y se
  pierden al recargar. No hay tratamiento de datos de salud.
- Las banderas rojas siempre ganan sobre cualquier otra regla.
- El contenido clínico del JSON requiere revisión y firma de Tincho antes de publicar.

## 10 · Riesgos conocidos

| Riesgo | Mitigación |
|---|---|
| Falso negativo en banderas rojas (el paciente no reconoce el síntoma) | Redacción en lenguaje llano, no técnico; disclaimer en todas las pantallas |
| El paciente usa el test en lugar de consultar | Copy que insiste en que orienta, no reemplaza |
| Las reglas quedan desactualizadas | Todo en un JSON revisable, con casos de prueba que documentan la intención |
