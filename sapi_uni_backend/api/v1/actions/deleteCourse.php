<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $courseId = $_POST['courseId'];
    $teacherCourses = isset($_POST['teacherCourses']) ? $_POST['teacherCourses'] : array();

    $userData = getUserData();

    if ($userData['user_role'] == 1 && in_array($courseId, $teacherCourses) || $userData['user_role'] == 2) {
        // Ellenőrizzük, hogy vannak-e még hozzárendelt hallgatók
        $checkStudentsQuery = "SELECT registred_student_id FROM course WHERE id = ?";
        $stmt = $db->prepare($checkStudentsQuery);
        $stmt->bind_param("i", $courseId);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();

        if (!$row || $row['registred_student_id'] !== '[]') {
            echo json_encode(array('success' => false, 'message' => 'A kurzushoz még hallgatók vannak hozzárendelve.'));
            exit;
        }
        $stmt->close();

        // A kurzushoz kapcsolódó chat bejegyzések törlése
        $deleteChatQuery = "DELETE FROM chat WHERE course_id = ?";
        $stmt = $db->prepare($deleteChatQuery);
        $stmt->bind_param("i", $courseId);
        $stmt->execute();
        $stmt->close();

        // Töröld a fájlokat a data mappából, amelyek az adott kurzushoz tartoznak
        $deleteFilesQuery = "SELECT uuid FROM task_files WHERE task_id IN (SELECT id FROM module_tasks WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?))";
        if ($stmt = $db->prepare($deleteFilesQuery)) {
            $stmt->bind_param("i", $courseId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            while ($row = $result->fetch_assoc()) {
                $uuid = $row['uuid'];
                $filePath = 'data/' . $uuid;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }
            $stmt->close();

            // Töröld a task_files rekordokat
            $deleteTaskFilesQuery = "DELETE FROM task_files WHERE task_id IN (SELECT id FROM module_tasks WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?))";
            if ($stmt = $db->prepare($deleteTaskFilesQuery)) {
                $stmt->bind_param("i", $courseId);
                $stmt->execute();
                $stmt->close();

                // Töröld a module_tasks rekordokat
                $deleteModuleTasksQuery = "DELETE FROM module_tasks WHERE module_id IN (SELECT id FROM modules WHERE course_id = ?)";
                if ($stmt = $db->prepare($deleteModuleTasksQuery)) {
                    $stmt->bind_param("i", $courseId);
                    $stmt->execute();
                    $stmt->close();

                    // Töröld a modules rekordokat
                    $deleteModulesQuery = "DELETE FROM modules WHERE course_id = ?";
                    if ($stmt = $db->prepare($deleteModulesQuery)) {
                        $stmt->bind_param("i", $courseId);
                        $stmt->execute();
                        $stmt->close();

                        // Végül töröld a course rekordot
                        $deleteCourseQuery = "DELETE FROM course WHERE id = ?";
                        if ($stmt = $db->prepare($deleteCourseQuery)) {
                            $stmt->bind_param("i", $courseId);
                            $stmt->execute();
                            $stmt->close();

                            echo json_encode(array('success' => true, 'message' => 'A kurzus sikeresen törölve.'));
                        } else {
                            echo json_encode(array('success' => false, 'message' => 'Nem sikerült törölni a kurzust.'));
                        }
                    } else {
                        echo json_encode(array('success' => false, 'message' => 'Nem sikerült törölni a modulokat.'));
                    }
                } else {
                    echo json_encode(array('success' => false, 'message' => 'Nem sikerült törölni a modul feladatokat.'));
                }
            } else {
                echo json_encode(array('success' => false, 'message' => 'Nem sikerült törölni a fájlokat az adatbázisból.'));
            }
        } else {
            echo json_encode(array('success' => false, 'message' => 'Nem sikerült lekérni a fájlokat az adatbázisból.'));
        }
    } else {
        echo json_encode(array('success' => false, 'message' => 'Nincs jogosultság.', 'redirect' => 'login.html'));
    }
}
?>
