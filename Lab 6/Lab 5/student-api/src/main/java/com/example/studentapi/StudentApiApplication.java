package com.example.studentapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class StudentApiApplication {

    public static void main(String[] args) {
        var context = SpringApplication.run(StudentApiApplication.class, args);

        System.out.println("MONGO URI = " +
                context.getEnvironment().getProperty("spring.data.mongodb.uri"));
    }
}