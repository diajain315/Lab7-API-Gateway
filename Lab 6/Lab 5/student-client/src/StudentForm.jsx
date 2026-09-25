import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";

function StudentForm({ editingStudent, onSuccess, onCancel }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        course: "",
        semester: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (editingStudent) {
            setFormData({
                name: editingStudent.name,
                email: editingStudent.email,
                course: editingStudent.course,
                semester: editingStudent.semester,
            });
        } else {
            setFormData({
                name: "",
                email: "",
                course: "",
                semester: "",
            });
        }

        setError("");
        setSuccess("");
    }, [editingStudent]);

    const handleChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value,
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            return "Name is required.";
        }

        if (!formData.email.trim()) {
            return "Email is required.";
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(formData.email)) {
            return "Invalid email format.";
        }

        if (!formData.course.trim()) {
            return "Course is required.";
        }

        if (!formData.semester || Number(formData.semester) <= 0) {
            return "Semester must be greater than 0.";
        }

        return "";
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const student = {
            name: formData.name,
            email: formData.email,
            course: formData.course,
            semester: Number(formData.semester),
        };

        try {
            let response;

            if (editingStudent) {
                response = await fetch(
                    `${API_BASE_URL}/students/${editingStudent.id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(student),
                    }
                );
            } else {
                response = await fetch(`${API_BASE_URL}/students`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(student),
                });
            }

            if (response.status === 400) {
                const errorText = await response.text();

                try {
                    const errorData = JSON.parse(errorText);

                    setError(
                        errorData.message ||
                        errorData.error ||
                        "Invalid student information."
                    );
                } catch {
                    setError(
                        errorText || "Invalid student information."
                    );
                }

                return;
            }

            if (response.status === 404) {
                setError("Student not found.");
                return;
            }

            if (!response.ok) {
                throw new Error();
            }

            setSuccess(
                editingStudent
                    ? "Student updated successfully!"
                    : "Student added successfully!"
            );

            setFormData({
                name: "",
                email: "",
                course: "",
                semester: "",
            });

            onSuccess();
        } catch (error) {
            setError("Unable to save student. Please try again.");
        }
    };

    return (
        <div className="student-form-card">
            <div className="form-header">
                <h2>
                    {editingStudent ? "Edit Student" : "Add Student"}
                </h2>

                <p>
                    {editingStudent
                        ? "Update the student's information."
                        : "Enter the details to add a new student."}
                </p>
            </div>

            {error && (
                <div className="message error-message">
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div className="message success-message">
                    ✓ {success}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Name</label>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter student name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Course</label>

                    <input
                        type="text"
                        name="course"
                        placeholder="Enter course"
                        value={formData.course}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-group">
                    <label>Semester</label>

                    <input
                        type="number"
                        name="semester"
                        placeholder="Enter semester"
                        min="1"
                        value={formData.semester}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-buttons">
                    <button
                        type="submit"
                        className="primary-button"
                    >
                        {editingStudent
                            ? "Update Student"
                            : "Add Student"}
                    </button>

                    {editingStudent && (
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default StudentForm;