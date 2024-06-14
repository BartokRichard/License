<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

// Ellenőrizzük a GET kérést és a kurzus azonosítót
if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['course_id']) || !is_numeric($_GET['course_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Érvénytelen kérés vagy hiányzó kurzus azonosító']);
    exit;
}

$courseId = $_GET['course_id'];

// Lekérdezzük a kurzushoz már hozzárendelt tanárok ID-jait
$assignedTeacherIdsQuery = $db->prepare("SELECT teacher_id, JSON_UNQUOTE(JSON_EXTRACT(assisstant_teacher_ids, '$')) AS assistant_teacher_ids FROM course WHERE id = ?");
$assignedTeacherIdsQuery->bind_param("i", $courseId);
$assignedTeacherIdsQuery->execute();
$assignedResult = $assignedTeacherIdsQuery->get_result()->fetch_assoc();

// Az eredmény alapján összeállítjuk a kizárandó ID-k listáját
$excludeIds = array($assignedResult['teacher_id']);
$assistantTeacherIds = json_decode($assignedResult['assistant_teacher_ids']);
if (is_array($assistantTeacherIds)) {
    $excludeIds = array_merge($excludeIds, $assistantTeacherIds);
}
$excludeIdsList = implode(',', array_fill(0, count($excludeIds), '?'));

// Lekérdezzük azokat a tanárokat, akik nem szerepelnek a kizárandó ID-k között
$teachersQuery = "SELECT id, name FROM users WHERE role = 1 AND id NOT IN ($excludeIdsList)";
$stmt = $db->prepare($teachersQuery);

// A dinamikusan létrehozott kizárandó ID lista bindolása a lekérdezéshez
foreach ($excludeIds as $i => $id) {
    $stmt->bind_param(str_repeat('i', count($excludeIds)), ...$excludeIds);
}

$stmt->execute();
$teachersResult = $stmt->get_result();
$teachers = [];

while ($teacher = $teachersResult->fetch_assoc()) {
    $teachers[] = ['id' => $teacher['id'], 'name' => $teacher['name']];
}

// Visszaküldjük a lekérdezett tanárok listáját JSON formátumban
header('Content-Type: application/json');
echo json_encode($teachers);
