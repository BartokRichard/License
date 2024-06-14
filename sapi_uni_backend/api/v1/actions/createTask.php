<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
if(isset($_POST['courseId'], $_POST['moduleId'], $_POST['taskName'], $_POST['taskDescription'])) {
    // Kapott értékek
    $courseId = $_POST['courseId'];
    $moduleId = $_POST['moduleId'];

    $taskTitle = $_POST['taskName'];
    $taskDescription = $_POST['taskDescription'];
    $taskDeadline = $_POST['taskDeadline'];

    $fileName = isset($_FILES['taskFile']['name']) ? $_FILES['taskFile']['name'] : null;
    $fileTmpName = isset($_FILES['taskFile']['tmp_name']) ? $_FILES['taskFile']['tmp_name'] : null;
    $fileSize = isset($_FILES['taskFile']['size']) ? $_FILES['taskFile']['size'] : null;
    $fileError = isset($_FILES['taskFile']['error']) ? $_FILES['taskFile']['error'] : null;

    $uuid = uniqid();
    $userData = getUserData();

    $teacherCourses = getTeacherCourses($db, $userData['user_id']);

    // Ellenőrizze a modul határidejét
    $sqlCheckModuleDeadline = "SELECT deadline FROM modules WHERE id = ?";
    $stmtCheckModuleDeadline = $db->prepare($sqlCheckModuleDeadline);
    $stmtCheckModuleDeadline->bind_param("i", $moduleId);
    $stmtCheckModuleDeadline->execute();
    $moduleResult = $stmtCheckModuleDeadline->get_result();

    if ($moduleResult->num_rows > 0) {
        $moduleData = $moduleResult->fetch_assoc();
        $moduleDeadline = $moduleData['deadline'];

        if ($taskDeadline > $moduleDeadline) {
            echo json_encode(array("success" => false, "message" => "A feladat határideje nem lehet később, mint a modul határideje"));
        } else {
            $sql = "SELECT task_name FROM module_tasks WHERE module_id = ?";
            $stmt = $db->prepare($sql);
            $stmt->bind_param("i", $moduleId);
            $stmt->execute();
            $result = $stmt->get_result();
            $existingTaskTitles = array();
            if ($result->num_rows > 0) {
                // Feladatok listája
                while ($row = $result->fetch_assoc()) {
                    $existingTaskTitles[] = $row['task_name'];
                }
            }
            // Ellenőrzés, hogy a megadott feladat címe már szerepel-e a listában
            if (in_array($taskTitle, $existingTaskTitles)) {
                echo json_encode(array("success" => false, "message" => "Már létezik ilyen nevű feladat a modulban"));
            } else {
                $sql_insert = "INSERT INTO module_tasks (module_id, task_name, task_description, deadline) VALUES (?, ?, ?, ?)";
                $stmt_insert = $db->prepare($sql_insert);
                $stmt_insert->bind_param("isss", $moduleId, $taskTitle, $taskDescription, $taskDeadline);
                
                if ($stmt_insert->execute()) {
                    $sql_select_id = "SELECT id FROM module_tasks WHERE module_id = ? AND task_name = ?";
                    $stmt_select_id = $db->prepare($sql_select_id);
                    $stmt_select_id->bind_param("is", $moduleId, $taskTitle);
                    $stmt_select_id->execute();
                    $result_id = $stmt_select_id->get_result();
                    $row_id = $result_id->fetch_assoc();
                    $taskId = $row_id['id'];

                    $uploadDirectory = 'teacher_uploads/';
                    $courseDirectory = $uploadDirectory . 'course_' . $courseId . '/';
                    $moduleDirectory = $courseDirectory . 'module_' . $moduleId . '/';
                    $taskDirectory = $moduleDirectory . 'task_' . $taskId . '/';
                    echo json_encode(array("success" => true, "message" => "A feladat sikeresen létrehozva"));

                    if (!file_exists($courseDirectory)) {
                        mkdir($courseDirectory, 0777, true);
                    }
                    if (!file_exists($moduleDirectory)) {
                        mkdir($moduleDirectory, 0777, true);
                    }
                    if (!file_exists($taskDirectory)) {
                        mkdir($taskDirectory, 0777, true);
                    }
                    $uploadDirectory = 'data/';

                    if ($fileName) {
                        $fileDestination = $taskDirectory . $fileName;
                        $fileDestination = $uploadDirectory . $uuid; 

                        move_uploaded_file($fileTmpName, $fileDestination);

                        $sql_insert_file = "INSERT INTO task_files (task_id, user_id, filename, uuid) VALUES (?, ?, ?, ?)";
                        $stmt_insert_file = $db->prepare($sql_insert_file);

                        $stmt_insert_file->bind_param("iiss", $taskId, $userData['user_id'], $fileName, $uuid);
                        if ($stmt_insert_file->execute()) {
                            move_uploaded_file($fileTmpName, $fileDestination);
                        } else {
                            // Hiba történt a fájl beszúrása közben
                            echo json_encode(array("success" => false, "message" => "Hiba a fájl feltöltése során"));
                        }
                    }
                } else {
                    // Hiba történt a feladat beszúrása közben
                    echo json_encode(array("success" => false, "message" => "Hiba a feladat létrehozása során bent", "redirect" => "login.html"));
                }
            }
        }
    } else {
        echo json_encode(array("success" => false, "message" => "Modul nem található"));
    }
} else {
    echo json_encode(array("success" => false, "message" => "Hiba a feladat létrehozása során kint", "redirect" => "login.html"));
}
?>
