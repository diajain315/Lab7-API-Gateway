import { useState } from "react";
import StudentList from "./StudentList";
import StudentForm from "./StudentForm";
import "./App.css";

function App() {
    const [editingStudent, setEditingStudent] = useState(null);
    const [refresh, setRefresh] = useState(0);

    const handleEdit = (student) => {
        setEditingStudent(student);
    };

    const handleSuccess = () => {
        setEditingStudent(null);
        setRefresh((value) => value + 1);
    };

    const handleCancel = () => {
        setEditingStudent(null);
    };

    return (
        <div className="app">
            <h1>Student Management System</h1>

            <StudentForm
                editingStudent={editingStudent}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />

            <hr />

            <StudentList
                key={refresh}
                onEdit={handleEdit}
            />
        </div>
    );
}

export default App;