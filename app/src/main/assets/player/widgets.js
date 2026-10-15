// 妙学互动组件：基于 canvas 的函数图像与微积分演示。
// 课程 JSON 中的 {"type":"widget","widget":"<名称>", ...} 会被挂载到这里。
(function () {
  "use strict";

  // 课程内容由我们自己编写并随 App 打包，因此可以把表达式编译成函数
  function fn(expr) {
    // eslint-disable-next-line no-new-func
    return new Function("x", "with (Math) { return (" + expr + "); }");
  }

  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function fmt(v, digits) {
    if (!Number.isFinite(v)) return "未定义";
    const d = digits == null ? 4 : digits;
    let s = v.toFixed(d);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s === "-0" ? "0" : s;
  }

  function tex(el, src) {
    if (window.katex) window.katex.render(src, el, { throwOnError: false });
    else el.textContent = src;
  }

  // ---------- 坐标系 ----------
  class Plot {
    constructor(canvas, view, aspect) {
      this.canvas = canvas;
      this.view = Object.assign({}, view);
      this.aspect = aspect || 0.75;
      this.resize();
    }
    resize() {
      const dpr = window.devicePixelRatio || 1;
      const w = this.canvas.clientWidth || 320;
      const h = Math.round(w * this.aspect);
      this.canvas.style.height = h + "px";
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.w = w;
      this.h = h;
      this.ctx = this.canvas.getContext("2d");
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    px(x) { const v = this.view; return ((x - v.xmin) / (v.xmax - v.xmin)) * this.w; }
    py(y) { const v = this.view; return this.h - ((y - v.ymin) / (v.ymax - v.ymin)) * this.h; }
    clear() {
      this.ctx.clearRect(0, 0, this.w, this.h);
    }
    niceStep(range, target) {
      const raw = range / target;
      const p = Math.pow(10, Math.floor(Math.log10(raw)));
      const m = raw / p;
      return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
    }
    grid() {
      const c = this.ctx, v = this.view;
      const sx = this.niceStep(v.xmax - v.xmin, 8);
      const sy = this.niceStep(v.ymax - v.ymin, 6);
      c.lineWidth = 1;
      c.strokeStyle = css("--plot-grid");
      c.beginPath();
      for (let x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax; x += sx) {
        c.moveTo(this.px(x), 0); c.lineTo(this.px(x), this.h);
      }
      for (let y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax; y += sy) {
        c.moveTo(0, this.py(y)); c.lineTo(this.w, this.py(y));
      }
      c.stroke();
      // 坐标轴
      c.strokeStyle = css("--plot-axis");
      c.lineWidth = 1.5;
      c.beginPath();
      if (v.ymin <= 0 && v.ymax >= 0) { c.moveTo(0, this.py(0)); c.lineTo(this.w, this.py(0)); }
      if (v.xmin <= 0 && v.xmax >= 0) { c.moveTo(this.px(0), 0); c.lineTo(this.px(0), this.h); }
      c.stroke();
      // 刻度数字
      c.fillStyle = css("--muted");
      c.font = "11px system-ui, sans-serif";
      const y0 = Math.min(Math.max(this.py(0) + 13, 12), this.h - 4);
      for (let x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax; x += sx) {
        if (Math.abs(x) < sx / 2) continue;
        c.fillText(fmt(x, 3), this.px(x) + 3, y0);
      }
      const x0 = Math.min(Math.max(this.px(0) + 4, 4), this.w - 30);
      for (let y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax; y += sy) {
        if (Math.abs(y) < sy / 2) continue;
        c.fillText(fmt(y, 3), x0, this.py(y) - 3);
      }
    }
    curve(f, color, opts) {
      opts = opts || {};
      const c = this.ctx, v = this.view;
      const from = opts.from != null ? Math.max(opts.from, v.xmin) : v.xmin;
      const to = opts.to != null ? Math.min(opts.to, v.xmax) : v.xmax;
      const n = Math.max(2, Math.round(((to - from) / (v.xmax - v.xmin)) * this.w * 1.5));
      c.strokeStyle = color || css("--plot-curve");
      c.lineWidth = opts.width || 2.5;
      c.setLineDash(opts.dash || []);
      c.beginPath();
      let pen = false;
      const span = v.ymax - v.ymin;
      for (let i = 0; i <= n; i++) {
        const x = from + ((to - from) * i) / n;
        const y = f(x);
        if (!Number.isFinite(y) || y > v.ymax + span * 4 || y < v.ymin - span * 4) { pen = false; continue; }
        if (pen) c.lineTo(this.px(x), this.py(y)); else c.moveTo(this.px(x), this.py(y));
        pen = true;
      }
      c.stroke();
      c.setLineDash([]);
    }
    // 过点 (x1,y1) 斜率 m 的整条直线
    line(x1, y1, m, color, width, dash) {
      const v = this.view, c = this.ctx;
      c.strokeStyle = color;
      c.lineWidth = width || 2;
      c.setLineDash(dash || []);
      c.beginPath();
      c.moveTo(this.px(v.xmin), this.py(y1 + m * (v.xmin - x1)));
      c.lineTo(this.px(v.xmax), this.py(y1 + m * (v.xmax - x1)));
      c.stroke();
      c.setLineDash([]);
    }
    segment(x1, y1, x2, y2, color, width, dash) {
      const c = this.ctx;
      c.strokeStyle = color;
      c.lineWidth = width || 1.5;
      c.setLineDash(dash || []);
      c.beginPath();
      c.moveTo(this.px(x1), this.py(y1));
      c.lineTo(this.px(x2), this.py(y2));
      c.stroke();
      c.setLineDash([]);
    }
    point(x, y, color, hollow, r) {
      const c = this.ctx;
      c.beginPath();
      c.arc(this.px(x), this.py(y), r || 5.5, 0, Math.PI * 2);
      if (hollow) {
        c.fillStyle = css("--bg");
        c.fill();
        c.lineWidth = 2;
        c.strokeStyle = color;
        c.stroke();
      } else {
        c.fillStyle = color;
        c.fill();
      }
    }
    rect(x1, y1, x2, y2, fill, stroke) {
      const c = this.ctx;
      const X = this.px(Math.min(x1, x2)), Y = this.py(Math.max(y1, y2));
      const W = Math.abs(this.px(x2) - this.px(x1)), H = Math.abs(this.py(y2) - this.py(y1));
      c.fillStyle = fill;
      c.fillRect(X, Y, W, H);
      if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.strokeRect(X, Y, W, H); }
    }
    area(f, a, b, fill) {
      const c = this.ctx;
      if (b === a) return;
      const n = Math.max(2, Math.round(Math.abs(this.px(b) - this.px(a))));
      c.fillStyle = fill;
      c.beginPath();
      c.moveTo(this.px(a), this.py(0));
      for (let i = 0; i <= n; i++) {
        const x = a + ((b - a) * i) / n;
        c.lineTo(this.px(x), this.py(f(x)));
      }
      c.lineTo(this.px(b), this.py(0));
      c.closePath();
      c.fill();
    }
    label(text, x, y, color, align) {
      const c = this.ctx;
      c.fillStyle = color || css("--text");
      c.font = "600 13px system-ui, sans-serif";
      c.textAlign = align || "left";
      c.fillText(text, this.px(x), this.py(y));
      c.textAlign = "left";
    }
  }

  // ---------- 小工具 ----------
  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }

  function slider(parent, labelText, min, max, step, value, onInput) {
    const wrap = el("div", "", parent);
    const lab = el("label", "", wrap);
    lab.textContent = labelText;
    const input = el("input", "", wrap);
    input.type = "range";
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value;
    input.addEventListener("input", () => onInput(parseFloat(input.value)));
    return input;
  }

  function chips(parent, items, active, onPick) {
    const row = el("div", "row", parent);
    const btns = items.map(([key, text]) => {
      const b = el("button", "chip" + (key === active ? " active" : ""), row);
      b.textContent = text;
      b.addEventListener("click", () => {
        btns.forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        onPick(key);
      });
      return b;
    });
    return row;
  }

  function canvas(parent) {
    return el("canvas", "", parent);
  }

  function onResize(plots, draw) {
    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => { plots.forEach((p) => p.resize()); draw(); }, 100);
    });
  }

  // 让用户直接在图上拖动来改变滑块
  function dragOnCanvas(plot, input, toValue) {
    function handle(e) {
      const r = plot.canvas.getBoundingClientRect();
      const x = plot.view.xmin + ((e.clientX - r.left) / r.width) * (plot.view.xmax - plot.view.xmin);
      const v = toValue(x);
      if (v == null) return;
      input.value = Math.min(Math.max(v, +input.min), +input.max);
      input.dispatchEvent(new Event("input"));
    }
    plot.canvas.addEventListener("pointerdown", (e) => { plot.canvas.setPointerCapture(e.pointerId); handle(e); });
    plot.canvas.addEventListener("pointermove", (e) => { if (e.buttons) handle(e); });
  }

  const W = {};

  // 1) 逼近：x 从左/右侧趋近 a，观察 f(x)
  W.approach = function (root, o, report) {
    const f = fn(o.f);
    const a = o.a;
    const plot = new Plot(canvas(root), o.view);
    const ctr = el("div", "controls", root);
    let side = "left";
    let t = 0.2; // 0..1，越大越接近
    const maxD = o.maxDistance || 1;
    const input = slider(ctr, "拖动滑块，让 x 越来越接近 " + fmt(a), 0, 1, 0.001, t, (v) => { t = v; draw(); });
    chips(ctr, [["left", "从左侧"], ["right", "从右侧"]], side, (k) => { side = k; draw(); });
    const out = el("div", "readout", ctr);
    const table = el("table", "values", ctr);

    function xOf(tt) {
      const d = maxD * Math.pow(10, -3 * tt); // 1 → 0.001
      return side === "left" ? a - d : a + d;
    }
    dragOnCanvas(plot, input, (x) => {
      const d = Math.abs(x - a);
      if (d < 1e-9) return 1;
      return -Math.log10(Math.min(d, maxD) / maxD) / 3;
    });

    function draw() {
      const x = xOf(t);
      const y = f(x);
      plot.clear();
      plot.grid();
      plot.curve(f);
      if (o.hole) plot.point(a, o.limit, css("--plot-curve"), true);
      plot.segment(x, 0, x, y, css("--plot-second"), 1.5, [4, 4]);
      plot.segment(0, y, x, y, css("--plot-second"), 1.5, [4, 4]);
      plot.point(x, y, css("--plot-second"));
      tex(out, `x = ${fmt(x, 4)},\\quad ${o.name || "f(x)"} = ${fmt(y, 5)}`);
      report({ x, y, side, dist: Math.abs(x - a) });
      const ds = [0.5, 0.1, 0.01, 0.001].map((d) => (side === "left" ? a - d * maxD : a + d * maxD));
      table.innerHTML = "<tr><th>x</th>" + ds.map((d) => `<td>${fmt(d, 4)}</td>`).join("") + "</tr>" +
        "<tr><th>f(x)</th>" + ds.map((d) => `<td>${fmt(f(d), 4)}</td>`).join("") + "</tr>";
    }
    onResize([plot], draw);
    draw();
  };

  // 2) 割线趋向切线
  W.secant = function (root, o, report) {
    const f = fn(o.f);
    const a = o.a;
    const plot = new Plot(canvas(root), o.view);
    const ctr = el("div", "controls", root);
    let s = 0;
    const hMax = o.hMax || 2;
    const input = slider(ctr, "缩小 h：第二个点向第一个点靠近", 0, 1, 0.001, s, (v) => { s = v; draw(); });
    const out = el("div", "readout", ctr);
    dragOnCanvas(plot, input, (x) => {
      const h = Math.max(x - a, 0.001);
      return 1 - Math.log10(h / 0.001) / Math.log10(hMax / 0.001);
    });

    function draw() {
      const h = hMax * Math.pow(0.001 / hMax, s);
      const y1 = f(a), y2 = f(a + h);
      const m = (y2 - y1) / h;
      plot.clear();
      plot.grid();
      plot.curve(f);
      if (o.showTangent && s > 0.85) plot.line(a, y1, o.tangentSlope, css("--plot-third"), 1.5, [6, 4]);
      plot.line(a, y1, m, css("--plot-second"), 2);
      plot.segment(a, y1, a + h, y1, css("--muted"), 1, [3, 3]);
      plot.segment(a + h, y1, a + h, y2, css("--muted"), 1, [3, 3]);
      plot.point(a, y1, css("--plot-curve"));
      plot.point(a + h, y2, css("--plot-second"));
      report({ h, slope: m });
      tex(out, `h = ${fmt(h, 4)},\\quad \\text{割线斜率} = \\frac{f(${fmt(a)}+h)-f(${fmt(a)})}{h} = ${fmt(m, 4)}`);
    }
    onResize([plot], draw);
    draw();
  };

  // 3) 放大：足够近看，光滑曲线像直线
  W.zoom = function (root, o, report) {
    const f = fn(o.f);
    const a = o.a, b = f(a);
    const plot = new Plot(canvas(root), o.view, 0.8);
    const ctr = el("div", "controls", root);
    let z = 0;
    slider(ctr, "放大倍数", 0, 1, 0.001, z, (v) => { z = v; draw(); });
    const out = el("div", "readout", ctr);
    const base = o.view;

    function draw() {
      const k = Math.pow(1000, z); // 1x → 1000x
      const hw = (base.xmax - base.xmin) / 2 / k, hh = (base.ymax - base.ymin) / 2 / k;
      plot.view = { xmin: a - hw, xmax: a + hw, ymin: b - hh, ymax: b + hh };
      plot.clear();
      plot.grid();
      if (o.showTangent) plot.line(a, b, o.tangentSlope, css("--plot-third"), 1.5, [6, 4]);
      plot.curve(f);
      plot.point(a, b, css("--plot-second"));
      tex(out, `\\text{放大} \\approx ${Math.round(k)}\\times`);
      report({ zoom: k });
    }
    onResize([plot], draw);
    draw();
  };

  // 4) 追踪导数：上图切线，下图记录斜率
  W.trace = function (root, o, report) {
    const f = fn(o.f), df = fn(o.df);
    const top = new Plot(canvas(root), o.view, 0.6);
    el("div", "readout", root).textContent = "斜率图（每个 x 处切线的斜率）";
    const bottom = new Plot(canvas(root), o.dview, 0.5);
    const ctr = el("div", "controls", root);
    let x = o.start != null ? o.start : o.view.xmin + 0.3;
    const visited = [];
    const input = slider(ctr, "移动切点", o.view.xmin, o.view.xmax, (o.view.xmax - o.view.xmin) / 400, x, (v) => { x = v; draw(); });
    const out = el("div", "readout", ctr);
    dragOnCanvas(top, input, (v) => v);
    dragOnCanvas(bottom, input, (v) => v);

    function draw() {
      const y = f(x), m = df(x);
      visited.push(x);
      top.clear(); top.grid(); top.curve(f);
      top.line(x, y, m, css("--plot-second"), 2);
      top.point(x, y, css("--plot-second"));
      bottom.clear(); bottom.grid();
      if (o.revealDerivative) bottom.curve(df, css("--plot-third"), { width: 1.5, dash: [5, 4] });
      for (const vx of visited) bottom.point(vx, df(vx), css("--plot-curve"), false, 2.5);
      bottom.point(x, m, css("--plot-second"));
      tex(out, `x = ${fmt(x, 2)},\\quad \\text{切线斜率} = ${fmt(m, 3)}`);
      report({ x, slope: m, visited: visited.length });
    }
    onResize([top, bottom], draw);
    draw();
  };

  // 5) 黎曼和
  W.riemann = function (root, o, report) {
    const f = fn(o.f);
    const a = o.a, b = o.b;
    const plot = new Plot(canvas(root), o.view);
    const ctr = el("div", "controls", root);
    let n = o.n || 4;
    let mode = o.mode || "left";
    const input = slider(ctr, "矩形个数 n", 1, o.maxN || 100, 1, n, (v) => { n = v; draw(); });
    input.value = n;
    chips(ctr, [["left", "左端点"], ["right", "右端点"], ["mid", "中点"]], mode, (k) => { mode = k; draw(); });
    const out = el("div", "readout", ctr);

    function draw() {
      const dx = (b - a) / n;
      let sum = 0;
      plot.clear();
      plot.grid();
      for (let i = 0; i < n; i++) {
        const x0 = a + i * dx;
        const sx = mode === "left" ? x0 : mode === "right" ? x0 + dx : x0 + dx / 2;
        const h = f(sx);
        sum += h * dx;
        plot.rect(x0, 0, x0 + dx, h, css("--plot-fill"), n <= 60 ? css("--plot-curve") : null);
      }
      plot.curve(f);
      let s = `n = ${n},\\quad \\text{矩形面积和} = ${fmt(sum, 5)}`;
      if (o.exact != null && o.showExact !== false) s += `,\\quad \\text{误差} = ${fmt(Math.abs(sum - o.exact), 5)}`;
      tex(out, s);
      report({ n, mode, sum, error: o.exact != null ? Math.abs(sum - o.exact) : null });
    }
    onResize([plot], draw);
    draw();
  };

  // 6) 累积面积函数 A(x)
  W.accumulate = function (root, o, report) {
    const f = fn(o.f), F = fn(o.F);
    const a = o.a;
    const top = new Plot(canvas(root), o.view, 0.55);
    el("div", "readout", root).textContent = "面积函数 A(x)";
    const bottom = new Plot(canvas(root), o.aview, 0.55);
    const ctr = el("div", "controls", root);
    let x = o.start != null ? o.start : a + 1;
    const input = slider(ctr, "移动右端点 x", a, o.view.xmax, (o.view.xmax - a) / 400, x, (v) => { x = v; draw(); });
    const out = el("div", "readout", ctr);
    dragOnCanvas(top, input, (v) => v);
    const A = (t) => F(t) - F(a);

    function draw() {
      top.clear(); top.grid();
      top.area(f, a, x, css("--plot-fill"));
      top.curve(f);
      top.segment(x, 0, x, f(x), css("--plot-second"), 2);
      bottom.clear(); bottom.grid();
      bottom.curve(A, css("--plot-curve"), { from: a, to: x });
      if (o.showSlope) bottom.line(x, A(x), f(x), css("--plot-third"), 1.5, [6, 4]);
      bottom.point(x, A(x), css("--plot-second"));
      report({ x, A: A(x), f: f(x) });
      tex(out, `x = ${fmt(x, 2)},\\quad A(x) = ${fmt(A(x), 3)},\\quad f(x) = ${fmt(f(x), 3)}`);
    }
    onResize([top, bottom], draw);
    draw();
  };

  // 7) 围栏问题：固定周长，最大面积
  W.fence = function (root, o, report) {
    const P = o.perimeter;
    const half = P / 2;
    const shape = new Plot(canvas(root), { xmin: -0.5, xmax: half + 0.5, ymin: -1.4, ymax: half + 0.5 }, (half + 1.9) / (half + 1) * 0.7);
    shape.view.xmin = -0.5 - (half + 1) * 0.215; shape.view.xmax = half + 0.5 + (half + 1) * 0.215;
    el("div", "readout", root).textContent = "面积 A 随宽度 w 的变化";
    const graph = new Plot(canvas(root), { xmin: 0, xmax: half, ymin: 0, ymax: (half * half) / 4 * 1.2 }, 0.5);
    const ctr = el("div", "controls", root);
    let w = o.start || 2;
    const input = slider(ctr, "调整宽度 w", 0.1, half - 0.1, 0.01, w, (v) => { w = v; draw(); });
    const out = el("div", "readout", ctr);
    dragOnCanvas(graph, input, (v) => v);
    const area = (t) => t * (half - t);

    function draw() {
      const l = half - w;
      shape.clear();
      shape.rect(0, 0, w, l, css("--plot-fill"), css("--plot-curve"));
      shape.label(`ℓ = ${fmt(l, 2)}`, w + 0.2, l / 2, css("--muted"));
      shape.label(`w = ${fmt(w, 2)}`, w / 2, -0.9, css("--muted"), "center");
      graph.clear(); graph.grid();
      graph.curve(area);
      graph.point(w, area(w), css("--plot-second"));
      report({ w, l, area: area(w) });
      tex(out, `w = ${fmt(w, 2)},\\quad \\ell = ${fmt(l, 2)},\\quad A = w\\,\\ell = ${fmt(area(w), 3)}`);
    }
    onResize([shape, graph], draw);
    draw();
  };

  // 8) 走向墙壁：每一步走完剩余距离的一半
  W.halving = function (root, o, report) {
    const plot = new Plot(canvas(root), { xmin: -0.08, xmax: 1.12, ymin: -0.3, ymax: 0.5 }, 0.42);
    const ctr = el("div", "controls", root);
    const row = el("div", "row", ctr);
    const stepBtn = el("button", "chip active", row);
    stepBtn.textContent = "走一步 ▸";
    const resetBtn = el("button", "chip", row);
    resetBtn.textContent = "重来";
    const out = el("div", "readout", ctr);
    let steps = 0;
    stepBtn.addEventListener("click", () => { steps++; draw(); });
    resetBtn.addEventListener("click", () => { steps = 0; draw(); });

    function draw() {
      const remaining = Math.pow(0.5, steps);
      const pos = 1 - remaining;
      const c = plot.ctx;
      plot.clear();
      // 地面与墙
      plot.segment(-0.08, 0, 1, 0, css("--plot-axis"), 2);
      plot.rect(1, -0.3, 1.12, 0.5, css("--plot-grid"), css("--plot-axis"));
      // 已经走过的脚印
      for (let k = 0; k <= Math.min(steps, 12); k++) plot.point(1 - Math.pow(0.5, k), 0, css("--plot-curve"), k !== steps, 3);
      // 小人
      plot.segment(pos, 0, pos, 0.22, css("--plot-second"), 3);
      plot.point(pos, 0.28, css("--plot-second"), false, 7);
      // 剩余距离
      if (remaining > 0.004) {
        plot.segment(pos, -0.15, 1, -0.15, css("--plot-second"), 1.5, [4, 3]);
        plot.label("剩余", (pos + 1) / 2, -0.24, css("--plot-second"), "center");
      }
      c.fillStyle = css("--muted");
      tex(out, `\\text{第 } ${steps} \\text{ 步},\\quad \\text{剩余距离} = ${steps <= 20 ? `\\tfrac{1}{${Math.pow(2, steps)}}` : `\\tfrac{1}{2^{${steps}}}`} \\approx ${remaining < 1e-4 ? remaining.toExponential(2).replace("e", "\\times10^{") + "}" : fmt(remaining, 4)} \\text{ 米}`);
      report({ steps, remaining });
    }
    onResize([plot], draw);
    draw();
  };

  window.MiaoWidgets = {
    mount(root, block, onState) {
      const make = W[block.widget];
      if (!make) {
        root.textContent = "未知组件：" + block.widget;
        return;
      }
      if (block.caption) {
        const cap = el("div", "readout", root);
        cap.innerHTML = window.MiaoMath.richText(block.caption);
        window.MiaoMath.renderMath(cap);
      }
      make(root, block, onState || function () {});
    },
  };
})();
