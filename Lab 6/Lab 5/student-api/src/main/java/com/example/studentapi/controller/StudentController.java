package com.example.studentapi.controller;

import com.example.studentapi.model.Student;
import com.example.studentapi.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DuplicateKeyException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/students")
@CrossOrigin(origins = "http://localhost:5173")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    // GET /students
    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(studentService.getAllStudents());
    }

    // GET /students/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Student> getStudentById(@PathVariable String id) {

        Optional<Student> student = studentService.getStudentById(id);

        if (student.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(student.get());
    }

    // POST /students
    // @PostMapping
    // public ResponseEntity<Student> createStudent(
    //         @Valid @RequestBody Student student) {

    //     Student createdStudent = studentService.createStudent(student);

    //     return ResponseEntity
    //             .status(HttpStatus.CREATED)
    //             .body(createdStudent);
    // }
    @PostMapping
public ResponseEntity<?> createStudent(@Valid @RequestBody Student student) {
    try {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(studentService.createStudent(student));
    } catch (DuplicateKeyException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body("Email already exists");
    }
}

    // PUT /students/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Student> updateStudent(
            @PathVariable String id,
            @Valid @RequestBody Student student) {

        Optional<Student> existingStudent =
                studentService.getStudentById(id);

        if (existingStudent.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        student.setId(id);

        Student updatedStudent =
                studentService.updateStudent(student);

        return ResponseEntity.ok(updatedStudent);
    }

    // DELETE /students/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(
            @PathVariable String id) {

        Optional<Student> student =
                studentService.getStudentById(id);

        if (student.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        studentService.deleteStudent(id);

        return ResponseEntity.noContent().build();
    }
}