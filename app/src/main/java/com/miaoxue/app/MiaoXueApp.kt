package com.miaoxue.app

import android.app.Application
import com.miaoxue.app.data.CourseRepository
import com.miaoxue.app.data.ProgressStore

class MiaoXueApp : Application() {
    lateinit var courses: CourseRepository
        private set
    lateinit var progress: ProgressStore
        private set

    override fun onCreate() {
        super.onCreate()
        courses = CourseRepository(this)
        progress = ProgressStore(this)
    }
}
