const cfg = {
  art: String.raw`
  ⠀⠀⣦⡀⠀⠀⠀⠀⢀⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⢸⣏⠻⣶⣤⡶⢾⡿⠁⠀⢠⣄⡀⢀⣴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠀⠀⠀
⠀⠀⣀⣼⠷⠀⠀⠁⢀⣿⠃⠀⠀⢀⣿⣿⣿⣇⠀⠀⠀⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠴⣾⣯⣅⣀⠀⠀⠀⠈⢻⣦⡀⠒⠻⠿⣿⡿⠿⠓⠂⠀⠀⢂⡇⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠉⢻⡇⣤⣾⣿⣷⣿⣿⣤⠀⠀⣿⠁⠀⠀⠀⢀⣴⣿⣿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠸⣿⡿⠏⠀⢀⠀⠀⠿⣶⣤⣤⣤⣄⣀⣴⣿⡿⢻⣿⡆⠂⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠟⠁⠀⢀⣼⠀⠀⠀⠹⣿⣟⠿⠿⠿⡿⠋⠀⠘⣿⣇⠀⠄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⢳⣶⣶⣿⣿⣇⣀⠀⠀⠙⣿⣆⠀⠀⠀⠀⠀⠀⠛⠿⣿⣦⣤⣀⠀⠀
⠀⠀⠀⠀⠀⠀⣹⣿⣿⣿⣿⠿⠋⠁⠀⣹⣿⠳⠀⠀⠀⠀⠀⠀⢀⣠⣽⣿⡿⠟⠃
⠀⠀⠀⠈⠀⢰⠿⠛⠻⢿⡇⠀⠀⠀⣰⣿⠏⠀⠀⢀⠀⠀⠁⣾⣿⠟⠋⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠋⠀⠀⣰⣿⣿⣾⣿⠿⢿⣷⣀⢀⣿⡇⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⠀⠀⠀⠋⠉⠁⠀⠀⠀⠀⠙⢿⣿⣿⠇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢿⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀
`,
  density: 1,
  physics: {
    repelRadius: 120,
    repelForce: 0.5,
    mode: "repel",
    spring: 0.05,
    friction: 0.88,
  },
  render: {
    background: "#0a0a0c",
    restColor: [122, 104, 190],
    activeColor: [205, 188, 255],
    dotSize: 1.1,
    dotGrow: 0.7,
    scale: 0.6,
  },
};

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const { physics, render } = cfg;
const repelSign = physics.mode === "attract" ? -1 : 1;

let particles = [];
let dpr = Math.min(window.devicePixelRatio || 1, 2);
const mouse = { x: -9999, y: -9999, active: false };

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const SUBX = 2;
const SUBY = 4;
const BRAILLE_MAP = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
  [1, 1],
  [1, 2],
  [0, 3],
  [1, 3],
];

function build() {
  const lines = cfg.art.replace(/\t/g, "  ").split("\n");
  while (lines.length && lines[0].trim() === "") lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();

  const cols = lines.reduce((m, l) => Math.max(m, l.length), 0);
  const rows = lines.length;
  if (!cols || !rows) {
    particles = [];
    return;
  }

  const gridCols = cols * SUBX;
  const gridRows = rows * SUBY;
  const step = Math.max(1, cfg.density | 0);
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pad = Math.min(w, h) * 0.12;
  const fit = Math.min((w - pad * 2) / gridCols, (h - pad * 2) / gridRows);
  const cell = Math.max(1, fit * (render.scale || 1));
  const offX = (w - gridCols * cell) / 2 + cell / 2;
  const offY = (h - gridRows * cell) / 2 + cell / 2;

  const dots = [];
  for (let r = 0; r < rows; r++) {
    const line = lines[r];
    for (let c = 0; c < cols; c++) {
      const ch = line[c];
      if (!ch) continue;
      const code = ch.codePointAt(0);
      if (code >= 0x2800 && code <= 0x28ff) {
        const bits = code & 0xff;
        for (let i = 0; i < 8; i++) {
          if (bits & (1 << i)) {
            const [dx, dy] = BRAILLE_MAP[i];
            dots.push([c * SUBX + dx, r * SUBY + dy]);
          }
        }
      } else if (ch !== " ") {
        dots.push([c * SUBX + 0.5, r * SUBY + 1.5]);
      }
    }
  }

  const next = [];
  for (let i = 0; i < dots.length; i += step) {
    const ox = offX + dots[i][0] * cell;
    const oy = offY + dots[i][1] * cell;
    const prev = particles[next.length];
    next.push({
      x: prev ? prev.x : ox,
      y: prev ? prev.y : oy,
      ox,
      oy,
      vx: 0,
      vy: 0,
    });
  }
  particles = next;
}

const [r0, g0, b0] = render.restColor;
const [r1, g1, b1] = render.activeColor;

function tick() {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const radius = physics.repelRadius;
  for (const p of particles) {
    if (mouse.active) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < radius * radius && dist2 > 0.01) {
        const dist = Math.sqrt(dist2);
        const f = (1 - dist / radius) * physics.repelForce * repelSign;
        p.vx += (dx / dist) * f * radius * 0.06;
        p.vy += (dy / dist) * f * radius * 0.06;
      }
    }

    p.vx += (p.ox - p.x) * physics.spring;
    p.vy += (p.oy - p.y) * physics.spring;
    p.vx *= physics.friction;
    p.vy *= physics.friction;
    p.x += p.vx;
    p.y += p.vy;

    const off = Math.min(1, (Math.abs(p.vx) + Math.abs(p.vy)) / 6);
    const r = Math.round(r0 + (r1 - r0) * off);
    const g = Math.round(g0 + (g1 - g0) * off);
    const b = Math.round(b0 + (b1 - b0) * off);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, render.dotSize + off * render.dotGrow, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(tick);
}

function pointer(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;
}

window.addEventListener("pointermove", pointer);
window.addEventListener("pointerdown", pointer);
window.addEventListener("pointerleave", () => {
  mouse.active = false;
  mouse.x = mouse.y = -9999;
});
window.addEventListener("resize", () => {
  resize();
  build();
});

resize();
build();
tick();
