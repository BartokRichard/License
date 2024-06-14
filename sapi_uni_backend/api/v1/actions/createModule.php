<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';

session_start();

$userRole = $_SESSION['user_role'];

if ($userRole == 1 || $userRole == 2) {
    $currentCourseId = $_POST['courseId'];
    $moduleName = $_POST['moduleName'];
    $moduleDeadline = $_POST['moduleDeadline'];
    $moduleDescription = $_POST['moduleDescription'];
    $emptyArray = json_encode(array()); // Üres tömb létrehozása

    if ($userRole == 1) {
        $teacherCourses = $_POST['teacherCourses'];
        if (!in_array($currentCourseId, $teacherCourses)) {
            $response = array("success" => false, 'message' => "A tanárnak nincs joga a modul létrehozásához ebben a kurzusban");
            echo json_encode($response);
            exit();
        }
    }

    // Ellenőrizze a kurzus határidejét
    $sqlCheckCourseDeadline = "SELECT deadline FROM course WHERE id = ?";
    $stmtCheckCourseDeadline = $db->prepare($sqlCheckCourseDeadline);
    $stmtCheckCourseDeadline->bind_param("i", $currentCourseId);
    $stmtCheckCourseDeadline->execute();
    $courseResult = $stmtCheckCourseDeadline->get_result();

    if ($courseResult->num_rows > 0) {
        $courseData = $courseResult->fetch_assoc();
        $courseDeadline = $courseData['deadline'];

        if ($moduleDeadline > $courseDeadline) {
            $response = array(
                "success" => false, 
                'message' => "A modul határideje nem lehet később, mint a kurzus határideje"
            );
            echo json_encode($response);
        } else {
            // Ellenőrizze, hogy létezik-e már ilyen nevű modul az adott kurzusban
            $sqlCheckModule = "SELECT id FROM modules WHERE course_id = ? AND name = ?";
            $stmtCheckModule = $db->prepare($sqlCheckModule);
            $stmtCheckModule->bind_param("is", $currentCourseId, $moduleName);
            $stmtCheckModule->execute();
            $result = $stmtCheckModule->get_result();

            if ($result->num_rows > 0) {
                // Már létezik ilyen nevű modul a kurzusban
                $response = array(
                    "success" => false, 
                    'message' => "Már létezik ilyen nevű modul a kurzusban"
                );
                echo json_encode($response);
            } else {
                // Modul létrehozása
                $sql = "INSERT INTO modules (course_id, name, deadline, description, students_to_eval) 
                VALUES (?, ?, ?, ?, ?)";
                $stmt = $db->prepare($sql);
                $stmt->bind_param("issss", $currentCourseId, $moduleName, 
                $moduleDeadline, $moduleDescription, $emptyArray);

                if ($stmt->execute()) {
                    $response = array("success" => true, 'message' => "Modul sikeresen létrehozva");
                    echo json_encode($response);
                } else {
                    $response = array("success" => false, 'message' => "Modul létrehozása sikertelen: " . $stmt->error);
                    echo json_encode($response);
                }

                $stmt->close();
            }

            $stmtCheckModule->close();
        }
    } else {
        $response = array("success" => false, 'message' => "Kurzus nem található");
        echo json_encode($response);
    }

    $stmtCheckCourseDeadline->close();
} else {
    $response = array("success" => false, 'message' => "Csak tanárok és adminok hozhatnak létre modulokat");
    echo json_encode($response);
}
?>
