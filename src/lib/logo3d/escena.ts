// Logo de Sinapsis en volumen (Three.js), para el footer.
// Las letras salen de los contornos reales de Poppins (glyphs.json: 600 el título, 500 la bajada),
// el isotipo se reconstruye como dos círculos menta unidos por un cuello fino + dos círculos blancos.
// Coordenadas en "px del logo horizontal" con y hacia arriba; al final se escala a unidades de escena.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import glyphs from './glyphs.json';

type Cmd = (string | number)[];
interface Texto { w: number; cmds: Cmd[] }

const GIRO = 3.4; // segundos que dura la vuelta
const PAUSA = 6; // segundos quieto de frente entre vueltas
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function shapesDesde(cmds: Cmd[]) {
  const sp = new THREE.ShapePath();
  for (const c of cmds) {
    const n = c as [string, ...number[]];
    switch (n[0]) {
      case 'M': sp.moveTo(n[1], n[2]); break;
      case 'L': sp.lineTo(n[1], n[2]); break;
      case 'Q': sp.quadraticCurveTo(n[1], n[2], n[3], n[4]); break;
      case 'C': sp.bezierCurveTo(n[1], n[2], n[3], n[4], n[5], n[6]); break;
    }
  }
  // TrueType con y hacia arriba: los contornos exteriores van en sentido horario
  return sp.toShapes(false);
}

function texto(data: Texto, escala: number, prof: number, bisel: number, x: number, base: number, mat: THREE.Material) {
  const geo = new THREE.ExtrudeGeometry(shapesDesde(data.cmds), {
    depth: prof / escala, bevelEnabled: true,
    bevelThickness: bisel / escala, bevelSize: (bisel * 0.55) / escala,
    bevelSegments: 5, curveSegments: 8,
  });
  const m = new THREE.Mesh(geo, mat);
  m.scale.setScalar(escala);
  m.position.set(x, base, -prof / 2);
  return m;
}

// Isotipo
const R = 31.5, C = 34, CUELLO = 9;
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}
function sdfMenta(x: number, y: number) {
  const d1 = Math.hypot(x + C, y - C) - R;
  const d2 = Math.hypot(x - C, y + C) - R;
  const px = x + C, py = y - C, bx = 2 * C, by = -2 * C;
  const h = Math.max(0, Math.min(1, (px * bx + py * by) / (bx * bx + by * by)));
  const dn = Math.hypot(px - bx * h, py - by * h) - CUELLO;
  return smin(Math.min(d1, d2), dn, 18);
}
function formaMenta() {
  // La forma es estrellada desde el centro: un rayo por ángulo y bisección sobre el borde
  const pts: THREE.Vector2[] = [];
  const N = 240;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, dx = Math.cos(a), dy = Math.sin(a);
    let t = 110;
    while (t > 0 && sdfMenta(dx * t, dy * t) > 0) t -= 0.5;
    let lo = t, hi = t + 0.5;
    for (let j = 0; j < 20; j++) {
      const m = (lo + hi) / 2;
      if (sdfMenta(dx * m, dy * m) > 0) hi = m; else lo = m;
    }
    pts.push(new THREE.Vector2(dx * lo, dy * lo));
  }
  return new THREE.Shape(pts);
}

export interface Logo3D { pausar(): void; reanudar(): void; girar(): void; destruir(): void }

export interface OpcionesLogo3D {
  /** Con la bajada "Centro de Rehabilitación…" (footer) o solo isotipo + SINAPSIS (barra). */
  bajada?: boolean;
  /** 'ciclo': vuelta + pausa, para siempre. 'unaVez': una vuelta al montar y después solo con girar(). */
  modo?: 'ciclo' | 'unaVez';
  /** Si se puede girar a mano arrastrando (en la barra el logo es un link, ahí no). */
  arrastrable?: boolean;
}

export function montarLogo3D(
  canvas: HTMLCanvasElement,
  { bajada: conBajada = true, modo = 'ciclo', arrastrable = true }: OpcionesLogo3D = {},
): Logo3D {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.environment = env;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(8, 1, 0.1, 200);

  const key = new THREE.DirectionalLight(0xfff6ee, 2.0);
  key.position.set(-4, 6, 6);
  const rim = new THREE.DirectionalLight(0x9d86ff, 2.4);
  rim.position.set(3, 2, -6);
  const fill = new THREE.DirectionalLight(0x96c2b9, 0.5);
  fill.position.set(6, -2, 4);
  scene.add(key, rim, fill);

  const blanco = new THREE.MeshPhysicalMaterial({ color: 0xf3f1f8, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.1 });
  const menta = new THREE.MeshPhysicalMaterial({ color: 0x7db5aa, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.12 });

  const logo = new THREE.Group();

  const PROF = 20, BISEL = 6;
  const opts: THREE.ExtrudeGeometryOptions = {
    depth: PROF - BISEL * 2, bevelEnabled: true, bevelThickness: BISEL,
    bevelSize: BISEL * 0.5, bevelSegments: 8, curveSegments: 48,
  };
  const iso = new THREE.Group();
  iso.position.set(82, -84, 0);
  const gMenta = new THREE.ExtrudeGeometry(formaMenta(), opts);
  gMenta.translate(0, 0, -(PROF - BISEL * 2) / 2);
  iso.add(new THREE.Mesh(gMenta, menta));
  const circ = new THREE.Shape();
  circ.absarc(0, 0, R - BISEL * 0.5, 0, Math.PI * 2, false);
  const gCirc = new THREE.ExtrudeGeometry(circ, opts);
  gCirc.translate(0, 0, -(PROF - BISEL * 2) / 2);
  for (const [x, y] of [[C, C], [-C, -C]]) {
    const m = new THREE.Mesh(gCirc, blanco);
    m.position.set(x, y, 0);
    iso.add(m);
  }
  logo.add(iso);

  const titulo = glyphs.title as Texto, bajada = glyphs.sub as Texto;
  logo.add(texto(titulo, 664 / titulo.w, 18, 2.6, 172, -131, blanco));
  if (conBajada) logo.add(texto(bajada, 836 / bajada.w, 5, 0.7, 14, -196, blanco));

  const caja = new THREE.Box3().setFromObject(logo);
  logo.position.sub(caja.getCenter(new THREE.Vector3()));
  const U = 0.01;
  const pivote = new THREE.Group();
  pivote.scale.setScalar(U);
  pivote.add(logo);
  const giro = new THREE.Group();
  giro.add(pivote);
  scene.add(giro);
  const ancho = (caja.max.x - caja.min.x) * U, alto = (caja.max.y - caja.min.y) * U;

  function encuadrar() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    // El canvas desborda la caja del logo (ver Logo3D.astro) para que el giro no se corte:
    // el logo en reposo ocupa exactamente la caja, no el canvas entero.
    const caja = canvas.parentElement;
    const fw = caja ? caja.clientWidth / w : 1;
    const fh = caja ? caja.clientHeight / h : 1;
    const dist = Math.max(alto / (2 * tan * fh), ancho / (2 * tan * camera.aspect * fw));
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(encuadrar);
  ro.observe(canvas);
  encuadrar();

  // Giro: vuelta con easing y pausa de frente. Arrastrar lo gira a mano y después vuelve solo al frente.
  let angulo = 0, base = 0, ciclo = 0, vel = 0, arrastrando = false, ultimoX = 0, volviendo = false;
  let corriendo = false, raf = 0, previo = 0;
  // modo 'unaVez': hay una vuelta en curso; al terminarla se deja de dibujar hasta el próximo girar()
  let girando = modo === 'unaVez';

  if (arrastrable) canvas.addEventListener('pointerdown', (e) => {
    arrastrando = true; ultimoX = e.clientX; vel = 0;
    canvas.setPointerCapture(e.pointerId);
    reanudar();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    const d = (e.clientX - ultimoX) * 0.012;
    ultimoX = e.clientX; angulo += d; vel = d;
  });
  const soltar = () => { arrastrando = false; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);

  function paso(ms: number) {
    const dt = Math.min((ms - previo) / 1000 || 0, 0.05);
    previo = ms;
    if (arrastrando) {
      // manda el usuario
    } else if (Math.abs(vel) > 0.0005) {
      angulo += vel; vel *= 0.94;
      if (Math.abs(vel) <= 0.0005) volviendo = true;
    } else if (volviendo) {
      const destino = Math.round(angulo / (Math.PI * 2)) * Math.PI * 2;
      angulo += (destino - angulo) * Math.min(1, dt * 4);
      if (Math.abs(destino - angulo) < 0.001) { angulo = base = destino; volviendo = false; ciclo = GIRO; }
    } else if (modo === 'unaVez') {
      if (girando) {
        ciclo += dt;
        angulo = base + ease(Math.min(ciclo / GIRO, 1)) * Math.PI * 2;
        if (ciclo >= GIRO) { angulo = base = base + Math.PI * 2; girando = false; }
      }
    } else {
      ciclo += dt;
      if (ciclo >= GIRO + PAUSA) { ciclo -= GIRO + PAUSA; base += Math.PI * 2; }
      angulo = base + ease(Math.min(ciclo / GIRO, 1)) * Math.PI * 2;
    }
    giro.rotation.y = angulo;
    renderer.render(scene, camera);
    const quieto = modo === 'unaVez' && !girando && !arrastrando && Math.abs(vel) <= 0.0005 && !volviendo;
    if (quieto) corriendo = false;
    if (corriendo) raf = requestAnimationFrame(paso);
  }

  function reanudar() {
    if (corriendo) return;
    corriendo = true; previo = performance.now();
    raf = requestAnimationFrame(paso);
  }
  function pausar() { corriendo = false; cancelAnimationFrame(raf); }

  renderer.render(scene, camera);

  function girar() {
    if (modo !== 'unaVez' || girando) return;
    girando = true; ciclo = 0;
    reanudar();
  }

  return {
    pausar,
    reanudar,
    girar,
    destruir() {
      pausar(); ro.disconnect();
      scene.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      blanco.dispose(); menta.dispose(); env.dispose(); renderer.dispose();
    },
  };
}
