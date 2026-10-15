# 妙学 MiaoXue

一个中文互动数学学习 App（Android）。每节课由一张张小卡片组成：读一点、拖一拖、答一题，即时反馈。

第一门课：**微积分入门**（3 章 7 课）

| 章 | 课时 | 互动组件 |
|---|---|---|
| 极限 | 无限接近、计算极限 | `approach`（从两侧逼近） |
| 导数 | 瞬时变化率、导数函数与幂法则、最优化 | `secant`（割线→切线）、`trace`（斜率图）、`zoom`（局部线性）、`fence`（围栏问题） |
| 积分 | 面积与黎曼和、微积分基本定理 | `riemann`（黎曼和）、`accumulate`（面积函数） |

## 架构

```
原生壳（Kotlin + Jetpack Compose）          课时播放器（离线网页，assets/player）
┌──────────────────────────────┐           ┌───────────────────────────────┐
│ 首页 → 课程路径 → 课时 WebView │ ◀──────▶ │ player.js  读取课时 JSON       │
│ ProgressStore（进度、连续天数）│ MiaoBridge│ widgets.js canvas 互动图像     │
└──────────────────────────────┘           │ KaTeX      公式渲染（已打包）  │
                                           └───────────────────────────────┘
```

- 课时页面通过 `WebViewAssetLoader` 从 `https://appassets.androidplatform.net/assets/...` 加载，完全离线。
- 网页调用 `MiaoBridge.finished(lessonId, 题数, 一次答对数)` 记录进度，`MiaoBridge.close()` 返回课程页。

## 构建

需要 JDK 17 和 Android SDK（已安装在 `~/devtools`）：

```sh
export JAVA_HOME=~/devtools/jdk17 ANDROID_HOME=~/devtools/android-sdk
./gradlew assembleDebug
# 输出：app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## 编写课程

课程源文件是 `content-src/calculus.py`（用 Python 原始字符串写，LaTeX 不用转义）。修改后运行：

```sh
python3 content-src/calculus.py   # 生成 app/src/main/assets/courses/calculus/
```

每个课时是若干“步”，每步包含若干块：

| 块 | 写法 |
|---|---|
| 标题 | `title("…")` |
| 正文 | `text(r"… $公式$ … **重点** …")`，空行分段，`$$…$$` 为独立公式 |
| 提示框 | `callout(r"…")` |
| 选择题 | `choice(题干, [选项…], 正确下标, 解析, hint=提示)` |
| 填空题 | `number(题干, 答案, 解析, hint=…, answer_text="1/3", tolerance=…)`，学生可输入分数 |
| 互动组件 | `widget("secant", f="x*x", a=1, view={...})`，参数见 `assets/player/widgets.js` |

每步最多一道题；答错两次后会出现“显示答案”。

### 在浏览器里预览课时

```sh
cd app/src/main/assets && python3 -m http.server 8765
# 打开 http://127.0.0.1:8765/player/index.html?course=calculus&lesson=limits-1
```

## 说明

本项目的代码、课程内容和图标均为原创。开发时参考了 Brilliant App 的整体架构思路（原生壳 + 网页课时播放器 + JS 桥），
但没有使用其任何代码、素材或课程内容。
