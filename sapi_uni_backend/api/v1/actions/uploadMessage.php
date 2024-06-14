<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Felhasználói adatok ellenőrzése
checkUserSession();

$dataToSend = $_POST['dataToSend'];
$courseId = $dataToSend['courseId'];

$stmt_course = $db->prepare("SELECT teacher_id, assisstant_teacher_ids FROM course WHERE id = ?");
$stmt_course->bind_param("i", $courseId);
$stmt_course->execute();
$stmt_course->bind_result($teacher_id, $assistant_teacher_ids_json);
$stmt_course->fetch();
$assistant_teacher_ids = json_decode($assistant_teacher_ids_json, true);
$stmt_course->close();

$sender_id = $_SESSION['user_id']; // Sender's user ID from the session

function insertNotification($db, $sender, $receiver, $message, $redirect) {
    $stmt_notif = $db->prepare("INSERT INTO notifications (sender, receiver, type, redirect, message) VALUES (?, ?, 1, ?, ?)");
    $stmt_notif->bind_param("iiss", $sender, $receiver, $redirect, $message);
    $stmt_notif->execute();
    $stmt_notif->close();
}

if ($_SESSION['user_role'] == 0) {
    $receivers = array_merge([$teacher_id], $assistant_teacher_ids); // Include the main teacher and assistants
    $userName = $dataToSend['userName'];
    $userRole = $_SESSION['user_role'];
    $userId = $dataToSend['userId'];
    $newMessage = '(' . $userName . ' - ' . $userRole . ') ' . $dataToSend['message'];
    $notificationMessage = $userName . '-től egy új üzeneted érkezett!';

    $stmt_module = $db->prepare("SELECT id FROM modules WHERE course_id = ? LIMIT 1");
    $stmt_module->bind_param("i", $courseId);
    $stmt_module->execute();
    $stmt_module->bind_result($moduleId);
    $stmt_module->fetch();
    $stmt_module->close();

    // Beállítjuk a redirect URL-t a modul oldalára
    $redirectUrl = "grading.html?module_id=" . $moduleId;

    foreach ($receivers as $receiver) {
        insertNotification($db, $sender_id, $receiver, $notificationMessage, $redirectUrl);
    }    


    if (!empty($courseId) && !empty($userId) && !empty($newMessage)) {
        // Ellenőrizzük, hogy van-e már bejegyzés az adott felhasználóhoz és kurzushoz
        $stmt_check = $db->prepare("SELECT id, message FROM chat WHERE student_id = ? AND course_id = ?");
        $stmt_check->bind_param("ii", $userId, $courseId);
        $stmt_check->execute();
        $stmt_check->store_result();

        if ($stmt_check->num_rows > 0) {
            $stmt_check->bind_result($id, $existingMessage);
            $stmt_check->fetch();
            $stmt_check->close();

            $newMessage = '§' . $newMessage; // Külön karakter: §
            $updatedMessage = $existingMessage . $newMessage;

            $stmt = $db->prepare("UPDATE chat SET message = ? WHERE id = ?");
            $stmt->bind_param("si", $updatedMessage, $id);
        } else {
            $stmt_check->close();
            $stmt = $db->prepare("INSERT INTO chat (student_id, course_id, message) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $userId, $courseId, $newMessage);
        }

        if ($stmt->execute()) {
            echo json_encode(array("success" => true));
        } else {
            echo json_encode(array("success" => false, "error" => "Hiba az üzenet feltöltésekor."));
        }

        $stmt->close();
    } else {
        // Ha hiányoznak az adatok, válaszoljunk hibaüzenettel
        echo json_encode(array("success" => false, "error" => "Hiányzó adatok."));
    }

} else if ($_SESSION['user_role'] == 1) {
    $teacher_name = $_SESSION['user_name'];
    $teacher_role = $_SESSION['user_role'];
    $student_id = $dataToSend['student_id']; /*receiver*/
    $courseId = $dataToSend['courseId'];
    $newMessage = '(' . $teacher_name . ' - ' . $teacher_role . ') ' . $dataToSend['message'];

    if (!empty($courseId) && !empty($student_id) && !empty($newMessage)) {
        $stmt_check = $db->prepare("SELECT id, message FROM chat WHERE student_id = ? AND course_id = ?");
        $stmt_check->bind_param("ii", $student_id, $courseId);
        $stmt_check->execute();
        $stmt_check->store_result();

        if ($stmt_check->num_rows > 0) {
            $stmt_check->bind_result($id, $existingMessage);
            $stmt_check->fetch();
            $stmt_check->close();

            $newMessage = '§' . $newMessage;
            $updatedMessage = $existingMessage . $newMessage;
            $notificationMessage = $teacher_name . '-től egy új üzeneted érkezett!';

            $stmt = $db->prepare("UPDATE chat SET message = ? WHERE id = ?");
            $stmt->bind_param("si", $updatedMessage, $id);
        } else {
            $stmt_check->close();
            $stmt = $db->prepare("INSERT INTO chat (student_id, course_id, message) VALUES (?, ?, ?)");
            $stmt->bind_param("iis", $student_id, $courseId, $newMessage);
        }

        // Lekérjük a kurzushoz tartozó első modul azonosítóját
        $stmt_module = $db->prepare("SELECT id FROM modules WHERE course_id = ? LIMIT 1");
        $stmt_module->bind_param("i", $courseId);
        $stmt_module->execute();
        $stmt_module->bind_result($moduleId);
        $stmt_module->fetch();
        $stmt_module->close();

        $redirectUrl = "course.html?course_id=" . $courseId;

        // Értesítést adunk hozzá a táblához
        insertNotification($db, $sender_id, $student_id, $notificationMessage, $redirectUrl);

        if ($stmt->execute()) {
            echo json_encode(array("success" => true));
        } else {
            echo json_encode(array("success" => false, "error" => "Hiba az üzenet feltöltésekor."));
        }

        $stmt->close();
    } else {
        echo json_encode(array("success" => false, "error" => "Hiányzó adatok."));
    }
}
?>
