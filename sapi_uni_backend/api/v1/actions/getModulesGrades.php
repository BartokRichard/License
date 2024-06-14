<?php
require_once dirname(__FILE__) . '/../db/db.php'; // Ellenőrizd, hogy ez valóban a helyes útvonal
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
checkUserSession();

$user_id = $_SESSION['user_id'];
$course_id = $_GET['course_id'];

// Első lekérdezés: modulok ID-jainak lekérése a kurzus ID alapján
$sql = "SELECT id FROM modules WHERE course_id = ?";
$stmt = $db->prepare($sql);
$stmt->bind_param("i", $course_id);
$stmt->execute();
$result = $stmt->get_result();

$module_ids = [];
while ($row = $result->fetch_assoc()) {
    $module_ids[] = $row['id'];
}

// Második lekérdezés: jegyek lekérése a modul ID-k alapján
if (!empty($module_ids)) {
    $module_ids_placeholder = implode(',', array_fill(0, count($module_ids), '?'));
    $sql = "
        SELECT module_id, grade 
        FROM students_works 
        WHERE student_id = ? AND module_id IN ($module_ids_placeholder)";
    
    $stmt = $db->prepare($sql);
    
    // Dinamikusan kötjük az összes modul ID-t az SQL lekérdezéshez
    $types = str_repeat('i', count($module_ids) + 1);
    $params = array_merge([$user_id], $module_ids);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $grades = [];
    while ($row = $result->fetch_assoc()) {
        $grades[$row['module_id']] = $row['grade'];
    }

    echo json_encode($grades);
} else {
    echo json_encode([]);
}
?>
