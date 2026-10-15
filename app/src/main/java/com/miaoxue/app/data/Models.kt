package com.miaoxue.app.data

import kotlinx.serialization.Serializable

// 对应 assets/courses/<id>/course.json（由 content-src/*.py 生成）
@Serializable
data class Course(
    val id: String,
    val title: String,
    val subtitle: String,
    val color: String,
    val chapters: List<Chapter>,
) {
    val lessons: List<LessonRef> get() = chapters.flatMap { it.lessons }
}

@Serializable
data class Chapter(
    val id: String,
    val title: String,
    val description: String,
    val lessons: List<LessonRef>,
)

@Serializable
data class LessonRef(
    val id: String,
    val title: String,
    val steps: Int,
    val questions: Int,
)

data class LessonResult(
    val questions: Int,
    val firstTry: Int,
)
