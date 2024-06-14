<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

checkUserSession();

if ($_SESSION['user_role'] != 0) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied: You do not have permission to perform this action']);
    exit;
}

$userdata = getUserData();
$studentId = (int)$_SESSION['user_id'];
$module_id = $_POST['module_id'];

$stmtCourseId = $db->prepare("SELECT course_id FROM modules WHERE id = ?");
$stmtCourseId->bind_param("i", $module_id);
$stmtCourseId->execute();
$stmtCourseId->bind_result($courseId);
$stmtCourseId->fetch();
$stmtCourseId->close();

$stmt_course = $db->prepare("SELECT teacher_id, assisstant_teacher_ids FROM course WHERE id = ?");
$stmt_course->bind_param("i", $courseId);
$stmt_course->execute();
$stmt_course->bind_result($teacher_id, $assistant_teacher_ids_json);
$stmt_course->fetch();
$assistant_teacher_ids = json_decode($assistant_teacher_ids_json, true);
$stmt_course->close();

$receivers = array_merge([$teacher_id], $assistant_teacher_ids);
$sender_id = $_SESSION['user_id'];
$notificationMessage = $_SESSION['user_name'] . ' egy új modult adott le osztályozásra!';
$redirectUrl = "grading.html?module_id=" . $module_id;

function insertNotification($db, $sender, $receiver, $message, $redirect) {
    $stmt_notif = $db->prepare("INSERT INTO notifications (sender, receiver, type, redirect, message) 
    VALUES (?, ?, 1, ?, ?)");
    $stmt_notif->bind_param("iiss", $sender, $receiver, $redirect, $message);
    $stmt_notif->execute();
    $stmt_notif->close();
}

foreach ($receivers as $receiver) {
    insertNotification($db, $sender_id, $receiver, $notificationMessage, $redirectUrl);
}

$db->begin_transaction();

try {
    $sql = "SELECT students_to_eval FROM modules WHERE id = ?";
    if ($stmt = $db->prepare($sql)) {
        $stmt->bind_param("i", $module_id);
        $stmt->execute();
        $stmt->bind_result($students_to_eval_json);
        $stmt->fetch();
        $stmt->close();

        $students_to_eval = json_decode($students_to_eval_json, true);
        if (!is_array($students_to_eval)) {
            $students_to_eval = [];
        }

        if (!in_array($studentId, $students_to_eval)) {
            $students_to_eval[] = $studentId;
            $students_to_eval_json = json_encode(array_map('intval', $students_to_eval)); 
            
            $update_sql = "UPDATE modules SET students_to_eval = ? WHERE id = ?";
            if ($update_stmt = $db->prepare($update_sql)) {
                $update_stmt->bind_param("si", $students_to_eval_json, $module_id);
                $update_stmt->execute();
                $update_stmt->close();

                $db->commit();
                echo json_encode([
                    'success' => true, 
                    'message' => 'A modul sikeresen leadva az osztályozásra.'
                ]);
            } else {
                $db->rollback();
                echo json_encode([
                    'success' => false, 
                    'message' => 'Hiba történt a leadás közben.'
                ]); 
            }
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'A modul már leadva van.'
            ]);
        }
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Hiba történt a leadás közben.'
        ]);
    }
} catch (Exception $e) {
    $db->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Valami hiba történt: ' . $e->getMessage()]);
}
?>
