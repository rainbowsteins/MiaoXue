package com.miaoxue.app.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.LinearProgressIndicator
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
import com.miaoxue.app.data.ProgressStore
import com.miaoxue.app.ui.theme.Streak

@Composable
fun HomeScreen(
    courses: List<Course>,
    progress: ProgressStore,
    onOpenCourse: (String) -> Unit,
) {
    val results by progress.results.collectAsState()
    val streak by progress.streak.collectAsState()

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        LazyColumn(
            modifier = Modifier.statusBarsPadding().navigationBarsPadding(),
            contentPadding = PaddingValues(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("妙学", fontSize = 28.sp, fontWeight = FontWeight.Bold)
                        Text(
                            "每天一点点，动手理解数学",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    StreakBadge(streak)
                }
                Spacer(Modifier.height(8.dp))
            }
            item {
                Text("课程", fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
            }
            items(courses, key = { it.id }) { course ->
                val total = course.lessons.size
                val done = course.lessons.count { results.containsKey("${course.id}/${it.id}") }
                CourseCard(course, done, total) { onOpenCourse(course.id) }
            }
            item {
                Text(
                    "更多课程（线性代数、概率……）敬请期待",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(top = 8.dp),
                )
            }
        }
    }
}

@Composable
private fun StreakBadge(days: Int) {
    Surface(
        shape = RoundedCornerShape(50),
        color = MaterialTheme.colorScheme.surfaceVariant,
    ) {
        Row(
            Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("🔥", fontSize = 18.sp)
            Spacer(Modifier.width(4.dp))
            Text("$days 天", fontWeight = FontWeight.Bold, color = if (days > 0) Streak else MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun CourseCard(course: Course, done: Int, total: Int, onClick: () -> Unit) {
    val accent = Color(android.graphics.Color.parseColor(course.color))
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .clickable(onClick = onClick),
    ) {
        Box(
            Modifier
                .fillMaxWidth()
                .height(110.dp)
                .background(accent),
            contentAlignment = Alignment.Center,
        ) {
            Text("∫ dx", color = Color.White, fontSize = 44.sp, fontWeight = FontWeight.Light)
        }
        Column(Modifier.padding(16.dp)) {
            Text(course.title, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(course.subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 14.sp)
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                LinearProgressIndicator(
                    progress = { if (total == 0) 0f else done / total.toFloat() },
                    modifier = Modifier
                        .weight(1f)
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = accent,
                    trackColor = MaterialTheme.colorScheme.outlineVariant,
                    drawStopIndicator = {},
                )
                Spacer(Modifier.size(12.dp))
                Text("$done / $total", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}
