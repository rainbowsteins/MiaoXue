package com.miaoxue.app.ui.lesson

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.foundation.background
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.miaoxue.app.data.LessonResult

private const val HOST = "appassets.androidplatform.net"

/**
 * 课时播放器：原生壳 + 打包在 assets/player 里的网页。
 * 网页通过 window.MiaoBridge 回报“完成”和“关闭”。
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun LessonScreen(
    courseId: String,
    lessonId: String,
    onFinished: (LessonResult) -> Unit,
    onClose: () -> Unit,
) {
    val finished by rememberUpdatedState(onFinished)
    val close by rememberUpdatedState(onClose)

    BackHandler { close() }

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .safeDrawingPadding(),
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                val loader = WebViewAssetLoader.Builder()
                    .setDomain(HOST)
                    .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
                    .build()
                WebView(context).apply {
                    // AndroidView 默认 WRAP_CONTENT，会让网页的 100% 高度塌缩
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )
                    settings.javaScriptEnabled = true
                    settings.allowFileAccess = false
                    settings.allowContentAccess = false
                    setBackgroundColor(android.graphics.Color.TRANSPARENT)
                    webViewClient = object : WebViewClientCompat() {
                        override fun shouldInterceptRequest(
                            view: WebView,
                            request: WebResourceRequest,
                        ): WebResourceResponse? = loader.shouldInterceptRequest(request.url)

                        // 课程页面只允许停留在本地资源内
                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) =
                            request.url.host != HOST
                    }
                    addJavascriptInterface(
                        Bridge(
                            onFinished = { q, f -> finished(LessonResult(q, f)) },
                            onClose = { close() },
                        ),
                        "MiaoBridge",
                    )
                    loadUrl("https://$HOST/assets/player/index.html?course=$courseId&lesson=$lessonId")
                }
            },
            onRelease = { it.destroy() },
        )
    }
}

private class Bridge(
    private val onFinished: (questions: Int, firstTry: Int) -> Unit,
    private val onClose: () -> Unit,
) {
    private val main = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun onStep(index: Int, total: Int) = Unit

    @JavascriptInterface
    fun finished(lessonId: String, questions: Int, firstTry: Int) {
        main.post { onFinished(questions, firstTry) }
    }

    @JavascriptInterface
    fun close() {
        main.post { onClose() }
    }
}
