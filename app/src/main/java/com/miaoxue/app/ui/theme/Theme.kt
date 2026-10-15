package com.miaoxue.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// 与 assets/player/player.css 中的配色保持一致
val Good = Color(0xFF1F9D55)
val Streak = Color(0xFFF08C00)

private val Light = lightColorScheme(
    primary = Color(0xFF3B5BDB),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE7ECFF),
    onPrimaryContainer = Color(0xFF1C2A6B),
    background = Color.White,
    surface = Color.White,
    surfaceVariant = Color(0xFFF5F6FA),
    onSurface = Color(0xFF1C1E26),
    onSurfaceVariant = Color(0xFF6B7080),
    outlineVariant = Color(0xFFE2E4EC),
)

private val Dark = darkColorScheme(
    primary = Color(0xFF7B93FF),
    onPrimary = Color(0xFF0E1120),
    primaryContainer = Color(0xFF262D4A),
    onPrimaryContainer = Color(0xFFDCE2FF),
    background = Color(0xFF14161C),
    surface = Color(0xFF14161C),
    surfaceVariant = Color(0xFF1E2129),
    onSurface = Color(0xFFE9EAF0),
    onSurfaceVariant = Color(0xFF9DA2B3),
    outlineVariant = Color(0xFF2D313C),
)

@Composable
fun MiaoXueTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (isSystemInDarkTheme()) Dark else Light,
        content = content,
    )
}
