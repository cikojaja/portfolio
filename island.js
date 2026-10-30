// Ciko's island: a small 3D town at night. Each building = one thing Ciko built.
// createIsland(el, {labels, onSelect, area, intro, shape}) → {focus, enter, leave, still, fit, border, start, ready, destroy}
// shape {w, d, yaw}: ground size in world units + camera turn (laptop: long 20 x 12 at 32°, phone: square 12 x 12 at 45°)
// area(w, h) → {cx, cy, aw, ah}: the free part of el (px) where the island should sit; the dive re-centres on the door.
// enter(name): fly to the building, zoom through its door; resolves with the door's screen point when it's time to show the inside.
// Mouse: hover = pick look, click = go in. Touch: first tap = pick look, second tap = go in. Idle: buildings glow softly one by one.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const GOLD = 0xC9923E, WALL = 0xECE9E3, GROUND = 0x151515;
let DAY = false; // ?theme=light: a white daytime island, only for comparing with the night one

// x/z are for the 12 x 12 island; createIsland stretches them to the shape it is given
// icon: a real app icon in media/, or '#symbol' from the page's svg sprite (drawn in a gold box)
export const SPOTS = {
  aureyu:      { x: -4.0, z: -1.8, h: 6.4, label: 'Aureyu', sub: 'my chat app', icon: 'aureyu-mark.svg' },
  smartkartoffel: { x: -2.0, z: -4.1, h: 3.0, label: 'SmartKartoffel', sub: 'German learning app', icon: 'smartkartoffel-icon.png' },
  studio:      { x: 3.4, z: -3.2, h: 4.3, label: 'Video studio', sub: 'videos I make', icon: '#i-film' },
  automations: { x: -3.3, z: 3.3, h: 2.5, label: 'Automations', sub: 'my AI agent', icon: '#i-bot' },
  home:        { x: 3.3, z: 3.3, h: 2.7, label: 'My home', sub: 'about me', icon: '#i-home' },
};

const std = (o) => new THREE.MeshStandardMaterial({ roughness: .85, ...o });
const shadow = (o) => { o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

// lit windows on a white wall; one canvas tile per window
function windows(cols, rows, lit, seed) {
  const s = 32, W = cols * s, H = rows * s;
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H }), g = c.getContext('2d');
  const e = Object.assign(document.createElement('canvas'), { width: W, height: H }), ge = e.getContext('2d');
  g.fillStyle = '#ECE9E3'; g.fillRect(0, 0, W, H); ge.fillStyle = '#000'; ge.fillRect(0, 0, W, H);
  let r = seed * 9301 + 49297;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const on = !DAY && rnd() < lit;
    g.fillStyle = on ? '#F4C784' : '#4A4843';
    g.fillRect(x * s + 9, y * s + 8, s - 18, s - 13);
    if (on) { ge.fillStyle = '#FFB244'; ge.fillRect(x * s + 9, y * s + 8, s - 18, s - 13); }
  }
  const map = new THREE.CanvasTexture(c), em = new THREE.CanvasTexture(e);
  map.colorSpace = em.colorSpace = THREE.SRGBColorSpace;
  return std({ map, emissiveMap: em, emissive: 0xffffff, emissiveIntensity: 1.25 });
}

let seed = 1;
function block(w, h, d, lit = .65, win = [.46, .56]) {
  const plain = std({ color: WALL });
  const side = (fw) => windows(Math.max(1, Math.round(fw / win[0])), Math.max(1, Math.round(h / win[1])), lit, seed++);
  const mx = side(d), mz = side(w);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [mx, mx, plain, plain, mz, mz]);
  m.position.y = h / 2;
  return m;
}

// triangular roof, ridge along x
function roof(w, h, d, color = 0xDAD6CE) {
  const s = new THREE.Shape(); s.moveTo(-d / 2, 0); s.lineTo(d / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: w, bevelEnabled: false });
  g.translate(0, 0, -w / 2); g.rotateY(Math.PI / 2);
  return new THREE.Mesh(g, std({ color, flatShading: true }));
}

function plane(w, h, mat) { return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); }
const goldGlow = () => new THREE.MeshBasicMaterial({ color: 0xFFC46B });
const goldMetal = () => std({ color: GOLD, roughness: .35, metalness: .8 });

// entrance: dark door on a hinge, warm light behind it, gold bar on top
function door(w, h) {
  const g = new THREE.Group(), hinge = new THREE.Group();
  const light = plane(w, h, goldGlow()); light.position.set(0, h / 2, .005);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(w, h, .03), std({ color: 0x0C0C0C, roughness: .6 }));
  leaf.position.set(w / 2, h / 2, .03); hinge.position.x = -w / 2; hinge.add(leaf);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .04, .05), goldGlow()); bar.position.set(0, h + .05, .03);
  g.add(light, hinge, bar); g.userData.hinge = hinge;
  return g;
}

function textTex(lines, { w = 256, h = 128, bg = '#0A0A0A', fg = '#C9923E', font = '900 64px Inter' } = {}) {
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h }), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * h * .42));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function bubble(text) {
  const c = Object.assign(document.createElement('canvas'), { width: 256, height: 128 }), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(8, 8, 240, 84, 42); g.fill();
  g.beginPath(); g.moveTo(52, 88); g.lineTo(40, 120); g.lineTo(84, 90); g.fill();
  g.fillStyle = '#111'; g.font = '700 48px Inter, "PingFang SC", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 52);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true }));
  s.scale.set(1.7, .85, 1); return s;
}

function imageTex(src) { const t = new THREE.TextureLoader().load(src); t.colorSpace = THREE.SRGBColorSpace; return t; }

// Claude Code pixel mascot as voxels (glyphs from brand/assets/claude-code-mascot.md)
function claude(cell = .11) {
  const ROWS = [' ▐▛███▛█', '▝▜██████▀', '  ▝▝ ▝▝'], Q = { '█': '1111', '▐': '0101', '▛': '1110', '▜': '1101', '▝': '0100', '▀': '1100', ' ': '0000' };
  const cubes = [];
  ROWS.forEach((row, y) => [...row].forEach((ch, x) => [...Q[ch]].forEach((on, q) => {
    if (on === '1') cubes.push([x * cell + (q % 2) * cell / 2, (y * 2 + (q >> 1)) * cell]);
  })));
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(cell / 2 + .002, cell + .002, cell * 2.2),
    std({ color: 0xD97757, roughness: .55, emissive: 0xD97757, emissiveIntensity: .35 }), cubes.length);
  const o = new THREE.Object3D(), W = 9 * cell, H = 6 * cell;
  cubes.forEach(([x, y], i) => { o.position.set(x + cell / 4 - W / 2, H - y - cell / 2, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.castShadow = true;
  return new THREE.Group().add(m);
}

// Robert, the black + gold robot mascot: glowing face, one arm that waves (userData.arm), legs that walk (userData.legs)
function robot() {
  const g = new THREE.Group(), black = std({ color: 0x262626, roughness: .3, metalness: .5 }), gold = goldMetal();
  const add = (geo, mat, x, y, z, to = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); to.add(m); return m; };
  add(new RoundedBoxGeometry(.66, .54, .52, 3, .12), black, 0, 1.02, 0);
  add(new RoundedBoxGeometry(.52, .38, .04, 2, .02), std({ color: 0x1A1408, roughness: .15, emissive: 0x3A2508, emissiveIntensity: .8 }), 0, 1.02, .26);
  add(new THREE.BoxGeometry(.1, .18, .02), goldGlow(), -.11, 1.03, .285);
  add(new THREE.BoxGeometry(.1, .18, .02), goldGlow(), .11, 1.03, .285);
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: 0xFFB54A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 }));
  face.scale.set(1.1, .8, 1); face.position.set(0, 1.03, .4); g.add(face);
  add(new THREE.ConeGeometry(.08, .24, 4), gold, .38, 1.1, 0).rotation.z = -Math.PI / 2;
  add(new RoundedBoxGeometry(.44, .42, .3, 2, .06), black, 0, .6, 0);
  add(new THREE.BoxGeometry(.46, .06, .32), gold, 0, .48, 0);
  g.userData.legs = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * .29, .77, 0); g.add(arm);
    add(new THREE.BoxGeometry(.11, .34, .13), black, 0, -.17, 0, arm);
    if (s === 1) g.userData.arm = arm;
    const leg = new THREE.Group(); leg.position.set(s * .11, .35, 0); g.add(leg); g.userData.legs.push(leg);
    add(new THREE.BoxGeometry(.14, .3, .16), black, 0, -.15, 0, leg);
    add(new THREE.BoxGeometry(.16, .08, .22), gold, 0, -.31, .02, leg);
  }
  return g;
}

function tree(s = 1) {
  const g = new THREE.Group(), m = std({ color: DAY ? 0xC4BEB4 : 0xE4E1DA, flatShading: true });
  const top = new THREE.Mesh(new THREE.ConeGeometry(.42 * s, 1.1 * s, 6), m); top.position.y = .45 * s + .55 * s;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.06 * s, .08 * s, .45 * s, 5), std({ color: 0x8C877E }));
  trunk.position.y = .22 * s;
  return g.add(top, trunk);
}

function lamp() {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.03, .04, .9, 6), std({ color: 0x2C2C2C }));
  pole.position.y = .45;
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.08, 10, 8), goldGlow()); bulb.position.y = .94;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex(), color: 0xFFB54A, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(.9, .9, 1); halo.position.y = .94;
  g.userData.halo = halo;
  return g.add(pole, bulb, halo);
}
let _halo;
function haloTex() {
  if (_halo) return _halo;
  const c = Object.assign(document.createElement('canvas'), { width: 64, height: 64 }), g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(.25, 'rgba(255,255,255,.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return (_halo = new THREE.CanvasTexture(c));
}

// plaza centre: fountain with glowing water and jets. userData.update(t, on) animates it, on = street lights 0..1
function fountain() {
  const g = new THREE.Group(), stone = std({ color: 0x232323, roughness: .7 });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.25, 40), new THREE.MeshBasicMaterial({ map: haloTex(), color: 0x7FC7FF, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = .05; g.add(pool);
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.12, .32, 40), stone); basin.position.y = .16; g.add(basin);
  const water = new THREE.Mesh(new THREE.CircleGeometry(.96, 40), new THREE.MeshStandardMaterial({ color: 0x1D4E66, emissive: 0x2A7FA8, emissiveIntensity: .7, roughness: .15, metalness: .2 }));
  water.rotation.x = -Math.PI / 2; water.position.y = .3; g.add(water);
  for (const [r, y] of [[1.06, .33], [.38, 1.06]]) { const rim = new THREE.Mesh(new THREE.TorusGeometry(r, .035, 8, 48), goldMetal()); rim.rotation.x = Math.PI / 2; rim.position.y = y; g.add(rim); }
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.11, .16, .8, 16), stone); pillar.position.y = .7; g.add(pillar);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.38, .14, .14, 32), stone); bowl.position.y = 1.03; g.add(bowl);
  const light = new THREE.PointLight(0x7FC7FF, 5, 4, 2); light.position.y = 1; g.add(light); g.userData.light = light;
  const N = 140, seed = Array.from({ length: N }, (_, i) => [Math.random(), i / N * Math.PI * 2, .8 + Math.random() * .4]);
  const jet = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(new Array(N * 3).fill(0), 3)),
    new THREE.PointsMaterial({ map: haloTex(), color: 0xCDEBFF, size: .09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  jet.userData.ws = .09; g.add(jet); // ws: drop size in world units, turned into pixels each frame
  g.userData.update = (t, on) => {
    light.intensity = 5 * on;
    const a = jet.geometry.attributes.position;
    seed.forEach(([o, th, v], i) => { const p = (t * .55 + o) % 1, r = .1 + p * .85 * v; a.setXYZ(i, Math.cos(th) * r, 1.12 + p * 1.9 * v - p * p * 2.6, Math.sin(th) * r); });
    a.needsUpdate = true;
  };
  return g;
}

function build(scene, media, shape) {
  const SX = shape.w / 12, SZ = shape.d / 12, hw = shape.w / 2, hd = shape.d / 2;
  const world = new THREE.Group(); scene.add(world);
  const spots = {}, doors = {}, wins = {}; // wins: each building's lit-window materials (hover / intro brightness)
  const at = (name, obj) => {
    const w = new Set();
    obj.position.set(SPOTS[name].x, 0, SPOTS[name].z);
    obj.traverse((m) => { m.userData.spot = name; if (m.isMesh) [].concat(m.material).forEach((x) => x.emissiveMap && w.add(x)); });
    spots[name] = obj; wins[name] = [...w]; world.add(shadow(obj)); return obj;
  };
  const entry = (name, grp, w, h, x, z, ry) => {
    const d = door(w, h); d.position.set(x, 0, z); d.rotation.y = ry; grp.add(d);
    d.userData.at = new THREE.Vector3(SPOTS[name].x + x, h / 2, SPOTS[name].z + z); doors[name] = d;
  };

  // floating island
  const slab = new THREE.Mesh(new RoundedBoxGeometry(shape.w, 1.2, shape.d, 3, .3), std({ color: DAY ? 0xF1EEE8 : GROUND, roughness: 1 }));
  slab.position.y = -.6; slab.receiveShadow = true; world.add(slab);
  const rock = new THREE.Mesh(new THREE.CylinderGeometry(8.3, 1.4, 3.6, 4, 1), std({ color: DAY ? 0xD9D4CC : 0x0E0E0E, flatShading: true, roughness: 1 }));
  rock.rotation.y = Math.PI / 4; rock.position.y = -3; const rockG = new THREE.Group().add(rock); rockG.scale.set(SX, 1, SZ); world.add(rockG);
  const rim = new THREE.Shape(); rim.moveTo(-hw, -hd); rim.lineTo(hw, -hd); rim.lineTo(hw, hd); rim.lineTo(-hw, hd); rim.closePath();
  const hole = new THREE.Path(); hole.moveTo(-hw + .12, -hd + .12); hole.lineTo(hw - .12, -hd + .12); hole.lineTo(hw - .12, hd - .12); hole.lineTo(-hw + .12, hd - .12); hole.closePath();
  rim.holes.push(hole);
  const rimM = new THREE.Mesh(new THREE.ShapeGeometry(rim), new THREE.MeshBasicMaterial({ color: GOLD }));
  rimM.rotation.x = -Math.PI / 2; rimM.position.y = .012; world.add(rimM);

  // paths + dashed gold centre lines + plaza
  const pathM = std({ color: DAY ? 0xD2CDC5 : 0x232323, roughness: 1 });
  for (const [rot, len] of [[0, shape.w - .3], [Math.PI / 2, shape.d - .3]]) {
    const p = plane(len, 1.1, pathM); p.rotation.set(-Math.PI / 2, 0, rot); p.position.y = .01; p.receiveShadow = true; world.add(p);
  }
  const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(.26, .01, .04), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: .55 }), 120);
  const o = new THREE.Object3D(); let n = 0;
  for (let i = -(hw - .5); i <= hw - .5; i += .58) { if (Math.abs(i) < 1.5) continue; o.position.set(i, .02, 0); o.rotation.y = 0; o.updateMatrix(); dash.setMatrixAt(n++, o.matrix); }
  for (let i = -(hd - .5); i <= hd - .5; i += .58) { if (Math.abs(i) < 1.5) continue; o.position.set(0, .02, i); o.rotation.y = Math.PI / 2; o.updateMatrix(); dash.setMatrixAt(n++, o.matrix); }
  dash.count = n; world.add(dash);
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, .04, 48), std({ color: DAY ? 0xE4E0D9 : 0x1C1C1C, roughness: 1 }));
  plaza.position.y = .02; plaza.receiveShadow = true; world.add(plaza);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.3, 1.37, 64), new THREE.MeshBasicMaterial({ color: GOLD }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .045; world.add(ring);

  // Aureyu: glass tower + chat bubbles in other languages (its logo sits on the name tag)
  const au = new THREE.Group();
  au.add(block(1.8, 5.2, 1.8, .72, [.36, .5]));
  const crown = new THREE.Mesh(new THREE.BoxGeometry(1.3, .45, 1.3), std({ color: 0x1B1B1B, roughness: .4, metalness: .4 }));
  crown.position.y = 5.42; au.add(crown);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(.025, .04, 1.1, 6), std({ color: 0x2C2C2C })); ant.position.y = 6.2; au.add(ant);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), goldGlow()); tip.position.y = 6.78; au.add(tip);
  entry('aureyu', au, .6, .95, .905, 0, Math.PI / 2);
  at('aureyu', au);
  const bubbles = ['你好', 'Ciao!', 'Hola', 'Merhaba'].map((t, i) => { const b = bubble(t); b.userData = { i, spot: 'aureyu' }; world.add(b); return b; });

  // SmartKartoffel: a school with a bell tower (the potato icon sits on the name tag)
  const sk = new THREE.Group();
  sk.add(block(2.6, 1.3, 1.7, .8, [.5, .6]));
  const skr = roof(2.8, .75, 1.9); skr.position.y = 1.3; sk.add(skr);
  const bell = new THREE.Mesh(new THREE.BoxGeometry(.4, .5, .4), std({ color: WALL })); bell.position.set(0, 2.1, 0); sk.add(bell);
  const bellR = new THREE.Mesh(new THREE.ConeGeometry(.36, .4, 4), std({ color: 0xDAD6CE, flatShading: true }));
  bellR.position.set(0, 2.55, 0); bellR.rotation.y = Math.PI / 4; sk.add(bellR);
  entry('smartkartoffel', sk, .5, .8, .45, .855, 0);
  at('smartkartoffel', sk);

  // Video studio: a phone-shaped screen on the roof plays a real reel
  const st = new THREE.Group();
  st.add(block(3.0, 1.8, 2.4, .35, [.7, .6]));
  const frame = new THREE.Mesh(new RoundedBoxGeometry(1.32, 2.28, .12, 3, .08), std({ color: 0x0C0C0C, roughness: .3, metalness: .5 }));
  frame.position.set(0, 3.0, 0); frame.rotation.y = Math.PI / 4; st.add(frame);
  const scr = plane(1.18, 2.1, new THREE.MeshBasicMaterial({ map: imageTex(media + 'reel-google-vs-claude.jpg') }));
  scr.position.set(.045, 3.0, .045); scr.rotation.y = Math.PI / 4; st.add(scr);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(.12, .5, .12), std({ color: 0x2C2C2C })); stand.position.y = 1.95; st.add(stand);
  const marquee = new THREE.Mesh(new THREE.BoxGeometry(3.02, .12, .06), goldGlow()); marquee.position.set(0, 1.62, 1.21); st.add(marquee);
  const marquee2 = marquee.clone(); marquee2.scale.x = 2.42 / 3.02; marquee2.rotation.y = Math.PI / 2; marquee2.position.set(1.51, 1.62, 0); st.add(marquee2);
  entry('studio', st, .7, 1.0, 0, 1.205, 0);
  at('studio', st);
  const screen = scr;

  // Automations (MoneyMaker + Robert + the other bots): workshop with saw-tooth roof, conveyor of client cards, "61 fixes" sign,
  // Robert in front on a little lit stage
  const mm = new THREE.Group();
  mm.add(block(3.2, 1.4, 2.4, .7, [.55, .55]));
  for (const x of [-1.07, 0, 1.07]) {
    const r = roof(2.4, .5, 1.07); r.rotation.y = Math.PI / 2; r.position.set(x, 1.4, 0); mm.add(r);
  }
  entry('automations', mm, .8, .9, 1.605, 0, Math.PI / 2);
  const bot = robot(); bot.scale.setScalar(1.45); bot.position.set(-.4, 0, 1.9); bot.rotation.y = Math.PI / 4; mm.add(bot);
  bot.userData.far = 2.25 * SX - .65; // walks to just before the tree on his right
  const pad = new THREE.Mesh(new THREE.RingGeometry(.66, .72, 48), new THREE.MeshBasicMaterial({ color: GOLD }));
  pad.rotation.x = -Math.PI / 2; pad.position.set(-.4, .03, 1.9); mm.add(pad);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ map: haloTex(), color: 0xFFC46B, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(-.4, .025, 1.9); mm.add(pool);
  const beam = new THREE.SpotLight(0xFFE2B0, 45, 8, .45, .6, 2); beam.position.set(.8, 3.4, 3.1); beam.target = bot; mm.add(beam); bot.userData.beam = beam;
  const belt = new THREE.Mesh(new THREE.BoxGeometry(1.5, .1, .5), std({ color: 0x0F0F0F, roughness: .5 })); belt.position.set(2.35, .3, 0); mm.add(belt);
  for (const x of [1.75, 2.95]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(.06, .25, .44), std({ color: 0x2C2C2C })); leg.position.set(x, .12, 0); mm.add(leg); }
  const cards = [0, 1, 2].map(() => { const c = new THREE.Mesh(new THREE.BoxGeometry(.3, .03, .22), std({ color: 0xffffff, roughness: .5 })); mm.add(c); return c; });
  const sign29 = plane(1.3, .55, new THREE.MeshBasicMaterial({ map: textTex(['10 JOBS', '1 CHAT'], { w: 512, h: 216, font: '900 84px Inter' }) }));
  sign29.position.set(0, 2.25, 0); sign29.rotation.y = Math.PI / 4; mm.add(sign29);
  for (const dx of [-.45, .45]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .5, 6), std({ color: 0x2C2C2C })); p.position.set(dx * .707, 1.8, -dx * .707); mm.add(p); }
  at('automations', mm);

  // My home: Ciko's house (about me)
  const rb = new THREE.Group();
  rb.add(block(2.0, 1.25, 2.0, .75, [.5, .55]));
  const rr = roof(2.25, .85, 2.25); rr.position.y = 1.25; rb.add(rr);
  const chim = new THREE.Mesh(new THREE.BoxGeometry(.25, .5, .25), std({ color: WALL })); chim.position.set(.55, 1.9, -.4); rb.add(chim);
  entry('home', rb, .5, .75, 0, 1.005, 0);
  at('home', rb);

  // trees + lamps (they pop up after the buildings in the intro)
  const props = [];
  for (const [x, z, s] of [[5.2, -.9, 1], [5.25, 1.05, .8], [-5.3, 1.2, 1.1], [-1.05, 5.3, .9], [1.2, 5.35, 1.1], [-5.25, -5.25, 1.2],
    [.95, -5.3, 1], [5.3, -5.3, .8], [-5.3, 5.3, .9], [-.95, -1.7, .7], [1.6, -1.1, .6]]) {
    const t = tree(s); t.position.set(x * SX, 0, z * SZ); world.add(shadow(t)); props.push(t);
  }
  for (const [x, z] of [[.95, .95], [-.95, -.95], [.85, 3.2], [-.85, -3.2], [3.2, -.85], [-3.2, .85]]) {
    const l = lamp(); l.position.set(x * SX, 0, z * SZ); world.add(shadow(l)); props.push(l);
  }

  // Ciko himself: a cut-out of his 3D character (gold outline) on a lit gold ring beside his house, waving now and then (sprite sheet: 40 frames, 8 x 5).
  // An upright card that only turns left/right to face the camera: a full billboard would lean back into the house behind it.
  const sheet = imageTex(media + 'ciko-wave.webp');
  sheet.repeat.set(1 / 8, 1 / 5); sheet.generateMipmaps = false; sheet.minFilter = THREE.LinearFilter; // no mipmaps: frames must not bleed into each other
  const card = new THREE.PlaneGeometry(1.1, 2.3); card.translate((.5 - .603) * 1.1, (.5 - .024) * 2.3, 0); // feet on the origin
  const me = new THREE.Mesh(card, new THREE.MeshBasicMaterial({ map: sheet, color: 0xF2F2F2, transparent: true, alphaTest: .05, side: THREE.DoubleSide, toneMapped: false }));
  me.userData.spot = 'home';
  const foot = new THREE.Mesh(new THREE.CircleGeometry(.4, 32), new THREE.MeshBasicMaterial({ map: haloTex(), color: 0x000000, transparent: true, opacity: .6, depthWrite: false }));
  foot.rotation.x = -Math.PI / 2; foot.scale.x = 1.4; foot.position.y = .015;
  const pad2 = new THREE.Mesh(new THREE.RingGeometry(.52, .58, 48), new THREE.MeshBasicMaterial({ color: GOLD }));
  pad2.rotation.x = -Math.PI / 2; pad2.position.y = .03;
  const warmth = new THREE.Mesh(new THREE.CircleGeometry(.9, 40), new THREE.MeshBasicMaterial({ map: haloTex(), color: 0xFFC46B, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending }));
  warmth.rotation.x = -Math.PI / 2; warmth.position.y = .025;
  const ciko = new THREE.Group().add(foot, warmth, pad2, me); ciko.position.set(SPOTS.home.x + 2.1, 0, SPOTS.home.z - .3); world.add(ciko); props.push(ciko);

  // Claude walks around the plaza
  const cl = claude(); world.add(cl);
  const pz = fountain(); world.add(pz); props.push(pz);
  world.attach(beam); world.attach(pz.userData.light); // lights stay out of the pop-up groups: a light appearing mid-intro recompiles every shader (stutter)

  return { world, spots, bubbles, cards, cl, screen, doors, wins, props, bot, me, pz };
}

export function createIsland(el, { labels = true, onSelect = () => {}, media = 'media/', intro = false, shape = { w: 12, d: 12, yaw: Math.PI / 4 }, area = (w, h) => ({ cx: w / 2, cy: h / 2, aw: w, ah: h }) } = {}) {
  for (const s of Object.values(SPOTS)) { s.x0 ??= s.x; s.z0 ??= s.z; s.x = s.x0 * shape.w / 12; s.z = s.z0 * shape.d / 12; } // stretch the layout to the shape
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y';
  el.appendChild(renderer.domElement);

  DAY = !!shape.light; if (DAY) renderer.toneMappingExposure = 1.1;
  const scene = new THREE.Scene();
  scene.add(DAY ? new THREE.HemisphereLight(0xFFFFFF, 0xCFC7BA, 1.6) : new THREE.HemisphereLight(0xBFC8FF, 0x22180E, .75));
  const moon = DAY ? new THREE.DirectionalLight(0xFFF4E2, 2.4) : new THREE.DirectionalLight(0xDCE4FF, 2.1);
  moon.position.set(9, 14, 3); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -.0005; moon.shadow.normalBias = .02;
  Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
  scene.add(moon);
  const warm = new THREE.PointLight(0xFFB24D, 14, 7, 2); warm.position.set(0, 1.6, 0); scene.add(warm);

  // stars
  const sp = []; for (let i = 0; i < 260; i++) sp.push((Math.random() - .5) * 60, Math.random() * 30 - 2, (Math.random() - .5) * 60);
  const stars = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)),
    new THREE.PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: .5 }));
  stars.position.set(-14, 0, -14); stars.visible = !DAY; scene.add(stars);
  const gp = []; for (let i = 0; i < 110; i++) gp.push((Math.random() - .5) * 60, Math.random() * 30 - 2, (Math.random() - .5) * 60);
  const gold = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)), // a few warm gold stars between the white ones
    new THREE.PointsMaterial({ map: haloTex(), color: 0xF0C477, size: 7, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  gold.position.copy(stars.position); gold.visible = !DAY; scene.add(gold);

  const ready = new Promise((r) => { THREE.DefaultLoadingManager.onLoad = r; setTimeout(r, 8000); }); // textures loaded (or give up waiting)
  const B = build(scene, media, shape);
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 200);
  const look = new THREE.Vector3(0, .9, 0), view = { target: look.clone(), zoom: 1, yaw: 0, k: 1 }; // k: 1 = island sits in its area, 0 = centred
  let from = null, to = null, t0 = 0, focused = null, drag = 0;
  let dive = null, inside = false, active = null, open = 0, closing = false; // door dive state
  const DIVE = 2200, zlerp = (a, b, e) => a * Math.pow(b / a, e);

  // HTML name tags above each building: icon on top, name + one line, "Enter" once picked
  const pins = {};
  let hot = null, soft = null, idle = performance.now(); // hot: picked (hover / first tap), soft: idle glow, idle: last touch
  const setHot = (k) => { if (hot === k) return; hot = k; for (const [n, p] of Object.entries(pins)) p.classList.toggle('hot', n === k); };
  const setSoft = (k) => { if (soft === k) return; soft = k; for (const [n, p] of Object.entries(pins)) p.classList.toggle('glow', n === k); };
  if (labels) for (const [k, s] of Object.entries(SPOTS)) {
    const b = document.createElement('button'); b.className = 'pin'; b.type = 'button'; b.dataset.k = k;
    const icon = s.icon[0] === '#' ? `<span class="bd g"><svg class="ic"><use href="${s.icon}"/></svg></span>` : `<span class="bd"><img src="${media + s.icon}" alt=""></span>`;
    b.innerHTML = `${icon}<span class="tg"><b>${s.label}</b><small>${s.sub}</small></span><span class="go">Enter<svg class="ic"><use href="#i-play"/></svg></span>`;
    b.onpointerdown = (e) => (b.dataset.pt = e.pointerType);
    b.onpointerenter = (e) => { if (e.pointerType === 'mouse') setHot(k); };
    b.onpointerleave = (e) => { if (e.pointerType === 'mouse' && hot === k) setHot(null); };
    b.onclick = () => { idle = performance.now(); if (b.dataset.pt === 'touch' && hot !== k) setHot(k); else select(k); b.dataset.pt = ''; };
    el.appendChild(b); pins[k] = b;
  }

  // fit the whole island (rim corners, the tower top, the rock below) into area(), centred there.
  // Same maths as frameIsland() in index.html, which places the loader's gold line before this module has loaded.
  let base = { hw: 1, hh: 1, sx: 0, sy: 0 };
  function fit() {
    const w = el.clientWidth, h = el.clientHeight, A = area(w, h), a = shape.yaw, E = Math.atan2(13, 19.8), hw = shape.w / 2, hd = shape.d / 2;
    const R = [Math.cos(a), 0, -Math.sin(a)], U = [-Math.sin(a) * Math.sin(E), Math.cos(E), -Math.cos(a) * Math.sin(E)];
    const pts = [[-hw, 0, -hd], [hw, 0, -hd], [hw, 0, hd], [-hw, 0, hd], [SPOTS.aureyu.x, 7.2, SPOTS.aureyu.z], [0, -4.8, 0]]
      .map(([x, y, z]) => [x * R[0] + z * R[2], x * U[0] + (y - .9) * U[1] + z * U[2]]);
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const u = Math.max((Math.max(...xs) - Math.min(...xs) + .6) / A.aw, (Math.max(...ys) - Math.min(...ys) + .6) / A.ah);
    base = { hw: w * u / 2, hh: h * u / 2, sx: (A.cx - w / 2) * u - (Math.max(...xs) + Math.min(...xs)) / 2, sy: (A.cy - h / 2) * u + (Math.max(...ys) + Math.min(...ys)) / 2 };
    renderer.setSize(w, h, false); place();
  }

  function place() {
    const a = shape.yaw + view.yaw, off = new THREE.Vector3(Math.sin(a) * 19.8, 13, Math.cos(a) * 19.8);
    Object.assign(cam, { left: -base.hw - base.sx * view.k, right: base.hw - base.sx * view.k, top: base.hh + base.sy * view.k, bottom: -base.hh + base.sy * view.k });
    cam.position.copy(view.target).add(off); cam.zoom = view.zoom; cam.lookAt(view.target); cam.updateProjectionMatrix();
  }
  const ease = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

  function focus(name, instant) {
    focused = name;
    const s = name && SPOTS[name];
    const goal = s ? { target: new THREE.Vector3(s.x, s.h * .45, s.z), zoom: 2.3, k: 0 } : { target: look.clone(), zoom: 1, k: 1 };
    if (instant || reduce) { view.target.copy(goal.target); view.zoom = goal.zoom; view.k = goal.k; to = null; }
    else { from = { target: view.target.clone(), zoom: view.zoom, k: view.k }; to = goal; t0 = performance.now(); }
  }
  function select(name) { if (dive || inside) return; setHot(null); focus(name); onSelect(name); }

  // dive pose at progress p: fly to the building, glide down to its door (it opens), then push through
  function pose(name, p, start) {
    const s = SPOTS[name], mid = new THREE.Vector3(s.x, s.h * .45, s.z), at = B.doors[name].userData.at;
    if (p < .45) {
      const e = ease(p / .45);
      view.target.lerpVectors(start.target, mid, e); view.zoom = zlerp(start.zoom, 2.3, e); view.yaw = start.yaw * (1 - e); view.k = start.k * (1 - e);
    } else if (p < .85) {
      const e = ease((p - .45) / .4);
      view.target.lerpVectors(mid, at, e); view.zoom = zlerp(2.3, 7, e); view.yaw = 0; view.k = 0;
    } else {
      view.target.copy(at); view.zoom = zlerp(7, 26, ((p - .85) / .15) ** 2); view.yaw = 0; view.k = 0;
    }
    open = THREE.MathUtils.clamp((p - .6) / .2, 0, 1);
  }
  const wake = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function enter(name) {
    if (dive || inside) return Promise.resolve(null);
    active = focused = name; to = null; closing = false; setHot(null);
    return new Promise((res) => { dive = { name, start: { target: view.target.clone(), zoom: view.zoom, yaw: view.yaw, k: view.k }, t0: performance.now(), res }; wake(); });
  }
  function leave() {
    if (!active) return;
    inside = false; dive = null; closing = !reduce; if (reduce) open = 0;
    focus(null); wake();
  }
  // storyboard: freeze the dive at progress p
  function still(name, p) { active = focused = name; dive = { name, start: { target: look.clone(), zoom: 1, yaw: 0, k: 1 }, still: p }; wake(); }
  const screenAt = (p) => { v.copy(p).project(cam); const r = el.getBoundingClientRect(); return { x: r.left + (v.x * .5 + .5) * r.width, y: r.top + (-v.y * .5 + .5) * r.height }; };

  // mouse: hover picks, click goes in. touch: first tap picks, second tap goes in. drag sideways → turn the island a little
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  const hitAt = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, cam);
    const g = hot && B.spots[hot], y = g?.position.y; // test the picked building at rest, or its lift moves it off the cursor (flicker)
    if (g) { g.position.y = 0; g.updateMatrixWorld(); }
    const h = ray.intersectObjects(B.world.children, true).find((x) => x.object.userData.spot);
    if (g) { g.position.y = y; g.updateMatrixWorld(); }
    return h ? h.object.userData.spot : null;
  };
  let down = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { idle = performance.now(); if (dive || inside) return; down = { x: e.clientX, y: e.clientY, yaw: view.yaw }; drag = 0; });
  renderer.domElement.addEventListener('pointermove', (e) => {
    idle = performance.now();
    if (e.pointerType !== 'mouse' || down || dive || inside) return;
    const k = hitAt(e); setHot(k); renderer.domElement.style.cursor = k ? 'pointer' : '';
  });
  renderer.domElement.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !down) setHot(null); });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    drag = Math.max(drag, Math.abs(e.clientX - down.x));
    if (drag > 6) view.yaw = THREE.MathUtils.clamp(down.yaw - (e.clientX - down.x) * .005, -.7, .7);
  });
  addEventListener('pointerup', (e) => {
    if (!down) return; const was = down; down = null;
    if (Math.abs(e.clientX - was.x) > 6 || e.target !== renderer.domElement) return;
    const k = hitAt(e);
    if (k && (e.pointerType !== 'touch' || k === hot)) select(k);
    else setHot(k);
  });
  addEventListener('pointercancel', () => (down = null)); // phone scroll took the touch over

  // intro: buildings pop up one by one, then windows + street lights switch on (start() runs it; until then the island is empty)
  let intro0 = intro ? Infinity : -Infinity;
  function start() { intro0 = performance.now(); idle = intro0 - 3000; wake(); }
  const pop = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.7 * (x - 1) ** 3 + 1.7 * (x - 1) ** 2); // back-out: overshoots a little
  const grow = (g, s) => { const w = .6 + .4 * Math.min(1, s); g.scale.set(w, Math.max(.001, s), w); g.visible = s > 0; };
  const border = () => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => screenAt(new THREE.Vector3(x * shape.w / 2, .012, z * shape.d / 2))); // the gold rim on screen
  const names = Object.keys(SPOTS);

  const v = new THREE.Vector3();
  let raf = 0, visible = true;
  new ResizeObserver(() => fit()).observe(el); fit();
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  io.observe(el);

  function frame(now) {
    raf = 0;
    const t = now / 1000, it = reduce ? Infinity : now - intro0, lights = THREE.MathUtils.clamp((it - 700) / 700, 0, 1);
    if (to) {
      const k = Math.min(1, Math.max(0, (now - t0) / 900)), e = ease(k);
      view.target.lerpVectors(from.target, to.target, e); view.zoom = zlerp(from.zoom, to.zoom, e); view.k = from.k + (to.k - from.k) * e;
      if (closing) open = 1 - e;
      if (k === 1) { to = null; if (closing) { closing = false; open = 0; } }
    }
    let p = 0;
    if (dive) {
      p = dive.still ?? (reduce ? 1 : Math.min(1, Math.max(0, (now - dive.t0) / DIVE)));
      pose(dive.name, p, dive.start);
    }
    if (active) B.doors[active].userData.hinge.rotation.y = -open * 1.75;
    if (!reduce && !down && !focused && it > 2200) view.yaw += (Math.sin(t * .18) * .12 - view.yaw) * .02; // sway starts once the loader's gold line has faded
    place();
    if (dive?.res && p >= .84) { dive.res(screenAt(B.doors[dive.name].userData.at)); dive.res = null; }
    if (dive && dive.still == null && p === 1) { dive = null; inside = true; }

    if (!reduce) {
      const s = SPOTS.aureyu;
      B.bubbles.forEach((b) => { const a = t * .45 + b.userData.i * Math.PI / 2; b.position.set(s.x + Math.cos(a) * 1.75, 2.9 + b.userData.i * .9, s.z + Math.sin(a) * 1.75); });
      B.cards.forEach((c, i) => { const k = (t * .28 + i / 3) % 1; c.position.set(3.05 - k * 1.4, .37, 0); c.visible = k < .97; });
      const k = (t * .09) % 2, z = 1.7 + (k < 1 ? k : 2 - k) * 3.4;
      B.cl.position.set(-.05, Math.abs(Math.sin(t * 6)) * .06 + .05, z);
      B.cl.rotation.y = shape.yaw + view.yaw;
    } else {
      B.cl.position.set(-.05, .05, 3.6); B.cl.rotation.y = shape.yaw;
      const s = SPOTS.aureyu; B.bubbles.forEach((b) => { const a = b.userData.i * Math.PI / 2; b.position.set(s.x + Math.cos(a) * 1.75, 2.9 + b.userData.i * .9, s.z + Math.sin(a) * 1.75); });
    }

    // pop-up intro, picked building rises + glows, the others dim a little; Robert waves every few seconds
    names.forEach((k, i) => {
      const g = B.spots[k], up = hot === k ? .22 : 0;
      grow(g, pop((it - i * 140) / 650));
      g.userData.lift = reduce ? up : (g.userData.lift ?? 0) + (up - (g.userData.lift ?? 0)) * .14; g.position.y = g.userData.lift;
      const glow = hot === k ? 1.8 : soft === k ? 1.45 + Math.sin(t * 4) * .2 : hot ? .7 : 1;
      for (const m of B.wins[k]) m.emissiveIntensity = 1.25 * glow * lights;
    });
    B.props.forEach((p, i) => { grow(p, pop((it - 520 - (i % 9) * 70) / 650)); if (p.userData.halo) p.userData.halo.material.opacity = DAY ? 0 : lights; });
    warm.intensity = (DAY ? 3 : 14) * lights; B.bot.userData.beam.intensity = (DAY ? 12 : 45) * lights;
    B.cl.visible = it > 1100; B.bubbles.forEach((b) => (b.visible = it > 1200));
    const ppu = el.clientHeight * cam.zoom / (cam.top - cam.bottom); // ortho camera: point size is in pixels, so scale it with the zoom
    B.pz.traverse((o) => o.isPoints && (o.material.size = o.userData.ws * ppu));
    B.pz.userData.update(reduce ? 0 : t, lights);
    // Robert (12 s loop): waves on his gold ring, walks right to the tree, looks around, walks back
    const R = B.bot, c = reduce ? 0 : t % 12, home = -.4, far = R.userData.far, walk = c >= 3 && c < 5 ? 1 : c >= 7 && c < 9 ? -1 : 0;
    R.position.x = c < 3 || c >= 9 ? home : c < 5 ? home + (far - home) * ease((c - 3) / 2) : c < 7 ? far : far + (home - far) * ease((c - 7) / 2);
    R.position.y = walk ? Math.abs(Math.sin(t * 9)) * .05 : 0;
    R.rotation.y += ((walk ? walk * Math.PI / 2 : shape.yaw) - R.rotation.y) * .12;
    R.userData.legs.forEach((l, i) => (l.rotation.x = walk ? Math.sin(t * 9 + i * Math.PI) * .55 : l.rotation.x * .8));
    const wv = (c - .6) / 1.6; R.userData.arm.rotation.z = wv > 0 && wv < 1 ? Math.sin(wv * Math.PI) * (2.3 + Math.sin(t * 14) * .25) : 0;
    R.userData.beam.position.x = R.position.x + 1.2;
    const fr = reduce ? 0 : Math.floor(((t + 3) % 7) * 10), f = fr < 40 ? fr : 0; // Ciko: 4 s wave at 10 fps, then 3 s standing
    B.me.material.map.offset.set((f % 8) / 8, 1 - (Math.floor(f / 8) + 1) / 5);
    B.me.rotation.y = shape.yaw + view.yaw; // face the camera
    setSoft(!hot && !dive && !inside && it > 1800 && now - idle > 8000 ? names[Math.floor((now - idle - 8000) / 2600) % names.length] : null);

    renderer.render(scene, cam);
    if (labels) {
      const w = el.clientWidth, h = el.clientHeight, on = THREE.MathUtils.clamp((it - 1300) / 500, 0, 1);
      for (const [k, s] of Object.entries(SPOTS)) {
        v.set(s.x, s.h + .35, s.z).project(cam); // tag stays put while the building lifts, so hovering it can't flicker
        pins[k].style.transform = `translate(${(v.x * .5 + .5) * w}px, ${(-v.y * .5 + .5) * h}px) translate(-50%, -100%)`;
        pins[k].style.opacity = dive || inside ? '0' : String((focused && focused !== k ? .35 : 1) * on);
        pins[k].style.pointerEvents = dive || inside || on < .5 ? 'none' : '';
      }
    }
    if (!closing && !to && !focused) active = null;
    if (visible && !document.hidden && !inside) raf = requestAnimationFrame(frame); // inside: island sleeps under the page
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);

  return { focus, select, enter, leave, still, fit, border, start, ready, screen: B.screen, destroy() { cancelAnimationFrame(raf); io.disconnect(); renderer.dispose(); el.innerHTML = ''; } };
}
