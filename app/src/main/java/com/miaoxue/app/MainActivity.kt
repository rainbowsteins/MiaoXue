package com.miaoxue.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.miaoxue.app.ui.course.CourseScreen
import com.miaoxue.app.ui.home.HomeScreen
import com.miaoxue.app.ui.lesson.LessonScreen
import com.miaoxue.app.ui.theme.MiaoXueTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as MiaoXueApp
        setContent {
            MiaoXueTheme { AppNavHost(app) }
        }
    }
}

@Composable
private fun AppNavHost(app: MiaoXueApp) {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = "home") {
        composable("home") {
            HomeScreen(
                courses = app.courses.courses(),
                progress = app.progress,
                onOpenCourse = { nav.navigate("course/$it") },
            )
        }
        composable(
            "course/{courseId}",
            arguments = listOf(navArgument("courseId") { type = NavType.StringType }),
        ) { entry ->
            val courseId = entry.arguments!!.getString("courseId")!!
            CourseScreen(
                course = app.courses.course(courseId),
                progress = app.progress,
                onBack = { nav.popBackStack() },
                onOpenLesson = { lessonId -> nav.navigate("lesson/$courseId/$lessonId") },
            )
        }
        composable(
            "lesson/{courseId}/{lessonId}",
            arguments = listOf(
                navArgument("courseId") { type = NavType.StringType },
                navArgument("lessonId") { type = NavType.StringType },
            ),
        ) { entry ->
            val courseId = entry.arguments!!.getString("courseId")!!
            val lessonId = entry.arguments!!.getString("lessonId")!!
            LessonScreen(
                courseId = courseId,
                lessonId = lessonId,
                onFinished = { result -> app.progress.complete(courseId, lessonId, result) },
                onClose = {
                    // 防止网页的“关闭”和系统返回键重复出栈
                    if (nav.currentBackStackEntry?.id == entry.id) nav.popBackStack()
                },
            )
        }
    }
}
