import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as S from './shaders.js';

const SUN_RADIUS = 5;
const ORBIT_SPEED = 0.3; // global multiplier for every orbit
const TYPE_INDEX = { rocky: 0, earth: 1, gas: 2, clouds: 3, ice: 4 };
const MOBILE_BP = 820;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * Builds the solar system.
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {HTMLElement} o.labelLayer
 * @param {Array} o.projects      entries from data.js
 * @param {(id:string)=>void} o.onSelect  called when a body is clicked
 */
export function createScene({ canvas, labelLayer, projects, onSelect }) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 4000);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.rotateSpeed = 0.55;
  controls.zoomSpeed = 0.8;

  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.6, 0.95);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const timeU = { value: 0 };
  const pixelRatioU = { value: renderer.getPixelRatio() };

  // ── lights (only used by moons + asteroids; planets light themselves in-shader)
  scene.add(new THREE.PointLight(0xfff1dd, 3.2, 0, 0));
  scene.add(new THREE.AmbientLight(0x8899ff, 0.05));

  // ── deep space backdrop
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1800, 48, 32),
    new THREE.ShaderMaterial({ vertexShader: S.bodyVertex, fragmentShader: S.nebulaFragment, side: THREE.BackSide, depthWrite: false }),
  ));
  scene.add(makeStars(7000, timeU, pixelRatioU));

  /** every clickable thing: { id, name, kind, group, mesh, radius, viewRadius, label } */
  const bodies = [];
  const pickables = [];

  // ── the sun
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(SUN_RADIUS, 96, 64),
    new THREE.ShaderMaterial({ vertexShader: S.bodyVertex, fragmentShader: S.sunFragment, uniforms: { uTime: timeU } }),
  );
  scene.add(sun);
  const corona = makeGlow(SUN_RADIUS * 5, new THREE.Color(1.0, 0.48, 0.14).multiplyScalar(0.75), 1 / 5, 1, timeU);
  scene.add(corona);
  const sunBody = { id: 'sun', name: 'About me', kind: 'Start here', group: sun, mesh: sun, radius: SUN_RADIUS, viewRadius: SUN_RADIUS * 0.82 };
  bodies.push(sunBody);
  pickables.push(sun);
  sun.userData.body = sunBody;

  // ── planets
  const planetGeo = new THREE.SphereGeometry(1, 96, 64);
  const ringUpdaters = [];
  projects.forEach((proj, i) => {
    const cfg = proj.planet;
    const cols = cfg.colors.map((c) => new THREE.Color(c));
    const atm = cfg.type === 'earth' ? new THREE.Color('#4da3ff') : cols[0].clone().lerp(new THREE.Color('#ffffff'), 0.35);

    const group = new THREE.Group(); // moves along the orbit
    const tilt = new THREE.Group(); // axial tilt
    tilt.rotation.z = cfg.tilt || 0;
    group.add(tilt);

    const mesh = new THREE.Mesh(planetGeo, new THREE.ShaderMaterial({
      vertexShader: S.bodyVertex,
      fragmentShader: S.planetFragment,
      defines: { PTYPE: TYPE_INDEX[cfg.type] ?? 0 },
      uniforms: {
        uTime: timeU, uSeed: { value: 13.7 * (i + 1) }, uSpot: { value: cfg.spot ? 1 : 0 }, uRadius: { value: cfg.radius },
        uA: { value: cols[0] }, uB: { value: cols[1] }, uC: { value: cols[2] }, uAtm: { value: atm },
      },
    }));
    mesh.scale.setScalar(cfg.radius);
    tilt.add(mesh);

    let viewRadius = cfg.radius;
    if (cfg.rings) {
      const inner = cfg.radius * 1.35, outer = cfg.radius * 2.3;
      const ringMat = new THREE.ShaderMaterial({
        vertexShader: S.bodyVertex, fragmentShader: S.ringFragment,
        transparent: true, side: THREE.DoubleSide, depthWrite: false,
        uniforms: {
          uInnerR: { value: inner }, uOuterR: { value: outer }, uPlanetR: { value: cfg.radius },
          uCenter: { value: new THREE.Vector3() }, uColor: { value: cols[0].clone().lerp(cols[1], 0.4) },
        },
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 160, 1), ringMat);
      ring.rotation.x = -Math.PI / 2;
      tilt.add(ring);
      ringUpdaters.push(() => group.getWorldPosition(ringMat.uniforms.uCenter.value));
      viewRadius = cfg.radius * 1.75;
    }

    const moons = [];
    for (let m = 0; m < (cfg.moons || 0); m++) {
      const pivot = new THREE.Group();
      pivot.rotation.set((Math.sin(m * 12.9) * 0.5), m * 1.3, Math.cos(m * 7.7) * 0.4);
      const moon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(cfg.radius * (0.1 + 0.05 * ((m * 37) % 3)), 2),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.6 + m * 0.07, 0.3, 0.68), roughness: 0.9, flatShading: true }),
      );
      moon.position.x = cfg.radius * (1.7 + m * 0.36);
      pivot.add(moon);
      group.add(pivot);
      moons.push({ pivot, speed: 0.5 / (1 + m * 0.35) });
      viewRadius = cfg.radius * 1.9;
    }

    scene.add(group);
    scene.add(makeOrbitLine(cfg.orbit));

    const body = {
      id: proj.id, name: proj.name, kind: proj.kind, group, mesh, radius: cfg.radius, viewRadius,
      orbit: cfg.orbit, speed: cfg.speed, angle: cfg.phase, spin: cfg.spin, moons,
    };
    mesh.userData.body = body;
    bodies.push(body);
    pickables.push(mesh);
  });

  // ── asteroid belt between the inner planets and the gas giant
  const belt = makeBelt(900, 28, 31.5);
  scene.add(belt);

  // ── comet = contact
  const comet = makeComet(timeU, pixelRatioU);
  scene.add(comet.group);
  const cometBody = { id: 'contact', name: 'Contact', kind: 'Say hello', group: comet.group, mesh: comet.hit, radius: 0.9, viewRadius: 2.2, angle: 2.4 };
  comet.hit.userData.body = cometBody;
  bodies.push(cometBody);
  pickables.push(comet.hit);

  // ── HTML labels
  bodies.forEach((b) => {
    const el = document.createElement('button');
    el.className = 'label' + (b.id === 'sun' ? ' label--sun' : '') + (b.id === 'contact' ? ' label--comet' : '');
    el.type = 'button';
    el.innerHTML = `<span class="label__name"></span><span class="label__kind"></span><span class="label__stem"></span>`;
    el.querySelector('.label__name').textContent = b.name;
    el.querySelector('.label__kind').textContent = b.kind;
    el.addEventListener('click', () => onSelect(b.id));
    el.addEventListener('pointerenter', () => { hovered = b; });
    el.addEventListener('pointerleave', () => { if (hovered === b) hovered = null; });
    labelLayer.appendChild(el);
    b.label = el;
  });

  // label priority: sun first, then the biggest planets; used to resolve overlaps
  const labelOrder = [...bodies].sort((a, b) => (b.id === 'sun') - (a.id === 'sun') || b.viewRadius - a.viewRadius);
  const placed = [];
  function measureLabels() {
    for (const b of bodies) { b.labelW = b.label.offsetWidth || 90; b.labelH = b.label.offsetHeight || 34; }
  }
  measureLabels();
  document.fonts?.ready.then(measureLabels);

  // ── camera state
  let width = 1, height = 1;
  let focused = null; // body or null
  let tween = null; // { t, dur, fromPos, fromTarget }
  let orbitScale = 1;
  let hovered = null;
  let active = true;
  const shift = { x: 0, y: 0, tx: 0, ty: 0 };
  let panelOpen = false;

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const goalPos = new THREE.Vector3(), goalTarget = new THREE.Vector3();

  function homeDistance() {
    const aspect = width / height;
    const halfH = Math.atan(Math.tan(THREE.MathUtils.degToRad(25)) * aspect);
    return THREE.MathUtils.clamp(70 / Math.tan(halfH), 112, 250);
  }

  function computeGoal() {
    if (!focused) {
      goalTarget.set(0, 0, 0);
      goalPos.set(0.12, 0.42, 0.9).normalize().multiplyScalar(homeDistance());
      return;
    }
    focused.group.getWorldPosition(goalTarget);
    const narrow = width < MOBILE_BP;
    const dist = focused.viewRadius * (narrow ? 8.4 : 4.7);
    if (focused.id === 'sun') {
      tmp.set(0.35, 0.22, 1).normalize();
    } else {
      const toSun = tmp2.copy(goalTarget).multiplyScalar(-1).setY(0).normalize();
      const side = new THREE.Vector3().crossVectors(UP, toSun).normalize();
      tmp.copy(toSun).multiplyScalar(0.8).addScaledVector(side, 0.55).addScaledVector(UP, 0.26).normalize();
    }
    goalPos.copy(goalTarget).addScaledVector(tmp, dist);
  }

  function startTween(dur = 1.7) {
    tween = { t: 0, dur: reducedMotion ? 0.01 : dur, fromPos: camera.position.clone(), fromTarget: controls.target.clone() };
    controls.enabled = false;
  }

  function applyLimits() {
    if (focused) {
      controls.minDistance = focused.viewRadius * 1.7;
      controls.maxDistance = focused.viewRadius * 14;
    } else {
      controls.minDistance = 22;
      controls.maxDistance = 420;
    }
  }

  function updateShiftTarget() {
    if (!panelOpen) {
      // overview: nudge the system away from the intro text
      if (width < MOBILE_BP) { shift.tx = 0; shift.ty = height * 0.13; }
      else { shift.tx = -width * 0.13; shift.ty = 0; }
      return;
    }
    if (width < MOBILE_BP) { shift.tx = 0; shift.ty = height * 0.27; }
    else { shift.tx = Math.min(480, width * 0.42) / 2; shift.ty = 0; }
  }

  function resize() {
    width = Math.max(canvas.clientWidth || window.innerWidth, 2);
    height = Math.max(canvas.clientHeight || window.innerHeight, 2);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    pixelRatioU.value = renderer.getPixelRatio();
    renderer.setSize(width, height, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(width, height);
    camera.aspect = width / height;
    measureLabels();
    updateShiftTarget();
    applyViewOffset();
    camera.updateProjectionMatrix();
    if (!focused && !tween) startTween(0.6);
  }

  function applyViewOffset() {
    if (Math.abs(shift.x) < 0.5 && Math.abs(shift.y) < 0.5) camera.clearViewOffset();
    else camera.setViewOffset(width, height, shift.x, shift.y, width, height);
  }

  // ── picking
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerInside = false, pointerMoved = false, downAt = null;

  function pick(ev) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera); // the shifted viewport is already in the projection matrix
    const hit = raycaster.intersectObjects(pickables, false)[0];
    return hit ? hit.object.userData.body : null;
  }

  let lastMove = null;
  canvas.addEventListener('pointermove', (ev) => { lastMove = ev; pointerInside = true; pointerMoved = true; });
  canvas.addEventListener('pointerleave', () => { pointerInside = false; hovered = null; canvas.style.cursor = ''; });
  canvas.addEventListener('pointerdown', (ev) => { downAt = { x: ev.clientX, y: ev.clientY }; });
  canvas.addEventListener('pointerup', (ev) => {
    if (!downAt) return;
    const moved = Math.hypot(ev.clientX - downAt.x, ev.clientY - downAt.y);
    downAt = null;
    if (moved > 6) return;
    const b = pick(ev);
    if (b && b !== focused) onSelect(b.id);
  });

  // ── frame loop
  const clock = new THREE.Clock();
  const proj = new THREE.Vector3();

  function frame() {
    requestAnimationFrame(frame);
    if (!active) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    timeU.value += dt;
    const t = timeU.value;

    // orbits slow to a stop while something is in focus
    const wantScale = focused ? 0 : (reducedMotion ? 0.2 : 1);
    orbitScale += (wantScale - orbitScale) * (1 - Math.exp(-dt * 4));
    if (Math.abs(orbitScale - wantScale) < 0.002) orbitScale = wantScale;
    const odt = dt * orbitScale * ORBIT_SPEED;

    for (const b of bodies) {
      if (b.orbit) {
        b.angle += b.speed * odt;
        b.group.position.set(Math.cos(b.angle) * b.orbit, 0, -Math.sin(b.angle) * b.orbit);
        b.mesh.rotation.y += b.spin * dt;
        for (const m of b.moons) m.pivot.rotation.y += m.speed * dt;
      }
    }
    sun.rotation.y += 0.02 * dt;
    belt.rotation.y += 0.012 * odt / ORBIT_SPEED;
    // the belt fades out during close-ups so rocks never block the view
    const beltWant = focused && focused.id !== 'sun' ? 0 : 1;
    belt.material.opacity += (beltWant - belt.material.opacity) * (1 - Math.exp(-dt * 3));
    belt.visible = belt.material.opacity > 0.01;
    ringUpdaters.forEach((f) => f());

    cometBody.angle += 0.09 * odt;
    comet.update(cometBody.angle);

    // camera
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const e = easeInOut(tween.t);
      computeGoal();
      camera.position.lerpVectors(tween.fromPos, goalPos, e);
      controls.target.lerpVectors(tween.fromTarget, goalTarget, e);
      camera.lookAt(controls.target);
      if (tween.t >= 1) { tween = null; controls.enabled = true; applyLimits(); }
    } else {
      if (focused) {
        // keep the focused body centred even if it is still drifting to a halt
        focused.group.getWorldPosition(tmp);
        tmp2.subVectors(tmp, controls.target);
        controls.target.copy(tmp);
        camera.position.add(tmp2);
      }
      controls.update();
    }

    // viewport shift so the subject is not hidden behind the open panel
    const k = 1 - Math.exp(-dt * 5);
    shift.x += (shift.tx - shift.x) * k;
    shift.y += (shift.ty - shift.y) * k;
    applyViewOffset();
    camera.updateProjectionMatrix();

    corona.quaternion.copy(camera.quaternion);
    comet.glow.quaternion.copy(camera.quaternion);

    // hover
    if (pointerMoved && pointerInside && lastMove && !downAt) {
      pointerMoved = false;
      hovered = pick(lastMove);
      canvas.style.cursor = hovered && hovered !== focused ? 'pointer' : '';
    }

    // labels
    camera.getWorldDirection(tmp2);
    const camUp = tmp.copy(camera.up).applyQuaternion(camera.quaternion);
    placed.length = 0;
    for (const b of labelOrder) {
      b.group.getWorldPosition(proj);
      const behind = proj.clone().sub(camera.position).dot(tmp2) < 0;
      proj.addScaledVector(camUp, (b.id === 'contact' ? 1.2 : b.viewRadius * 1.12) + 0.2);
      proj.project(camera);
      const x = (proj.x * 0.5 + 0.5) * width, y = (-proj.y * 0.5 + 0.5) * height;
      const off = behind || x < -80 || x > width + 80 || y < -40 || y > height + 80;
      b.label.style.display = off ? 'none' : '';
      if (off) continue;
      b.label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      b.label.classList.toggle('is-hover', hovered === b);
      // hide a label when it would sit on top of a more important one
      const r = { l: x - b.labelW / 2, r: x + b.labelW / 2, t: y - b.labelH, b: y - 8 };
      const crowded = hovered !== b && placed.some((p) => r.l < p.r && r.r > p.l && r.t < p.b && r.b > p.t);
      b.label.classList.toggle('is-crowded', crowded);
      if (!crowded) placed.push(r);
    }

    composer.render(dt);
  }

  // ── boot
  resize();
  computeGoal();
  // cinematic opening: start far out and glide in
  camera.position.copy(goalPos).multiplyScalar(2.3).add(new THREE.Vector3(60, 90, 0));
  controls.target.set(0, 0, 0);
  applyLimits();
  startTween(3.2);
  new ResizeObserver(() => {
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
  }).observe(canvas);
  requestAnimationFrame(frame);

  return {
    /** Fly to a body by id ('sun', 'contact' or a project id). */
    focus(id) {
      const b = bodies.find((x) => x.id === id);
      if (!b || b === focused) return;
      focused = b;
      labelLayer.classList.add('is-focused');
      startTween(1.8);
    },
    /** Return to the wide view of the whole system. */
    overview() {
      if (!focused) return;
      focused = null;
      labelLayer.classList.remove('is-focused');
      startTween(1.8);
    },
    setPanelOpen(open) { panelOpen = open; updateShiftTarget(); },
    setActive(on) { active = on; if (on) clock.getDelta(); },
  };
}

// ───────────────────────── helpers ─────────────────────────

function makeStars(count, timeU, pixelRatioU) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const size = new Float32Array(count), phase = new Float32Array(count);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 700 + Math.random() * 900;
    const s = Math.sqrt(1 - u * u);
    pos.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], i * 3);
    const k = Math.random();
    c.setHSL(k < 0.6 ? 0.6 : k < 0.85 ? 0.1 : 0.0, 0.25 + Math.random() * 0.5, 0.75 + Math.random() * 0.2);
    const bright = Math.pow(Math.random(), 3);
    c.multiplyScalar(0.5 + bright * 1.6);
    col.set([c.r, c.g, c.b], i * 3);
    size[i] = 1.4 + bright * 4.2;
    phase[i] = Math.random() * 10;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
  return new THREE.Points(g, new THREE.ShaderMaterial({
    vertexShader: S.starVertex, fragmentShader: S.starFragment,
    uniforms: { uTime: timeU, uPixelRatio: pixelRatioU },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
}

function makeGlow(size, color, inner, rays, timeU) {
  return new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShaderMaterial({
      vertexShader: S.glowVertex, fragmentShader: S.glowFragment,
      uniforms: { uTime: timeU, uColor: { value: color }, uInner: { value: inner }, uRays: { value: rays } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }),
  );
}

function makeOrbitLine(radius) {
  const pts = [];
  for (let i = 0; i < 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x7f9cff, transparent: true, opacity: 0.16, depthWrite: false }),
  );
}

function makeBelt(count, rMin, rMax) {
  const mesh = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: 0x9a8f85, roughness: 1, flatShading: true, transparent: true }),
    count,
  );
  const d = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = rMin + (rMax - rMin) * (0.5 + (Math.random() + Math.random() - 1) * 0.5);
    d.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 1.3, Math.sin(a) * r);
    d.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    const s = 0.05 + Math.pow(Math.random(), 3) * 0.24;
    d.scale.set(s, s * (0.6 + Math.random() * 0.5), s * (0.7 + Math.random() * 0.5));
    d.updateMatrix();
    mesh.setMatrixAt(i, d.matrix);
  }
  return mesh;
}

function makeComet(timeU, pixelRatioU) {
  const group = new THREE.Group();
  const color = new THREE.Color(0.55, 0.9, 1.0);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 24, 16),
    new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(1.7) }),
  );
  group.add(head);
  const glow = makeGlow(3.4, color.clone().multiplyScalar(0.4), 0.05, 0, timeU);
  group.add(glow);

  // tail: particles streaming along +X (the group is turned so +X points away from the sun)
  const N = 420;
  const pos = new Float32Array(N * 3), aT = new Float32Array(N), aPhase = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = Math.pow(Math.random(), 1.4);
    const spread = 0.12 + t * 1.5;
    pos.set([t * 15, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread], i * 3);
    aT[i] = t; aPhase[i] = Math.random();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  g.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
  const tail = new THREE.Points(g, new THREE.ShaderMaterial({
    vertexShader: S.tailVertex, fragmentShader: S.tailFragment,
    uniforms: { uTime: timeU, uPixelRatio: pixelRatioU, uColor: { value: color }, uScale: { value: 260 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  tail.frustumCulled = false;
  const tailPivot = new THREE.Group();
  tailPivot.add(tail);
  group.add(tailPivot);

  // generous invisible hit area so the comet is easy to click
  const hit = new THREE.Mesh(new THREE.SphereGeometry(2.2, 12, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  group.add(hit);

  const a = 62, e = 0.55, b = a * Math.sqrt(1 - e * e);
  const incl = new THREE.Euler(0.38, 0.9, 0.12);
  const away = new THREE.Vector3(), X = new THREE.Vector3(1, 0, 0);
  function update(angle) {
    group.position.set(Math.cos(angle) * a - a * e, 0, Math.sin(angle) * b).applyEuler(incl);
    away.copy(group.position).normalize();
    tailPivot.quaternion.setFromUnitVectors(X, away);
  }
  update(0);
  return { group, glow, hit, update };
}
