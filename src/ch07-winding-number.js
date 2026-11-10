const { C, num, row } = VCA;
const P = VCA.page({
  id: "ch07-winding-number",
  kicker: 'Draw a closed loop with your finger or mouse (start on empty space). Drag <span class="k3">p</span>.',
  planes: [{ R: 3, unit: false }],
  explain: `
  <h2>How many times does the loop go round?</h2>
  <p>The <b>winding number</b> ν(<i>L</i>, <i>p</i>) counts the net number of times a closed loop <i>L</i> travels counterclockwise around <i>p</i>. Imagine standing at <i>p</i> and watching a runner on the loop: ν is the total angle you turn through, divided by 2π.</p>
  <p>The plane is shaded by winding number. ν is constant on each region the loop cuts out, and changes by exactly ±1 when <i>p</i> crosses the loop.</p>
  <h2>The crossing rule</h2>
  <p>Draw any ray from <i>p</i> out to infinity, here horizontally to the right. Each time the loop crosses the ray counterclockwise (upward) count +1, and each clockwise (downward) crossing counts −1. The total is ν. This is how Needham turns a delicate angle-counting question into simple bookkeeping.</p>`,
});
const [pl] = P.planes, ui = P.ui;
pl.handle("p", { x: 0.55, y: 0.25 }, { color: "c3", label: "p" });
const shade = ui.check("Shade by winding number", true);
const ray = ui.check("Ray and crossings", true);
const def = n => Array.from({ length: n }, (_, i) => { const t = VCA.TAU * i / n; return C.polar(0.6 + 1.6 * Math.cos(t), t); });
const def2 = n => Array.from({ length: n }, (_, i) => { const t = 2 * VCA.TAU * i / n; return C.add(C.polar(1.6, t), C.polar(0.9, -1.5 * t)); });
let loop = def(300), drawing = null, version = 1, cache = { v: 0 };
ui.buttons([["Limaçon", () => { loop = def(300); version++; }], ["Double loop", () => { loop = def2(400); version++; }], ["Reverse", () => { loop = loop.slice().reverse(); version++; }]]);
ui.note("Tip: draw a new loop on empty space; it closes automatically.");
pl.onFree = (type, w) => {
  if (type === "down") drawing = [w];
  else if (type === "move" && drawing) { if (C.dist(w, drawing[drawing.length - 1]) > 0.02) drawing.push(w); }
  else if (type === "up" && drawing) { if (drawing.length > 12) { loop = drawing; version++; } drawing = null; }
};
const colours = { "1": "f1", "2": "f3", "3": "f4", "-1": "f2", "-2": "f5", "-3": "f6" };

VCA.run(() => {
  const L = drawing || loop;
  if (shade.value && !drawing) {
    if (cache.v !== version) {
      const n = 75, step = 2 * pl.R / n, sub = loop.filter((_, i) => i % Math.ceil(loop.length / 300) === 0), paths = {};
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const c = { x: -pl.R + (i + 0.5) * step, y: -pl.R + (j + 0.5) * step }, w = VCA.winding(sub, c);
        if (w) { const X = pl.X(c.x - step / 2), Y = pl.Y(c.y + step / 2), s = step * pl.k + 0.6; (paths[w] = paths[w] || []).push(`M${X.toFixed(1)},${Y.toFixed(1)}h${s.toFixed(1)}v${s.toFixed(1)}h${(-s).toFixed(1)}Z`); }
      }
      cache = { v: version, paths };
    }
    for (const w in cache.paths) pl.spath(cache.paths[w].join(""), { fill: colours[w] || "f5", width: 0, layer: "back" });
  }
  pl.path(L, { color: "c1", width: 2.6, close: !drawing, jump: Infinity });
  if (!drawing) for (let k = 0; k < 8; k++) { const i = Math.floor(k * L.length / 8); pl.arrow(L[i], L[(i + 3) % L.length], { color: "c1", width: 2.6, head: 12 }); }
  const p = pl.get("p");
  pl.dot(p, { color: "c3", r: 5 });
  let nu = 0, crosses = [];
  if (!drawing) {
    nu = VCA.winding(L, p);
    for (let i = 0; i < L.length; i++) {
      const a = L[i], b = L[(i + 1) % L.length];
      if ((a.y - p.y) * (b.y - p.y) < 0) {
        const t = (p.y - a.y) / (b.y - a.y), x = a.x + t * (b.x - a.x);
        if (x > p.x) crosses.push([{ x, y: p.y }, b.y > a.y ? 1 : -1]);
      }
    }
    if (ray.value) {
      pl.line(p, { x: p.x + 20, y: p.y }, { color: "c3", width: 1.5, dash: "6 4" });
      for (const [q, s] of crosses) { pl.dot(q, { color: s > 0 ? "c4" : "c5", r: 5 }); pl.text(q, s > 0 ? "+1" : "−1", { color: s > 0 ? "c4" : "c5", dy: -10, size: 15, italic: false, bold: true }); }
    }
  }
  const sum = crosses.reduce((s, c) => s + c[1], 0);
  P.read(drawing ? `<div class="big">Drawing…</div>` : `<div class="big">ν(L, p) = <b>${nu}</b></div><hr><div>Crossings of the ray: ${crosses.length}</div><div>Signed total: ${crosses.map(c => c[1] > 0 ? "+1" : "−1").join(" ") || "0"} = <b>${sum}</b></div>`);
});
