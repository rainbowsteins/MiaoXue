"""微积分入门 —— 课程源文件。

运行 `python3 content-src/calculus.py` 会生成
app/src/main/assets/courses/calculus/ 下的 course.json 与 lessons/*.json。
用 Python 原始字符串编写，LaTeX 反斜杠无需转义。
"""
import json
import math
import pathlib


def title(t): return {"type": "title", "text": t}
def text(t): return {"type": "text", "text": t}
def callout(t): return {"type": "callout", "text": t}
def widget(kind, **kw): return {"type": "widget", "widget": kind, **kw}


def choice(prompt, options, answer, explain, hint=None):
    q = {"type": "choice", "prompt": prompt, "options": options, "answer": answer, "explain": explain}
    if hint: q["hint"] = hint
    return q


def number(prompt, answer, explain, hint=None, answer_text=None, tolerance=None):
    q = {"type": "number", "prompt": prompt, "answer": answer, "explain": explain}
    if hint: q["hint"] = hint
    if answer_text: q["answerText"] = answer_text
    if tolerance is not None: q["tolerance"] = tolerance
    return q


def step(*blocks): return {"blocks": list(blocks)}


# 同一屏幕上分段出现：每按一次“继续”显示下一段
def pause(): return {"type": "pause"}


# 例题框（可配合 pause() 做逐步推导）
def example(title, body): return {"type": "example", "title": title, "text": body}


# 互动任务：在组件上操作直到 check（关于组件状态 s 的 JS 表达式）为真
def goal(prompt, check, success, hint=None):
    g = {"prompt": prompt, "check": check, "success": success}
    if hint: g["hint"] = hint
    return g


LESSONS = {}

# ======================================================================
# 第一章 极限
# ======================================================================
LESSONS["limits-1"] = {
    "title": "无限接近",
    "outro": "你已经掌握了极限最核心的直觉：不看那一点，只看它附近。",
    "steps": [
        # —— 探索：先动手，建立直觉 ——
        step(
            title("一步步走向墙壁"),
            text(r"你离墙 **1 米**。规则只有一条：每一步，走完**剩余距离的一半**。"),
            widget("halving", goal=goal(
                "一直走，直到离墙不到 **1 毫米**（0.001 米）。",
                "s.remaining < 0.001",
                r"一共走了 10 步：剩余 $\left(\tfrac12\right)^{10} = \tfrac1{1024}$ 米，已经不到 1 毫米了。",
                hint="多按几次「走一步」，看看剩余距离每次怎么变化。")),
            pause(),
            text("再多走几步试试。剩余距离会变成 0 吗？"),
            choice("如果一直这样走下去，会发生什么？",
                   ["某一步恰好碰到墙",
                    "永远碰不到墙，但可以离墙任意近",
                    "会停在离墙某个固定的距离"],
                   1,
                   r"每一步之后都还剩下一半，所以永远不会是 0；但走得足够多，剩余距离可以比任何正数都小。"),
        ),
        # —— 讲解：给直觉起名字 ——
        step(
            title("极限：描述“趋向”"),
            text(r"剩余距离依次是 $1,\ \tfrac12,\ \tfrac14,\ \tfrac18,\ \dots$ 它永远是正数，却可以**任意接近** 0。"),
            pause(),
            callout(r"数学家说：这串数的**极限**是 $0$，记作 $$\lim_{n\to\infty}\left(\tfrac12\right)^n = 0$$"),
            pause(),
            text("注意：极限关心的是**趋向哪里**，而不是**能不能到达**。这个想法同样可以用在函数上。"),
        ),
        # —— 探索：函数的“洞” ——
        step(
            title("一个有“洞”的函数"),
            text(r"看这个函数：$$f(x) = \frac{x^2 - 1}{x - 1}$$ 把 $x = 1$ 代进去，会得到 $\frac00$——没有意义。所以图像在 $x = 1$ 处有一个**洞**（空心圆）。"),
            pause(),
            text(r"$f(1)$ 不存在，但我们可以问：$x$ **靠近** 1 时，$f(x)$ 靠近什么？"),
            widget("approach", f="(x*x-1)/(x-1)", a=1, limit=2, hole=True, maxDistance=1,
                   view={"xmin": -1, "xmax": 3, "ymin": -0.5, "ymax": 4.5},
                   goal=goal("从**左侧**把 $x$ 拖到离 1 不到 0.01 的地方。",
                             "s.side == 'left' && s.dist < 0.01",
                             r"$x = 0.99$ 时 $f(x) = 1.99$，越来越接近洞的高度。",
                             hint="拖动滑块往右，或直接在图上拖动橙色点。")),
            pause(),
            text("现在点「从右侧」，再从右边靠近 1，观察表格。"),
            number(r"无论从左还是从右，$x \to 1$ 时 $f(x)$ 都接近哪个数？", 2,
                   r"两侧都趋近 $2$。我们写作 $$\lim_{x\to 1}\frac{x^2-1}{x-1} = 2$$",
                   hint="看看表格里最接近 1 的那一列。"),
        ),
        # —— 例题：一步步推导 ——
        step(
            title("为什么恰好是 2？"),
            example("第 1 步 · 因式分解", r"分子是平方差：$x^2 - 1 = (x-1)(x+1)$"),
            pause(),
            example("第 2 步 · 约分", r"只要 $x \ne 1$，就可以约去 $(x-1)$：$$f(x) = \frac{(x-1)(x+1)}{x-1} = x + 1$$"),
            pause(),
            example("第 3 步 · 看趋向", r"$x \to 1$ 时，$x + 1 \to 2$。所以极限是 $2$。"),
            pause(),
            text(r"原来 $f$ 的图像就是直线 $y = x + 1$，只是在 $x = 1$ 处挖掉了一个点。"),
            callout(r"**极限只关心附近，不关心那一点本身。**"),
        ),
        # —— 引导练习：同样的三步，自己走一遍 ——
        step(
            title("轮到你了"),
            text(r"求 $$\lim_{x\to 3}\frac{x^2 - 9}{x - 3}$$ 按刚才的三步来。"),
            choice(r"第 1 步：$x^2 - 9$ 可以分解成？",
                   [r"$(x-3)(x+3)$", r"$(x-3)^2$", r"$(x-9)(x+1)$"],
                   0,
                   r"平方差公式：$a^2 - b^2 = (a-b)(a+b)$，这里 $b = 3$。"),
            pause(),
            choice("第 2 步：约分之后，函数变成？",
                   [r"$x - 3$", r"$x + 3$", r"$x + 9$"],
                   1,
                   r"$\frac{(x-3)(x+3)}{x-3} = x + 3$（$x \ne 3$）。"),
            pause(),
            number(r"第 3 步：$\displaystyle\lim_{x\to 3}\frac{x^2-9}{x-3} = \;?$", 6,
                   r"$x + 3 \to 3 + 3 = 6$。"),
        ),
        # —— 独立练习：难度递增 ——
        step(
            title("自己试试"),
            number(r"$\displaystyle\lim_{x\to 1}\frac{x^2 + x - 2}{x - 1} = \;?$", 3,
                   r"$x^2 + x - 2 = (x-1)(x+2)$，约分得 $x + 2 \to 3$。",
                   hint=r"找两个数，乘积是 $-2$，和是 $1$。"),
            pause(),
            number(r"$\displaystyle\lim_{x\to -2}\frac{x^2 - 4}{x + 2} = \;?$", -4,
                   r"$x^2 - 4 = (x+2)(x-2)$，约分得 $x - 2 \to -2 - 2 = -4$。",
                   hint="注意这次 x 趋向 −2，约去的是 (x+2)。"),
        ),
        # —— 概念检查 ——
        step(
            title("概念检查"),
            choice(r"如果 $h(2)$ 没有定义，那么 $\lim_{x\to 2} h(x)$……",
                   ["一定不存在", "一定等于 0", "仍然可能存在"],
                   2,
                   r"极限只看附近的行为。本课的 $f(x)$ 就是例子：$f(1)$ 没定义，极限却是 2。"),
            pause(),
            choice(r"某个函数满足 $g(1) = 5$，但当 $x \to 1$ 时 $g(x)$ 越来越接近 $2$。那么 $\lim_{x\to 1} g(x)$ 等于？",
                   ["5", "2", "不存在"],
                   1,
                   r"极限只看趋向，不看那一点的取值。$g(1) = 5$ 只是一个“跳开”的点，极限仍是 $2$。"),
        ),
    ],
}

LESSONS["limits-2"] = {
    "title": "计算极限",
    "outro": "代入、约分、观察——三种工具已经能解决很多极限了。",
    "steps": [
        step(
            title("最简单的情况：直接代入"),
            text(r"对于多项式这样“没有断点”的函数，极限就等于函数值。例如 $$\lim_{x\to 2}(x^2 + 3x) = 2^2 + 3\cdot 2 = 10$$"),
            number(r"$\displaystyle\lim_{x\to -1}(2x^2 - x + 4) = \;?$", 7,
                   r"$2\cdot(-1)^2 - (-1) + 4 = 2 + 1 + 4 = 7$。",
                   hint=r"注意 $(-1)^2 = 1$，以及减去 $-1$ 等于加 1。"),
        ),
        step(
            text(r"这种性质叫**连续**：函数图像在这一点没有断开、没有跳跃、没有洞。"),
            callout(r"若 $f$ 在 $a$ 处连续，则 $\lim_{x\to a} f(x) = f(a)$。多项式、$\sin x$、$\cos x$、$e^x$ 在每一点都连续。"),
            choice(r"上一课的 $\dfrac{x^2-1}{x-1}$ 在 $x = 1$ 处连续吗？",
                   ["连续", "不连续"],
                   1,
                   r"它在 $x=1$ 处没有定义（有个洞），所以不连续——这也正是不能直接代入的原因。"),
        ),
        step(
            title("遇到 0/0：先化简"),
            text(r"直接代入得到 $\frac00$ 时，说明还需要多做一步。常见的办法是**因式分解后约分**。"),
            text(r"例如：$$\lim_{x\to 2}\frac{x^2 - 4}{x - 2} = \lim_{x\to 2}(x+2) = 4$$"),
            number(r"$\displaystyle\lim_{x\to 0}\frac{x^2 + 5x}{x} = \;?$", 5,
                   r"分子提出 $x$：$\frac{x(x+5)}{x} = x + 5$，极限是 $0 + 5 = 5$。",
                   hint=r"分子的两项都含有 $x$。"),
        ),
        step(
            number(r"$\displaystyle\lim_{h\to 0}\frac{(3+h)^2 - 9}{h} = \;?$", 6,
                   r"展开：$(3+h)^2 - 9 = 6h + h^2$，除以 $h$ 得 $6 + h$，当 $h\to 0$ 时趋近 $6$。" "\n\n"
                   "这种形式会在下一章“导数”中反复出现！",
                   hint=r"先展开 $(3+h)^2 = 9 + 6h + h^2$。"),
        ),
        step(
            title("一个著名的极限"),
            text(r"有时候没法化简，就只能观察。来看 $$\frac{\sin x}{x}$$ 当 $x\to 0$ 时会怎样（$x$ 用弧度）。"),
            widget("approach", f="sin(x)/x", a=0, limit=1, hole=True, maxDistance=2, name=r"\tfrac{\sin x}{x}",
                   view={"xmin": -7, "xmax": 7, "ymin": -0.5, "ymax": 1.4}),
            number(r"$\displaystyle\lim_{x\to 0}\frac{\sin x}{x}$ 是多少？", 1,
                   r"它趋近 $1$。这说明当 $x$ 很小时，$\sin x \approx x$——工程和物理中常用这个近似。"),
        ),
        step(
            title("极限也可能不存在"),
            text(r"考虑 $\dfrac{|x|}{x}$：当 $x > 0$ 时等于 $1$，当 $x < 0$ 时等于 $-1$。"),
            choice(r"$\displaystyle\lim_{x\to 0}\frac{|x|}{x}$ 是多少？",
                   ["1", "-1", "0", "不存在"],
                   3,
                   r"从右侧趋近 $1$，从左侧趋近 $-1$。两侧不一致，所以极限**不存在**。",
                   hint="分别想想 x 从左侧和从右侧接近 0 的情况。"),
        ),
    ],
}

# ======================================================================
# 第二章 导数
# ======================================================================
LESSONS["derivatives-1"] = {
    "title": "瞬时变化率",
    "outro": "导数 = 割线斜率的极限 = 切线斜率 = 瞬时变化率。",
    "steps": [
        step(
            title("平均速度"),
            text(r"一个小球从高处落下，$t$ 秒后下落的距离约为 $$s(t) = 5t^2 \text{（米）}$$"),
            number(r"从 $t=1$ 到 $t=3$ 秒，小球的**平均速度**是多少米/秒？", 20,
                   r"$s(3) - s(1) = 45 - 5 = 40$ 米，用时 2 秒，平均速度 $= 40 / 2 = 20$ 米/秒。",
                   hint="平均速度 = 位移 ÷ 时间。"),
        ),
        step(
            text(r"可是速度在不断变大。那么**恰好在** $t = 1$ 秒这一瞬间，速度是多少？"),
            text(r"“瞬间”的时间长度是 0，直接用“位移 ÷ 时间”会得到 $\frac00$。"),
            callout(r"办法：计算从 $1$ 到 $1+h$ 的平均速度，再让 $h\to 0$。这正是上一章的极限！"),
            choice(r"从 $t = 1$ 到 $t = 1+h$，平均速度的表达式是？",
                   [r"$\dfrac{s(1+h) - s(1)}{h}$", r"$\dfrac{s(1+h)}{1+h}$", r"$s(1+h) - s(1)$"],
                   0,
                   "位移是 $s(1+h) - s(1)$，用时是 $h$，两者相除。"),
        ),
        step(
            title("从割线到切线"),
            text(r"在图像上，平均变化率就是连接两点的**割线**的斜率。下面是 $f(x) = x^2$，第一个点固定在 $x=1$。"),
            widget("secant", f="x*x", a=1, hMax=2, showTangent=True, tangentSlope=2,
                   view={"xmin": -1.5, "xmax": 3.5, "ymin": -1, "ymax": 9}),
            number("当 h 越来越小时，割线斜率趋近于多少？", 2,
                   r"斜率趋近 $2$。此时割线几乎变成在 $x=1$ 处“贴着”曲线的直线——**切线**。"),
        ),
        step(
            text(r"我们用代数验证一下：$$\frac{(1+h)^2 - 1^2}{h} = \frac{2h + h^2}{h} = 2 + h$$"),
            text(r"当 $h \to 0$ 时，它趋近 $2$。"),
            callout(r"**导数**的定义：$$f'(a) = \lim_{h\to 0}\frac{f(a+h) - f(a)}{h}$$ 它就是曲线在 $x=a$ 处切线的斜率，也就是**瞬时变化率**。"),
        ),
        step(
            number(r"对于 $f(x) = x^2$，$f'(3)$ 等于多少？", 6,
                   r"$\frac{(3+h)^2 - 9}{h} = 6 + h \to 6$。你在上一章已经算过这个极限了！",
                   hint=r"仿照上一步，展开 $(3+h)^2$。"),
        ),
        step(
            text(r"回到落体：$s(t) = 5t^2 = 5\cdot t^2$。"),
            number(r"$t = 1$ 秒那一瞬间，小球的速度是多少米/秒？", 10,
                   r"$\frac{5(1+h)^2 - 5}{h} = 10 + 5h \to 10$ 米/秒。这就是 $s'(1)$。",
                   hint=r"它是 $x^2$ 在 $x=1$ 处导数的 5 倍。"),
        ),
    ],
}

LESSONS["derivatives-2"] = {
    "title": "导数函数与幂法则",
    "outro": "有了幂法则，求多项式的导数只需要几秒钟。",
    "steps": [
        step(
            title("每一点都有一个斜率"),
            text(r"在每个 $x$ 处都可以算出切线斜率 $f'(x)$。把这些斜率画出来，就得到一个新函数——**导数函数**。"),
            text(r"拖动下面的切点，看看 $f(x) = x^2$ 在各处的斜率被记录成了什么形状。"),
            widget("trace", f="x*x", df="2*x", start=-1.8,
                   view={"xmin": -2, "xmax": 2, "ymin": -0.5, "ymax": 4},
                   dview={"xmin": -2, "xmax": 2, "ymin": -4.5, "ymax": 4.5}),
            choice(r"斜率点连起来是什么图形？",
                   ["一条水平线", "一条过原点的直线", "一条抛物线"],
                   1,
                   r"它是直线 $y = 2x$。也就是说 $(x^2)' = 2x$。"),
        ),
        step(
            title("寻找规律"),
            text(r"用定义可以算出："),
            text(r"$$(x)' = 1,\qquad (x^2)' = 2x,\qquad (x^3)' = 3x^2$$"),
            choice(r"猜一猜：$(x^4)'$ 是什么？",
                   [r"$4x^3$", r"$x^3$", r"$4x^4$", r"$3x^4$"],
                   0,
                   r"规律是：**指数拿下来作系数，指数减一。**"),
        ),
        step(
            callout(r"**幂法则：** $$(x^n)' = n\,x^{n-1}$$ 另外，常数的导数为 $0$，并且 $(c\,f)' = c\,f'$，$(f + g)' = f' + g'$。"),
            text(r"例如：$(3x^2 + 5x - 7)' = 3\cdot 2x + 5 - 0 = 6x + 5$。"),
            number(r"$f(x) = x^3$，求 $f'(2)$。", 12,
                   r"$f'(x) = 3x^2$，所以 $f'(2) = 3\cdot 4 = 12$。"),
        ),
        step(
            number(r"$g(x) = 4x^3 - 2x^2 + x$，求 $g'(1)$。", 9,
                   r"$g'(x) = 12x^2 - 4x + 1$，$g'(1) = 12 - 4 + 1 = 9$。",
                   hint="逐项求导：每一项分别用幂法则。"),
        ),
        step(
            title("看图读导数"),
            text(r"下面是 $f(x) = x^3 - 3x$。移动切点，观察斜率什么时候为正、为负、为零。"),
            widget("trace", f="x*x*x-3*x", df="3*x*x-3", start=-2.2, revealDerivative=False,
                   view={"xmin": -2.5, "xmax": 2.5, "ymin": -4, "ymax": 4},
                   dview={"xmin": -2.5, "xmax": 2.5, "ymin": -4, "ymax": 14}),
            choice(r"在哪些 $x$ 处切线是**水平**的？",
                   [r"$x = 0$", r"$x = \pm 1$", r"$x = \pm\sqrt3$", r"$x = \pm 3$"],
                   1,
                   r"$f'(x) = 3x^2 - 3 = 0 \Rightarrow x = \pm 1$。这两点恰好是图像的“山顶”和“谷底”。"),
        ),
    ],
}

LESSONS["derivatives-3"] = {
    "title": "导数的应用：最优化",
    "outro": "求最大、最小值——导数最常见的用途之一。",
    "steps": [
        step(
            title("放大看曲线"),
            text(r"为什么切线能代表曲线的方向？把光滑曲线放大足够多倍，它看起来就像一条直线。"),
            widget("zoom", f="sin(2*x)+0.3*x*x", a=0.6, showTangent=True,
                   tangentSlope=2 * math.cos(1.2) + 0.36,
                   view={"xmin": -2.4, "xmax": 3.6, "ymin": -2.5, "ymax": 3}),
            callout("这条“放大后看到的直线”就是切线。导数告诉我们曲线在这一点附近**往哪个方向走、走得多快**。"),
        ),
        step(
            title("山顶的斜率"),
            text(r"在一段光滑曲线的最高点（山顶），曲线不再上升，也还没开始下降。"),
            choice("在光滑曲线的山顶或谷底，导数等于多少？",
                   ["正数", "零", "负数", "无法确定"],
                   1,
                   r"切线是水平的，所以 $f'(x) = 0$。**找最值的第一步：解方程 $f'(x) = 0$。**"),
        ),
        step(
            title("围栏问题"),
            text(r"你有 **20 米**长的篱笆，要围成一个矩形菜园。宽为 $w$，长为 $\ell$，则 $2w + 2\ell = 20$。"),
            text("拖动滑块，找到让面积最大的宽度。"),
            widget("fence", perimeter=20, start=2),
            number(r"面积最大时，宽 $w$ 是多少米？", 5,
                   r"$\ell = 10 - w$，面积 $A(w) = w(10 - w) = 10w - w^2$。$A'(w) = 10 - 2w = 0 \Rightarrow w = 5$。",
                   hint="观察下方面积图的最高点。"),
        ),
        step(
            number("最大面积是多少平方米？", 25,
                   r"$A(5) = 5 \times 5 = 25$ 平方米。最优的矩形是一个**正方形**。"),
        ),
        step(
            text(r"再来一个：把一个数 $x$ 和它的“缺口” $8 - x$ 相乘，得到 $P(x) = x(8 - x)$。"),
            number(r"$P(x)$ 的最大值是多少？", 16,
                   r"$P'(x) = 8 - 2x = 0 \Rightarrow x = 4$，$P(4) = 4 \times 4 = 16$。",
                   hint=r"先求 $P'(x)$，令它等于 0。"),
        ),
    ],
}

# ======================================================================
# 第三章 积分
# ======================================================================
LESSONS["integrals-1"] = {
    "title": "面积与黎曼和",
    "outro": "用越来越细的矩形逼近面积——这就是定积分。",
    "steps": [
        step(
            title("从速度到距离"),
            text("一辆车以 **12 米/秒** 匀速行驶了 5 秒。"),
            number("它走了多少米？", 60,
                   r"$12 \times 5 = 60$ 米。在“速度–时间”图上，这正是一个 $5 \times 12$ 矩形的**面积**。"),
        ),
        step(
            text(r"如果速度在变化呢？比如 $v(t) = t^2$。速度图不再是水平线，面积也不再是矩形。"),
            text("想法：把时间切成小段，每一小段里把速度当作常数，用矩形近似。"),
            widget("riemann", f="x*x", a=0, b=1, n=4, mode="left", exact=1 / 3, showExact=False, maxN=100,
                   view={"xmin": -0.1, "xmax": 1.15, "ymin": -0.05, "ymax": 1.1}),
            choice("矩形越多，矩形面积之和会怎样？",
                   ["越来越偏离真实面积", "越来越接近某个固定值", "一直不变"],
                   1,
                   "矩形越窄，与曲线之间的缝隙越小，面积和就越接近曲线下方的真实面积。"),
        ),
        step(
            text(r"把 $n$ 拖到最大，或切换“左端点 / 右端点 / 中点”，观察面积和趋向的值。"),
            widget("riemann", f="x*x", a=0, b=1, n=10, mode="right", exact=1 / 3, showExact=False, maxN=200,
                   view={"xmin": -0.1, "xmax": 1.15, "ymin": -0.05, "ymax": 1.1}),
            number(r"$y = x^2$ 在 $0$ 到 $1$ 之间、$x$ 轴上方的面积是多少？（可以写成分数）", 1 / 3,
                   r"面积是 $\tfrac13 \approx 0.3333$。",
                   tolerance=0.002, answer_text="1/3",
                   hint="n 很大时，三种方法的结果都接近同一个数。它是一个简单的分数。"),
        ),
        step(
            callout(r"**定积分：** $$\int_a^b f(x)\,dx = \lim_{n\to\infty}\sum_{i=1}^{n} f(x_i)\,\Delta x$$ 符号 $\int$ 是拉长的 S，代表“求和（Sum）”；$dx$ 代表无限细的宽度。"),
            choice(r"$\displaystyle\int_0^1 x^2\,dx$ 表示什么？",
                   [r"$x^2$ 在 $x = 1$ 处的斜率",
                    r"$y = x^2$ 在 $[0,1]$ 上与 $x$ 轴之间的面积",
                    r"$x^2$ 的最大值"],
                   1,
                   r"定积分就是“曲线下的面积”（在 $x$ 轴下方的部分算负值）。"),
        ),
        step(
            text(r"在 $x$ 轴下方的面积算作**负数**。"),
            number(r"$\displaystyle\int_0^4 (x - 2)\,dx = \;?$", 0,
                   r"$[0,2]$ 上是一个面积为 $2$ 的三角形，在 $x$ 轴下方，记为 $-2$；$[2,4]$ 上面积为 $+2$。合计 $0$。",
                   hint=r"画出直线 $y = x - 2$，看看它和 $x$ 轴围成的两个三角形。", tolerance=1e-6),
        ),
    ],
}

LESSONS["integrals-2"] = {
    "title": "微积分基本定理",
    "outro": "求导与积分互为逆运算——这是整个微积分最漂亮的一个结论。",
    "steps": [
        step(
            title("会“生长”的面积"),
            text(r"让积分的右端点变成变量：$$A(x) = \int_0^x f(t)\,dt$$ 它是从 $0$ 到 $x$ 的面积，随 $x$ 增大而“生长”。"),
            widget("accumulate", f="1+0.5*x", F="x+0.25*x*x", a=0, start=1,
                   view={"xmin": -0.3, "xmax": 4, "ymin": -0.3, "ymax": 3.3},
                   aview={"xmin": -0.3, "xmax": 4, "ymin": -0.5, "ymax": 8.5}),
            choice(r"当 $f(x)$ 越大时，$A(x)$ 增长得……",
                   ["越慢", "越快", "速度不变"],
                   1,
                   r"右端点每向右挪一点点 $\Delta x$，新增的面积约等于一条细长矩形 $f(x)\cdot\Delta x$。$f(x)$ 越高，增长越快。"),
        ),
        step(
            text(r"换句话说，$A(x)$ 的**增长速度**（即它的导数）就是 $f(x)$："),
            callout(r"**微积分基本定理（第一部分）：** $$\frac{d}{dx}\int_0^x f(t)\,dt = f(x)$$"),
            widget("accumulate", f="1+0.5*x", F="x+0.25*x*x", a=0, start=2, showSlope=True,
                   view={"xmin": -0.3, "xmax": 4, "ymin": -0.3, "ymax": 3.3},
                   aview={"xmin": -0.3, "xmax": 4, "ymin": -0.5, "ymax": 8.5}),
            number(r"在 $x = 2$ 处，$A(x)$ 曲线的切线斜率是多少？（这里 $f(x) = 1 + 0.5x$）", 2,
                   r"斜率 $= A'(2) = f(2) = 1 + 0.5\times 2 = 2$。下图中绿色虚线的斜率始终等于上图中橙色竖线的高度。"),
        ),
        step(
            title("用反导数算面积"),
            text(r"如果 $F'(x) = f(x)$，我们称 $F$ 是 $f$ 的**反导数**（原函数）。"),
            callout(r"**基本定理（第二部分）：** $$\int_a^b f(x)\,dx = F(b) - F(a)$$ 不用再画无数个矩形，只要找到反导数！"),
            choice(r"哪个函数的导数是 $x^2$？",
                   [r"$2x$", r"$\tfrac13 x^3$", r"$x^3$", r"$\tfrac12 x^2$"],
                   1,
                   r"$\left(\tfrac13 x^3\right)' = \tfrac13\cdot 3x^2 = x^2$。✓",
                   hint="用幂法则倒推：什么函数求导后指数会变成 2？"),
        ),
        step(
            text(r"验证上一课的结果：$$\int_0^1 x^2\,dx = \tfrac13\cdot 1^3 - \tfrac13\cdot 0^3 = \tfrac13$$ 和黎曼和逼近的结果完全一致！"),
            number(r"$\displaystyle\int_0^2 x^2\,dx = \;?$（可以写成分数）", 8 / 3,
                   r"$\tfrac13\cdot 2^3 - 0 = \tfrac83 \approx 2.667$。",
                   answer_text="8/3", tolerance=0.005),
        ),
        step(
            text(r"最后，回到第一个问题：速度 $v(t) = 3t^2$ 米/秒，从 $t=0$ 到 $t=2$ 秒走了多远？"),
            number("走过的距离是多少米？", 8,
                   r"$3t^2$ 的反导数是 $t^3$，距离 $= 2^3 - 0^3 = 8$ 米。",
                   hint=r"$3t^2$ 是谁的导数？"),
        ),
        step(
            title("回顾"),
            text("• **极限**：描述“无限接近”。\n"
                 "• **导数**：割线斜率的极限，表示瞬时变化率。\n"
                 "• **积分**：矩形面积和的极限，表示累积量。\n"
                 "• **基本定理**：两者互为逆运算。"),
            callout("恭喜你完成了微积分入门！"),
        ),
    ],
}

COURSE = {
    "id": "calculus",
    "title": "微积分入门",
    "subtitle": "从极限到积分，用互动图像理解变化与累积",
    "color": "#3B5BDB",
    "chapters": [
        {"id": "limits", "title": "第一章 · 极限", "description": "无限接近的数学",
         "lessons": ["limits-1", "limits-2"]},
        {"id": "derivatives", "title": "第二章 · 导数", "description": "变化有多快",
         "lessons": ["derivatives-1", "derivatives-2", "derivatives-3"]},
        {"id": "integrals", "title": "第三章 · 积分", "description": "累积有多少",
         "lessons": ["integrals-1", "integrals-2"]},
    ],
}


def main():
    root = pathlib.Path(__file__).resolve().parent.parent
    out = root / "app/src/main/assets/courses/calculus"
    (out / "lessons").mkdir(parents=True, exist_ok=True)
    course = dict(COURSE)
    chapters = []
    for ch in COURSE["chapters"]:
        lessons = []
        for lid in ch["lessons"]:
            lesson = LESSONS[lid]
            questions = sum(1 for s in lesson["steps"] for b in s["blocks"] if b["type"] in ("choice", "number"))
            lessons.append({"id": lid, "title": lesson["title"], "steps": len(lesson["steps"]), "questions": questions})
            data = {"id": lid, **lesson}
            (out / "lessons" / f"{lid}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        chapters.append({**ch, "lessons": lessons})
    course["chapters"] = chapters
    (out / "course.json").write_text(json.dumps(course, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {len(LESSONS)} lessons to {out}")


if __name__ == "__main__":
    main()
