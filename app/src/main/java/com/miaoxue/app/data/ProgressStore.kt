package com.miaoxue.app.data

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.LocalDate

/** 记录已完成的课时与连续学习天数，保存在 SharedPreferences。 */
class ProgressStore(context: Context) {
    private val prefs = context.getSharedPreferences("progress", Context.MODE_PRIVATE)

    private val _results = MutableStateFlow(loadResults())
    val results: StateFlow<Map<String, LessonResult>> = _results.asStateFlow()

    private val _streak = MutableStateFlow(currentStreak())
    val streak: StateFlow<Int> = _streak.asStateFlow()

    private fun key(courseId: String, lessonId: String) = "$courseId/$lessonId"

    fun isDone(courseId: String, lessonId: String) = _results.value.containsKey(key(courseId, lessonId))

    fun complete(courseId: String, lessonId: String, result: LessonResult) {
        val k = key(courseId, lessonId)
        val best = _results.value[k]?.let { if (it.firstTry >= result.firstTry) it else null } ?: result
        prefs.edit().putString("lesson:$k", "${best.questions},${best.firstTry}").apply()
        _results.value = _results.value + (k to best)
        recordActivity()
    }

    private fun loadResults(): Map<String, LessonResult> =
        prefs.all.mapNotNull { (k, v) ->
            if (!k.startsWith("lesson:") || v !is String) return@mapNotNull null
            val parts = v.split(",").mapNotNull { it.toIntOrNull() }
            if (parts.size != 2) null else k.removePrefix("lesson:") to LessonResult(parts[0], parts[1])
        }.toMap()

    private fun recordActivity() {
        val today = LocalDate.now()
        val last = prefs.getString("lastDay", null)?.let(LocalDate::parse)
        val streak = when {
            last == today -> prefs.getInt("streak", 1)
            last == today.minusDays(1) -> prefs.getInt("streak", 0) + 1
            else -> 1
        }
        prefs.edit().putString("lastDay", today.toString()).putInt("streak", streak).apply()
        _streak.value = streak
    }

    private fun currentStreak(): Int {
        val last = prefs.getString("lastDay", null)?.let(LocalDate::parse) ?: return 0
        val today = LocalDate.now()
        return if (last == today || last == today.minusDays(1)) prefs.getInt("streak", 0) else 0
    }
}
