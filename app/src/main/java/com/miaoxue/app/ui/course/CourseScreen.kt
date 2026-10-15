package com.miaoxue.app.ui.course

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.miaoxue.app.data.Course
import com.miaoxue.app.data.LessonRef
import com.miaoxue.app.data.LessonResult
import com.miaoxue.app.data.ProgressStore
import com.miaoxue.app.ui.theme.Good

@Composable
fun CourseScreen(
    course: Course,
    progress: ProgressStore,
    onBack: () -> Unit,
    onOpenLesson: (String) -> Unit,
) {
    val results by progress.results.collectAsState()
    val resultOf = { lesson: LessonRef -> results["${course.id}/${lesson.id}"] }
    // 推荐下一课：第一个未完成的课时
    val nextId = course.lessons.firstOrNull { resultOf(it) == null }?.id
    val accent = Color(android.graphics.Color.parseColor(course.color))

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(Modifier.statusBarsPadding().navigationBarsPadding()) {
            Row(
                Modifier.padding(horizontal = 4.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                IconButton(onClick = onBack) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "返回")
                }
                Text(course.title, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            }
            LazyColumn(
                contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 32.dp),
            ) {
                item {
                    Text(course.subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(Modifier.height(12.dp))
                }
                course.chapters.forEach { chapter ->
                    item(key = chapter.id) {
                        Column(Modifier.padding(top = 20.dp, bottom = 8.dp)) {
                            Text(chapter.title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            Text(chapter.description, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
                        }
                    }
                    itemsIndexed(chapter.lessons, key = { _, l -> l.id }) { i, lesson ->
                        LessonRow(
                            lesson = lesson,
                            result = resultOf(lesson),
                            isNext = lesson.id == nextId,
                            isFirst = i == 0,
                            isLast = i == chapter.lessons.lastIndex,
                            accent = accent,
                            onClick = { onOpenLesson(lesson.id) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun LessonRow(
    lesson: LessonRef,
    result: LessonResult?,
    isNext: Boolean,
    isFirst: Boolean,
    isLast: Boolean,
    accent: Color,
    onClick: () -> Unit,
) {
    val line = MaterialTheme.colorScheme.outlineVariant
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        // 学习路径：圆形节点 + 连线
        Column(Modifier.width(56.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Box(Modifier.width(3.dp).height(14.dp).background(if (isFirst) Color.Transparent else line))
            val nodeColor = when {
                result != null -> Good
                isNext -> accent
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
            Box(
                Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(nodeColor)
                    .border(2.dp, if (result == null && !isNext) line else Color.Transparent, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                when {
                    result != null -> Icon(Icons.Filled.Check, contentDescription = "已完成", tint = Color.White)
                    isNext -> Icon(Icons.Filled.PlayArrow, contentDescription = "下一课", tint = Color.White)
                    else -> Box(Modifier.size(10.dp).clip(CircleShape).background(line))
                }
            }
            Box(Modifier.width(3.dp).height(14.dp).background(if (isLast) Color.Transparent else line))
        }
        Spacer(Modifier.width(8.dp))
        Column(Modifier.weight(1f)) {
            Text(lesson.title, fontSize = 17.sp, fontWeight = if (isNext) FontWeight.Bold else FontWeight.Medium)
            val detail = buildString {
                append("${lesson.steps} 步 · ${lesson.questions} 道题")
                if (result != null) append(" · 一次答对 ${result.firstTry}/${result.questions}")
            }
            Text(detail, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        if (isNext) {
            Surface(shape = RoundedCornerShape(50), color = accent) {
                Text(
                    "开始",
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                )
            }
        }
    }
}
