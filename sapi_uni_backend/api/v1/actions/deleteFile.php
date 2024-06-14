<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

$userdata = getUserData();
$file_id = $_POST['file_id'];
$course_id = $_POST['course_id'];

if ($_SESSION['user_role'] == 1) {  
    $teacher_courses = getTeacherCourses($db, $userdata['user_id']); // Függvény, ami lekéri a tanár kurzusait

    if (in_array($course_id, $teacher_courses)) {
        // Lekérdezzük a fájl UUID-jét, hogy később törölhessük a fájlt
        $sql = "SELECT uuid FROM task_files WHERE id = ?";
        if ($stmt = $db->prepare($sql)) {
            $stmt->bind_param("i", $file_id);
            $stmt->execute();
            $stmt->bind_result($uuid);
            $stmt->fetch();
            $stmt->close();

            // Töröljük a fájlt az adatbázisból és a szerverről
            $sql = "DELETE FROM task_files WHERE id = ?";
            if ($stmt = $db->prepare($sql)) {
                $stmt->bind_param("i", $file_id);
                $stmt->execute();
                $stmt->close();

                // Töröljük a fájlt a szerverről
                $file_path = dirname(__FILE__) . "/../data/" . $uuid;
                if (file_exists($file_path)) {
                    unlink($file_path);
                    echo json_encode(['success' => true, 'message' => 'A fájl sikeresen törölve.']);
                } else {
                    echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
                }
            } else {
                echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
    }
} else if ($_SESSION['user_role'] == 0) {  // Diák esetén
    // Lekérdezzük a fájl UUID-jét
    $sql = "SELECT uuid FROM students_task_files WHERE uuid = ?";
    if ($stmt = $db->prepare($sql)) {
        $stmt->bind_param("s", $file_id);
        $stmt->execute();
        $stmt->bind_result($uuid);
        $stmt->fetch();
        $stmt->close();

        // Töröljük a fájlt az adatbázisból
        $sql = "DELETE FROM students_task_files WHERE uuid = ?";
        if ($stmt = $db->prepare($sql)) {
            $stmt->bind_param("s", $file_id);
            $stmt->execute();
            $stmt->close();

            // Töröljük a fájlt a szerverről az s_data mappából
            $file_path = dirname(__FILE__) . "/../s_data/" . $uuid;
            if (file_exists($file_path)) {
                unlink($file_path);
                echo json_encode(['success' => true, 'message' => 'A fájl sikeresen törölve.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'A fájl nem sikerült törölni.']);
    }
}
