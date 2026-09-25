import { useEffect, useState } from "react";
import { API_BASE_URL } from "./api";

function StudentList({ onEdit }) {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${API_BASE_URL}/students`);

            if (!response.ok) {
                throw new Error("Unable to load students.");
            }

            const data = await response.json();
            setStudents(data);
        } catch (error) {
            setError("Unable to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this student?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setError("");

            const response = await fetch(
                `${API_BASE_URL}/students/${id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.status === 404) {
                setError("Student not found.");
                return;
            }

            if (!response.ok) {
                throw new Error();
            }

            fetchStudents();
        } catch (error) {
            setError("Unable to delete student. Please try again.");
        }
    };

    if (loading) {
        return (
            <div className="student-list-card">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading students...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="student-list-card">
            <div className="list-header">
                <div>
                    <h2>Students</h2>
                    <p>
                        {students.length}{" "}
                        {students.length === 1
                            ? "student"
                            : "students"}{" "}
                        registered
                    </p>
                </div>
            </div>

            {error && (
                <div className="message error-message">
                    ⚠️ {error}
                </div>
            )}

            {students.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🎓</div>
                    <h3>No students found</h3>
                    <p>
                        Add a student using the form above to see them here.
                    </p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Course</th>
                                <th>Semester</th>
                                <th>Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="student-name">
                                            <div className="student-avatar">
                                                {student.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <span>{student.name}</span>
                                        </div>
                                    </td>

                                    <td>{student.email}</td>

                                    <td>
                                        <span className="course-badge">
                                            {student.course}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="semester-badge">
                                            Semester {student.semester}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="edit-button"
                                                onClick={() =>
                                                    onEdit(student)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="delete-button"
                                                onClick={() =>
                                                    handleDelete(student.id)
                                                }
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default StudentList;