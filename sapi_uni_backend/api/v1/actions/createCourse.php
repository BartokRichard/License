<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Ellenőrizze, hogy a szükséges adatok rendelkezésre állnak-e
checkUserSession();

// Ellenőrizze a felhasználói jogosultságot (user_role == 1)
if ($_SESSION["user_role"] != 1 && $_SESSION["user_role"] != 2) {
    echo json_encode(['success' => false, 'message' => 'Nem megfelelő jogosultság', "redirect" => "login.html"]);
    exit();
}

// Felhasználói adatok
$teacherId = $_SESSION['user_id'];
$courseName = $_POST['courseName'];
$courseDeadline = $_POST['courseDeadline'];
$courseDescription = $_POST['courseDescription'];
$emptyArray = json_encode(array()); // Üres tömb létrehozása JSON formátumban

// SQL lekérdezés a kurzus létrehozásához
$sql = "INSERT INTO course (teacher_id, name, assisstant_teacher_ids, description, deadline, active, registred_student_id)
        VALUES (?, ?, NULL, ?, ?, 1, ?)";

// Prepared statement létrehozása
$stmt = $db->prepare($sql);

// Sikeres készítés ellenőrzése
if ($stmt) {
    // Paraméterek bindelése és végrehajtása
    $stmt->bind_param("issss", $teacherId, $courseName, $courseDescription, $courseDeadline, $emptyArray);
    $stmt->execute();

    // Sikeres végrehajtás ellenőrzése
    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Course creation failed']);
    }

    // Statement lezárása
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Database error']);
}

?>