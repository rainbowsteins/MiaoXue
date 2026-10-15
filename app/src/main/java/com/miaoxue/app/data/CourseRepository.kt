package com.miaoxue.app.data

import android.content.Context
import kotlinx.serialization.json.Json

class CourseRepository(private val context: Context) {
    private val json = Json { ignoreUnknownKeys = true }
    private val cache = mutableMapOf<String, Course>()

    fun courseIds(): List<String> =
        context.assets.list("courses")?.sorted().orEmpty()

    fun course(id: String): Course = cache.getOrPut(id) {
        val text = context.assets.open("courses/$id/course.json").bufferedReader().use { it.readText() }
        json.decodeFromString<Course>(text)
    }

    fun courses(): List<Course> = courseIds().map(::course)
}
