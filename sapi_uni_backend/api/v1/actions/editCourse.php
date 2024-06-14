<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();

// Ellenőrizzük a kérés típusát
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Érvénytelen kérés.']);
    exit;
}

// Paraméterek beolvasása
$courseId = $_POST['courseId'] ?? null;
$editedTitle = $_POST['editedTitle'] ?? null;
$editedDescription = $_POST['editedDescription'] ?? null;
$editedAssignedTeacher = $_POST['editedAssignedTeacher'] ?? null;
$editedDeadline = $_POST['editedDeadline'] ?? null;

$userData = getUserData();

$teacherCourses = getTeacherCourses($db, $userData['user_id']);

// Ellenőrizzük, hogy a felhasználó jogosult-e a kurzus szerkesztésére
if (($userData['user_role'] == 1 && !in_array($courseId, $teacherCourses)) || $userData['user_role'] != 1 && $userData['user_role'] != 2) {
    echo json_encode(['success' => false, 'message' => 'Jogosulatlan hozzáférés.']);
    exit;
}

$isUpdated = false;

// Kurzus címének frissítése, ha van változás
if (!empty($editedTitle)) {
    $sql = "UPDATE course SET name = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("si", $editedTitle, $courseId);
    $isUpdated = $stmt->execute() || $isUpdated;
}

// Kurzus leírásának frissítése, ha van változás
if (!empty($editedDescription)) {
    $sql = "UPDATE course SET description = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("si", $editedDescription, $courseId);
    $isUpdated = $stmt->execute() || $isUpdated;
}

// Kurzus határidejének frissítése, ha van változás
if (!empty($editedDeadline)) {
    $sql = "UPDATE course SET deadline = ? WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("si", $editedDeadline, $courseId);
    $isUpdated = $stmt->execute() || $isUpdated;
}

// Asszisztens tanár hozzáadása, ha van változás és az érték nem "Tanár kiválasztva"
if ($editedAssignedTeacher !== 'Tanár kiválasztva') {
    $sql = "SELECT assisstant_teacher_ids FROM course WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("i", $courseId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    $assistantTeachers = json_decode($result['assisstant_teacher_ids'], true) ?: [];

    if (!in_array($editedAssignedTeacher, $assistantTeachers)) {
        $assistantTeachers[] = $editedAssignedTeacher;
        $newAssistantTeachers = json_encode($assistantTeachers);
        $sql = "UPDATE course SET assisstant_teacher_ids = ? WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->bind_param("si", $newAssistantTeachers, $courseId);
        $isUpdated = $stmt->execute() || $isUpdated;
    }
}

if ($isUpdated) {
    echo json_encode(['success' => true, 'message' => 'A kurzus sikeresen frissítve.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Nem történt módosítás.']);
}
?>
