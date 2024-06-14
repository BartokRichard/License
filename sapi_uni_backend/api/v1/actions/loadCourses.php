<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
session_start();

// Vegyük ki a user_role értékét a session-ből
$userRole = isset($_SESSION['user_role']) ? $_SESSION['user_role'] : null;

// SQL lekérdezés a kurzusok adatainak lekérdezéséhez
$sql = "SELECT course.id AS course_id, course.name AS course_name, course.description AS course_description, users.name AS teacher_name
        FROM course
        JOIN users ON course.teacher_id = users.id";

// Végrehajtjuk a lekérdezést
$result = $db->query($sql);

if ($result !== false) {
    $courses = array();

    while ($row = $result->fetch_assoc()) {
        // Hozzáadjuk a user_role-t minden kurzushoz
        $row['user_role'] = $userRole;

        // Minden kurzust hozzáadunk az eredmény tömbhöz
        $courses[] = $row;
    }

    // A kurzusokat JSON formátumban visszaadjuk
    echo json_encode($courses);
}
?>
