<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
$response = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userData = getUserData();

    $moduleId = $_POST['moduleId'];
    $courseId = $_POST['courseId'];
    $teacherCourses = getTeacherCourses($db, $userData['user_id']);
    $editedModuleName = $_POST['moduleName'] ?? '';
    $editedModuleDescription = $_POST['moduleDescription'] ?? '';
    $editedModuleDeadline = $_POST['moduleDeadline'] ?? '';
    if ($_SESSION['user_role'] === 1 && in_array($courseId, $teacherCourses) || $userData['user_role'] === 2) {
        $success = true;
        $messages = [];

        if (!empty($editedModuleName)) {
            $sql = "UPDATE modules SET name = ? WHERE id = ?";
            $stmt = mysqli_prepare($db, $sql);
            mysqli_stmt_bind_param($stmt, "si", $editedModuleName, $moduleId);
            $success &= mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        if (!empty($editedModuleDescription)) {
            $sql = "UPDATE modules SET description = ? WHERE id = ?";
            $stmt = mysqli_prepare($db, $sql);
            mysqli_stmt_bind_param($stmt, "si", $editedModuleDescription, $moduleId);
            $success &= mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        if (!empty($editedModuleDeadline)) {
            $sql = "UPDATE modules SET deadline = ? WHERE id = ?";
            $stmt = mysqli_prepare($db, $sql);
            mysqli_stmt_bind_param($stmt, "si", $editedModuleDeadline, $moduleId);
            $success &= mysqli_stmt_execute($stmt);
            mysqli_stmt_close($stmt);
        }

        if ($success) {
            $response = ["success" => true, "message" => "A modul sikeresen frissítve."];
        } else {
            $response['success'] = false;
            $response['message'] = "Nem sikerült elvégezni a frissítést.";
        }
    } else {
        $response = ["success" => false, "message" => "Nem engedélyezett hozzáférés vagy érvénytelen kurzus azonosító.", "redirect" => "login.html"];
        
    }
} else {
    $response = ["success" => false, "message" => "Érvénytelen kérési módszer."];
}

header('Content-Type: application/json');
echo json_encode($response);
?>
