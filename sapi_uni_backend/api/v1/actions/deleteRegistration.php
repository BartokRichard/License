<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';

session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $courseId = $_POST["courseId"];
    $userId = $_SESSION["user_id"];

    if ($courseId && $userId) {
        // Ellenőrizzük, hogy a felhasználó már regisztrált-e a kurzusra
        $checkCourseQuery = "SELECT * FROM course WHERE id = ? AND JSON_CONTAINS(registred_student_id, ?, '$')";
        if ($stmt = $db->prepare($checkCourseQuery)) {
            $stmt->bind_param("ii", $courseId, $userId);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $currentStudents = json_decode($row['registred_student_id'], true);

                if (($key = array_search($userId, $currentStudents)) !== false) {
                    unset($currentStudents[$key]);
                    $newStudentsList = json_encode(array_values($currentStudents));

                    // Frissítjük a kurzust az új JSON tömbbel
                    $updateCourseQuery = "UPDATE course SET registred_student_id = ? WHERE id = ?";
                    if ($updateStmt = $db->prepare($updateCourseQuery)) {
                        $updateStmt->bind_param("si", $newStudentsList, $courseId);
                        if ($updateStmt->execute()) {
                            // Sikeres frissítés után töröljük a students_progress rekordot is
                            $deleteProgressQuery = "DELETE FROM students_progress WHERE student_id = ? AND course_id = ?";
                            if ($deleteStmt = $db->prepare($deleteProgressQuery)) {
                                $deleteStmt->bind_param("ii", $userId, $courseId);
                                $deleteStmt->execute();
                            }

                            $response = array("success" => true, "message" => "Sikeres regisztráció törlése.");
                        } else {
                            $response = array("success" => false, "message" => "Hiba történt a kurzusra való regisztráció törlése közben.");
                        }
                    }
                } else {
                    $response = array("success" => false, "message" => "A felhasználó nem regisztrált még a kurzusra.");
                }
            } else {
                $response = array("success" => false, "message" => "A felhasználó nem regisztrált még a kurzusra.");
            }
        }
    } else {
        $response = array("success" => false, "message" => "Hiba történt a kurzusra való regisztráció törlése közben.");
    }
} else {
    $response = array("success" => false, "message" => "iba történt a kurzusra való regisztráció törlése közben.");
}

echo json_encode($response);
?>
