<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

checkUserSession();
if ($_SESSION['user_role'] != 1 && $_SESSION['user_role'] != 2) {
    http_response_code(403);
    echo json_encode(['error' => 'Access denied: You do not have permission to perform this action']);
    exit;
}

$course_id = ($_POST['courseId']) ;
$module_id = ($_POST['moduleId']) ;
$student_id = ($_POST['studentId']) ;
$teacher_id = $_SESSION['user_id'];
$grade = isset($_POST['grade']) ? floatval($_POST['grade']) : null;
$passed = isset($_POST['passed']) ? ($_POST['passed'] == 'true' ? 1 : 0) : 0;

if ($db->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $db->connect_error]);
    exit;
}

try {
    $next_module_id = null;

    // Check if student is in the eval list
    $evalCheckQuery = "SELECT students_to_eval FROM modules WHERE id = ?";
    $evalCheckStmt = $db->prepare($evalCheckQuery);
    $evalCheckStmt->bind_param("i", $module_id);
    $evalCheckStmt->execute();
    $result = $evalCheckStmt->get_result();
    $data = $result->fetch_assoc();
    $students_to_eval = json_decode($data['students_to_eval'], true);

    $in_eval = in_array($student_id, $students_to_eval);

    // Insert grade
    $stmt = $db->prepare("INSERT INTO students_works (module_id, student_id, teacher_id, grade, grading_date, passed) VALUES (?, ?, ?, ?, NOW(), ?)");
    $stmt->bind_param("iiidi", $module_id, $student_id, $teacher_id, $grade, $passed);
    $stmt->execute();

    if ($in_eval) {
        // Remove the student from the eval list
        if (($key = array_search($student_id, $students_to_eval)) !== false) {
            unset($students_to_eval[$key]);
        }
        $new_eval_json = json_encode(array_values($students_to_eval)); // Re-encode to JSON after removal
        $updateEvalStmt = $db->prepare("UPDATE modules SET students_to_eval = ? WHERE id = ?");
        $updateEvalStmt->bind_param("si", $new_eval_json, $module_id);
        $updateEvalStmt->execute();

        if ($passed) {
            // Query to find the next module ID directly from the database
            $nextModuleQuery = "SELECT id FROM modules WHERE course_id = ? AND id > ? ORDER BY id LIMIT 1";
            $nextModuleStmt = $db->prepare($nextModuleQuery);
            $nextModuleStmt->bind_param("ii", $course_id, $module_id);
            $nextModuleStmt->execute();
            $nextModuleResult = $nextModuleStmt->get_result();
            if ($row = $nextModuleResult->fetch_assoc()) {
                $next_module_id = $row['id'];
            }

            // Update student progress to the next module
            if ($next_module_id) {
                $updateProgressStmt = $db->prepare("UPDATE students_progress SET module_id = ? WHERE student_id = ? AND course_id = ?");
                $updateProgressStmt->bind_param("iii", $next_module_id, $student_id, $course_id);
                $updateProgressStmt->execute();
            }
        }
    }

    $courseName = '';
    $moduleName = '';
    $courseQuery = "SELECT name FROM course WHERE id = ?";
    $moduleQuery = "SELECT name FROM modules WHERE id = ?";

    if ($courseStmt = $db->prepare($courseQuery)) {
        $courseStmt->bind_param("i", $course_id);
        $courseStmt->execute();
        $courseStmt->bind_result($courseName);
        $courseStmt->fetch();
        $courseStmt->close();
    } else {
        die('Kurzus lekérdezése sikertelen: ' . $db->error);
    }

    if ($moduleStmt = $db->prepare($moduleQuery)) {
        $moduleStmt->bind_param("i", $module_id);
        $moduleStmt->execute();
        $moduleStmt->bind_result($moduleName);
        $moduleStmt->fetch();
        $moduleStmt->close();
    } else {
        die('Modul lekérdezése sikertelen: ' . $db->error);
    }

    // $userName = $_SESSION['user_name'];
    // $tpl = file_get_contents(WEBDIR . '/tpl/course_registration.tpl');
    // $tpl = str_replace('[name]', $userName, $tpl);
    // $tpl = str_replace('[course_name]', $courseName, $tpl);
    // $tpl = str_replace('[module_name]', $moduleName, $tpl);
    // $tpl = str_replace('[grade]', $grade, $tpl);

    // $to = $_SESSION['user_email'];
    // $toname = $_SESSION['user_name'];
    // $subject = 'Modul osztályzás';
    // SendEmail($to, $toname, $subject, $tpl);

    echo json_encode(['success' => true, 'message' => 'Sikeres osztályozás!']);
    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Valami hiba történt: ' . $e->getMessage()]);
}
?>
