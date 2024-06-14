<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

checkUserSession();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $courseId = $_POST["courseId"];
    $userId = $_SESSION["user_id"];

    // Ellenőrizze, hogy a diák már regisztrált-e a kurzusra
    $checkCourseQuery = "SELECT * FROM course WHERE id = ? AND JSON_CONTAINS(registred_student_id, ?, '$')";
    if ($stmt = $db->prepare($checkCourseQuery)) {
        $stmt->bind_param("ii", $courseId, $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows == 0) {
            // Frissítse a kurzust a hallgató azonosítójának hozzáadásával a registred_student_id listához
            $updateCourseQuery = "UPDATE course SET registred_student_id = JSON_ARRAY_APPEND(registred_student_id, '$', ?) WHERE id = ?";
            if ($stmt = $db->prepare($updateCourseQuery)) {
                $stmt->bind_param("ii", $userId, $courseId);
                if ($stmt->execute()) {
                    // Keressük meg az adott kurzushoz tartozó első modul azonosítóját
                    $firstModuleQuery = "SELECT id FROM modules WHERE course_id = ? ORDER BY id ASC LIMIT 1";
                    if ($moduleStmt = $db->prepare($firstModuleQuery)) {
                        $moduleStmt->bind_param("i", $courseId);
                        $moduleStmt->execute();
                        $moduleResult = $moduleStmt->get_result();
                        if ($moduleRow = $moduleResult->fetch_assoc()) {
                            $firstModuleId = $moduleRow['id'];
                            // Frissítjük a students_progress táblát az első modul azonosítójával
                            $insertProgressQuery = "INSERT INTO students_progress (student_id, course_id, module_id) VALUES (?, ?, ?)";
                            if ($progressStmt = $db->prepare($insertProgressQuery)) {
                                $progressStmt->bind_param("iii", $userId, $courseId, $firstModuleId);
                                $progressStmt->execute();
                            }
                        }
                    }
                    $courseName = '';
                    $courseQuery = "SELECT name FROM course WHERE id = ?";
            
                    if ($courseStmt = $db->prepare($courseQuery)) {
                        $courseStmt->bind_param("i", $courseId);
                        $courseStmt->execute();
                        $courseStmt->bind_result($courseName);
                        $courseStmt->fetch();
                        $courseStmt->close();
                    } else {
                        die('Kurzus lekérdezése sikertelen: ' . $db->error);
                    }
                    // // send email notification?
                    $tpl = file_get_contents(WEBDIR . '/tpl/course_registration.tpl');
                    $tpl = str_replace('[name]', $_SESSION['user_name'], $tpl);
                    $tpl = str_replace('[course]', $courseName, $tpl);

                    $to = ($_SESSION['user_email']);
                    $toname = $_SESSION['user_name'];
                    $subject = ('Kurzus regisztráció');
                    SendEmail($to, $toname, $subject, $tpl);

                    $response = array(
                        "success" => true,
                        "message" => "Sikeres jelentkezés a kurzusra és a progress frissítve"
                    );
                    echo json_encode($response);
                } else {
                    $response = array("success" => false, "message" => "Hiba történt a kurzusra jelentkezés során");
                    echo json_encode($response);
                }
            }
        } else {
            $response = array("success" => false, "message" => "A felhasználó már regisztrált a kurzusra");
            echo json_encode($response);
        }
    }
} else {
    $response = array("success" => false, "message" => "Hiba történt a kérés feldolgozása során");
    echo json_encode($response);
}
?>
