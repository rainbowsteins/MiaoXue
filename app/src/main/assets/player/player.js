// 妙学课程播放器：读取课程 JSON，逐步呈现内容、互动组件与题目，
// 并通过 MiaoBridge（Android JavascriptInterface）回报进度。
//
// 一个“步”（屏幕）由若干块组成，{"type":"pause"} 把它切成几段：
// 每按一次“继续”，同一屏幕上就多出现一段（先讲解、再示例、再提问）。
// 每段最多一个“关卡”：一道题，或一个带 goal 的互动任务（在图上操作达成目标）。
(function () {
  "use strict";

  const params = new URLSearchParams(location.search);
  const courseId = params.get("course") || "calculus";
  const lessonId = params.get("lesson") || "limits-1";
  const bridge = window.MiaoBridge || null;

  const stage = document.getElementById("stage");
  const primaryBtn = document.getElementById("primaryBtn");
  const revealBtn = document.getElementById("revealBtn");
  const feedback = document.getElementById("feedback");
  const feedbackTitle = document.getElementById("feedbackTitle");
  const feedbackBody = document.getElementById("feedbackBody");
  const progressFill = document.getElementById("progressFill");
  const stepCounter = document.getElementById("stepCounter");

  const PRAISE = ["答对了！", "漂亮！", "完全正确！", "很好！", "没错！"];
  const TASK_DONE = ["做到了！", "成功！", "很好！"];

  let lesson = null;
  let index = 0;
  let stepEl = null;
  let segments = [];
  let segIndex = 0;
  let gate = null; // 当前段的关卡：{kind:"question"|"goal", solved, ...}
  let finished = false;
  const stats = { questions: 0, firstTry: 0 };

  document.getElementById("closeBtn").addEventListener("click", () => {
    if (bridge) bridge.close();
    else history.back();
  });

  // ---------- 文本渲染 ----------
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  // 支持 **粗体**、段落（空行分隔）以及 $...$ / $$...$$ 公式
  function richText(src) {
    const parts = String(src).split(/\n\s*\n/);
    return parts
      .map((p) => {
        // 先把公式段保护起来，避免被粗体规则误伤
        const math = [];
        let s = p.replace(/\$\$[\s\S]+?\$\$|\$[^$]+?\$/g, (m) => {
          math.push(m);
          return "\u0000" + (math.length - 1) + "\u0000";
        });
        s = escapeHtml(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
        s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => escapeHtml(math[+i]));
        return "<p>" + s + "</p>";
      })
      .join("");
  }

  function renderMath(el) {
    if (window.renderMathInElement) {
      window.renderMathInElement(el, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  }
  window.MiaoMath = { richText, renderMath };

  // ---------- 加载 ----------
  fetch(`../courses/${courseId}/lessons/${lessonId}.json`)
    .then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then((data) => {
      lesson = data;
      showStep(0);
    })
    .catch((e) => {
      stage.innerHTML = `<div class="error">课程加载失败：${escapeHtml(String(e))}</div>`;
      primaryBtn.disabled = true;
    });

  // ---------- 反馈 ----------
  function setProgress() {
    const n = lesson.steps.length;
    const frac = segments.length ? segIndex / segments.length : 0;
    progressFill.style.width = (100 * (index + frac)) / n + "%";
    stepCounter.textContent = `${Math.min(index + 1, n)}/${n}`;
  }

  function hideFeedback() {
    feedback.hidden = true;
    feedback.className = "feedback";
    revealBtn.hidden = true;
  }

  function showFeedback(kind, title, body) {
    feedback.hidden = false;
    feedback.className = "feedback " + kind;
    feedbackTitle.textContent = title;
    feedbackBody.innerHTML = body ? richText(body) : "";
    renderMath(feedbackBody);
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  // ---------- 步与段 ----------
  function splitSegments(blocks) {
    const out = [[]];
    for (const b of blocks) {
      if (b.type === "pause") out.push([]);
      else out[out.length - 1].push(b);
    }
    return out.filter((s) => s.length);
  }

  function showStep(i) {
    index = i;
    segments = splitSegments(lesson.steps[i].blocks);
    segIndex = 0;
    stepEl = document.createElement("section");
    stepEl.className = "step";
    stage.innerHTML = "";
    stage.appendChild(stepEl);
    stage.scrollTop = 0;
    if (bridge && bridge.onStep) bridge.onStep(i, lesson.steps.length);
    showSegment();
  }

  function showSegment() {
    gate = null;
    hideFeedback();
    setProgress();
    const seg = document.createElement("div");
    seg.className = "segment";
    for (const block of segments[segIndex]) seg.appendChild(buildBlock(block));
    stepEl.appendChild(seg);
    renderMath(seg);
    if (segIndex > 0) {
      requestAnimationFrame(() => seg.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    updateButton();
  }

  function isLastSegment() {
    return segIndex === segments.length - 1;
  }

  function updateButton() {
    if (gate && !gate.solved) {
      if (gate.kind === "question") {
        primaryBtn.textContent = "检查";
        primaryBtn.disabled = !gate.ready;
      } else {
        primaryBtn.textContent = gate.goal.button || "完成上面的任务";
        primaryBtn.disabled = true;
        revealBtn.textContent = "提示";
        revealBtn.hidden = !gate.goal.hint;
      }
      return;
    }
    const lastStep = index === lesson.steps.length - 1;
    primaryBtn.textContent = isLastSegment() && lastStep ? "完成" : "继续";
    primaryBtn.disabled = false;
  }

  function buildBlock(block) {
    const t = block.type;
    if (t === "title") {
      const h = document.createElement("h1");
      h.textContent = block.text;
      return h;
    }
    if (t === "text" || t === "callout") {
      const d = document.createElement("div");
      if (t === "callout") d.className = "callout";
      d.innerHTML = richText(block.text);
      return d;
    }
    if (t === "example") {
      const d = document.createElement("div");
      d.className = "example";
      d.innerHTML = `<div class="example-title">${escapeHtml(block.title || "例题")}</div>` + richText(block.text);
      return d;
    }
    if (t === "widget") return buildWidget(block);
    if (t === "choice" || t === "number") return buildQuestion(block);
    const d = document.createElement("div");
    d.textContent = "未知内容块：" + t;
    return d;
  }

  // ---------- 互动任务 ----------
  function buildWidget(block) {
    const wrap = document.createElement("div");
    if (block.goal) {
      const p = document.createElement("div");
      p.className = "question-prompt task-prompt";
      p.innerHTML = richText("🎯 " + block.goal.prompt);
      wrap.appendChild(p);
      // eslint-disable-next-line no-new-func
      const check = new Function("s", "with (Math) { return (" + block.goal.check + "); }");
      gate = { kind: "goal", goal: block.goal, check, solved: false };
    }
    const w = document.createElement("div");
    w.className = "widget";
    wrap.appendChild(w);
    const myGate = block.goal ? gate : null;
    // 只有学生动手操作之后才判定目标，避免初始状态恰好满足条件
    let touched = false;
    for (const ev of ["pointerdown", "input", "click"]) w.addEventListener(ev, () => { touched = true; }, true);
    // 等元素挂载后再初始化（需要宽度）
    requestAnimationFrame(() =>
      window.MiaoWidgets.mount(w, block, (state) => {
        if (!touched || !myGate || myGate.solved || myGate !== gate) return;
        let ok = false;
        try { ok = !!myGate.check(state); } catch (e) { ok = false; }
        if (ok) {
          myGate.solved = true;
          revealBtn.hidden = true;
          showFeedback("good", pick(TASK_DONE), myGate.goal.success);
          updateButton();
        }
      })
    );
    return wrap;
  }

  // ---------- 题目 ----------
  function buildQuestion(q) {
    const wrap = document.createElement("div");
    wrap.className = "question";
    if (q.prompt) {
      const p = document.createElement("div");
      p.className = "question-prompt";
      p.innerHTML = richText(q.prompt);
      wrap.appendChild(p);
    }
    const g = { kind: "question", q, attempts: 0, solved: false, ready: false, selected: null, input: null, buttons: [] };
    gate = g;
    stats.questions++;

    if (q.type === "choice") {
      const opts = document.createElement("div");
      opts.className = "options";
      q.options.forEach((text, k) => {
        const b = document.createElement("button");
        b.className = "option";
        b.innerHTML = richText(text).replace(/^<p>|<\/p>$/g, "");
        b.addEventListener("click", () => {
          if (g.solved) return;
          g.buttons.forEach((x) => x.classList.remove("selected", "wrong"));
          b.classList.add("selected");
          g.selected = k;
          g.ready = true;
          hideFeedback();
          updateButton();
        });
        g.buttons.push(b);
        opts.appendChild(b);
      });
      wrap.appendChild(opts);
    } else {
      const row = document.createElement("div");
      row.className = "number-row";
      const input = document.createElement("input");
      input.className = "number-input";
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.placeholder = q.placeholder || "输入答案（可写分数，如 1/3）";
      input.addEventListener("input", () => {
        input.classList.remove("wrong");
        g.ready = input.value.trim() !== "";
        hideFeedback();
        updateButton();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !primaryBtn.disabled) primaryBtn.click();
      });
      g.input = input;
      row.appendChild(input);
      if (q.unit) {
        const u = document.createElement("span");
        u.textContent = q.unit;
        row.appendChild(u);
      }
      wrap.appendChild(row);
    }
    return wrap;
  }

  function parseNumber(s) {
    s = s.trim().replace(/，/g, ",").replace(/．/g, ".").replace(/－/g, "-").replace(/／/g, "/");
    const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/);
    if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]);
    if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return parseFloat(s);
    return NaN;
  }

  function isCorrect() {
    const q = gate.q;
    if (q.type === "choice") return gate.selected === q.answer;
    const v = parseNumber(gate.input.value);
    if (Number.isNaN(v)) return null;
    const tol = q.tolerance != null ? q.tolerance : 1e-6 + Math.abs(q.answer) * 1e-3;
    return Math.abs(v - q.answer) <= tol;
  }

  function markSolved(byReveal) {
    const q = gate.q;
    gate.solved = true;
    if (q.type === "choice") {
      gate.buttons.forEach((b, k) => {
        b.disabled = true;
        b.classList.remove("selected", "wrong");
        if (k === q.answer) b.classList.add("correct");
      });
    } else {
      gate.input.disabled = true;
      if (byReveal) gate.input.value = q.answerText || String(q.answer);
      gate.input.classList.remove("wrong");
      gate.input.classList.add("correct");
    }
    revealBtn.hidden = true;
    updateButton();
  }

  function check() {
    const q = gate.q;
    const ok = isCorrect();
    if (ok === null) {
      showFeedback("bad", "看不懂这个答案", "请输入一个数字，例如 2、-0.5 或 1/3。");
      return;
    }
    gate.attempts++;
    if (ok) {
      if (gate.attempts === 1) stats.firstTry++;
      markSolved(false);
      showFeedback("good", pick(PRAISE), q.explain);
    } else {
      if (q.type === "choice") gate.buttons[gate.selected].classList.add("wrong");
      else gate.input.classList.add("wrong");
      gate.ready = false;
      updateButton();
      showFeedback("bad", "还不对，再想想", q.hint || "");
      if (gate.attempts >= 2) {
        revealBtn.textContent = "显示答案";
        revealBtn.hidden = false;
      }
    }
  }

  revealBtn.addEventListener("click", () => {
    if (!gate) return;
    if (gate.kind === "goal") {
      showFeedback("hint", "提示", gate.goal.hint);
      return;
    }
    markSolved(true);
    showFeedback("good", "答案", gate.q.explain);
  });

  primaryBtn.addEventListener("click", () => {
    if (finished) {
      if (bridge) bridge.close();
      else history.back();
      return;
    }
    if (gate && !gate.solved) {
      if (gate.kind === "question") check();
      return;
    }
    if (!isLastSegment()) {
      segIndex++;
      showSegment();
    } else if (index < lesson.steps.length - 1) {
      showStep(index + 1);
    } else {
      finish();
    }
  });

  // ---------- 完成 ----------
  function finish() {
    finished = true;
    progressFill.style.width = "100%";
    stepCounter.textContent = "";
    hideFeedback();
    const pct = stats.questions ? Math.round((100 * stats.firstTry) / stats.questions) : 100;
    stage.innerHTML = `
      <section class="step finish">
        <div class="big">🎉</div>
        <h1>完成「${escapeHtml(lesson.title)}」</h1>
        <p>${escapeHtml(lesson.outro || "继续保持！")}</p>
        <div class="stats">
          <div class="stat"><div class="stat-value">${stats.questions}</div><div class="stat-label">道题</div></div>
          <div class="stat"><div class="stat-value">${pct}%</div><div class="stat-label">一次答对</div></div>
        </div>
      </section>`;
    primaryBtn.textContent = "返回课程";
    primaryBtn.disabled = false;
    if (bridge) bridge.finished(lessonId, stats.questions, stats.firstTry);
  }
})();
