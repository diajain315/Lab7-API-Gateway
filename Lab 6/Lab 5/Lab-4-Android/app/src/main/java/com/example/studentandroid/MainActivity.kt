package com.example.studentandroid

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class MainActivity : AppCompatActivity() {

    private lateinit var nameInput: EditText
    private lateinit var emailInput: EditText
    private lateinit var courseInput: EditText
    private lateinit var semesterInput: EditText
    private lateinit var addButton: Button
    private lateinit var studentsText: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.activity_main)

        nameInput = findViewById(R.id.nameInput)
        emailInput = findViewById(R.id.emailInput)
        courseInput = findViewById(R.id.courseInput)
        semesterInput = findViewById(R.id.semesterInput)
        addButton = findViewById(R.id.addButton)
        studentsText = findViewById(R.id.studentsText)

        // Load students when app starts
        loadStudents()

        addButton.setOnClickListener {
            addStudent()
        }
    }

    private fun loadStudents() {

        studentsText.text = "Loading students..."

        RetrofitClient.api.getStudents().enqueue(object :
            Callback<List<Student>> {

            override fun onResponse(
                call: Call<List<Student>>,
                response: Response<List<Student>>
            ) {

                if (response.isSuccessful) {

                    val students = response.body() ?: emptyList()

                    if (students.isEmpty()) {
                        studentsText.text = "No students found."
                        return
                    }

                    val result = StringBuilder()

                    for (student in students) {
                        result.append(
                            "Name: ${student.name}\n" +
                                    "Email: ${student.email}\n" +
                                    "Course: ${student.course}\n" +
                                    "Semester: ${student.semester}\n\n"
                        )
                    }

                    studentsText.text = result.toString()

                } else {

                    val error = response.errorBody()?.string()

                    studentsText.text =
                        "SERVER ERROR\n\n" +
                                "HTTP Code: ${response.code()}\n" +
                                "Message: ${response.message()}\n\n" +
                                "Error: $error"
                }
            }

            override fun onFailure(
                call: Call<List<Student>>,
                t: Throwable
            ) {

                studentsText.text =
                    "ANDROID ERROR\n\n" +
                            "${t.javaClass.simpleName}\n\n" +
                            "${t.message}"
            }
        })
    }

    private fun addStudent() {

        val name = nameInput.text.toString().trim()
        val email = emailInput.text.toString().trim()
        val course = courseInput.text.toString().trim()
        val semesterText = semesterInput.text.toString().trim()

        if (name.isEmpty()) {
            Toast.makeText(
                this,
                "Name is required",
                Toast.LENGTH_SHORT
            ).show()
            return
        }

        if (email.isEmpty()) {
            Toast.makeText(
                this,
                "Email is required",
                Toast.LENGTH_SHORT
            ).show()
            return
        }

        if (course.isEmpty()) {
            Toast.makeText(
                this,
                "Course is required",
                Toast.LENGTH_SHORT
            ).show()
            return
        }

        if (semesterText.isEmpty()) {
            Toast.makeText(
                this,
                "Semester is required",
                Toast.LENGTH_SHORT
            ).show()
            return
        }

        val semester = semesterText.toIntOrNull()

        if (semester == null || semester <= 0) {
            Toast.makeText(
                this,
                "Semester must be greater than 0",
                Toast.LENGTH_SHORT
            ).show()
            return
        }

        val student = Student(
            name = name,
            email = email,
            course = course,
            semester = semester
        )

        addButton.isEnabled = false

        RetrofitClient.api.addStudent(student).enqueue(object :
            Callback<Student> {

            override fun onResponse(
                call: Call<Student>,
                response: Response<Student>
            ) {

                addButton.isEnabled = true

                if (response.isSuccessful) {

                    Toast.makeText(
                        this@MainActivity,
                        "Student added successfully!",
                        Toast.LENGTH_SHORT
                    ).show()

                    nameInput.text.clear()
                    emailInput.text.clear()
                    courseInput.text.clear()
                    semesterInput.text.clear()

                    loadStudents()

                } else {

                    val error = response.errorBody()?.string()

                    Toast.makeText(
                        this@MainActivity,
                        "SERVER ERROR ${response.code()}\n$error",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }

            override fun onFailure(
                call: Call<Student>,
                t: Throwable
            ) {

                addButton.isEnabled = true

                Toast.makeText(
                    this@MainActivity,
                    "ANDROID ERROR\n${t.javaClass.simpleName}\n${t.message}",
                    Toast.LENGTH_LONG
                ).show()
            }
        })
    }
}