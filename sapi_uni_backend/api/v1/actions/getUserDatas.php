<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
session_start();

// Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
if (isset($_SESSION['user_id'])) {
    // Kivesszük a szükséges adatokat a session-ból
    $userId = $_SESSION['user_id'];
    $userName = $_SESSION['user_name'];
    $userEmail = $_SESSION['user_email'];
    $userRole = $_SESSION['user_role'];

    // Asszociatív tömb létrehozása az alapvető adatokkal
    $userData = array(
        'user_id' => $userId,
        'user_name' => $userName,
        'user_email' => $userEmail,
        'user_role' => $userRole
    );

    // Ha a felhasználó tanár (user_role == 1), akkor lekérdezzük a kurzusokat
    if ($userRole == 1) {
        $teacherCoursesQuery = "SELECT id FROM course WHERE teacher_id = ? OR JSON_CONTAINS(assisstant_teacher_ids, '\"$userId\"', '$')";
        $stmt = $db->prepare($teacherCoursesQuery);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
    
        // Ellenőrizzük, hogy volt-e eredmény
        if ($result) {
            $teacherCourseIds = array();
    
            while ($row = $result->fetch_assoc()) {
                $teacherCourseIds[] = $row['id'];
            }
    
            // Hozzáadjuk a kurzusokat a felhasználó adataihoz
            $userData['teacher_courses'] = $teacherCourseIds;
        }
    } elseif ($userRole == 0) {
        // Lekérdezzük az összes kurzust
        $studentCourseIds = array();
        $allCoursesQuery = "SELECT id, registred_student_id FROM course";
        $result = $db->query($allCoursesQuery);
    
        // Ellenőrizzük, hogy volt-e eredmény
        if ($result) {
            // Végigmegyünk az összes kurzuson
            while ($row = $result->fetch_assoc()) {
                // Ellenőrizzük, hogy a regisztrált hallgatók tömbje nem null
                if ($row['registred_student_id'] !== null) {
                    // Ellenőrizzük, hogy a felhasználó szerepel-e a kurzus regisztrált hallgatói között
                    $registredStudents = json_decode($row['registred_student_id'], true); // JSON tömb dekódolása
                    if (in_array($userId, $registredStudents)) {
                        // Ha igen, hozzáadjuk a kurzus id-ját a student_courses tömbhöz
                        $studentCourseIds[] = $row['id'];
                    }
                }
            }
        }

        // Lekérdezzük azoknak a moduloknak az azonosítóit, ahol a felhasználó szerepel a students_to_eval tömbben
        $pendingModules = array();
        $modulesQuery = "SELECT id FROM modules WHERE JSON_CONTAINS(students_to_eval, ?)";
        $stmt = $db->prepare($modulesQuery);
        $jsonParam = json_encode($userId);
        $stmt->bind_param("s", $jsonParam);
        $stmt->execute();
        $modulesResult = $stmt->get_result();
        
        // Ellenőrizzük, hogy volt-e eredmény
        if ($modulesResult) {
            // Végigmegyünk az eredményen és hozzáadjuk az azonosítókat a pendingModules tömbhöz
            while ($row = $modulesResult->fetch_assoc()) {
                $pendingModules[] = $row['id'];
            }
        }
        
        // Hozzáadjuk a kurzusokat és a függőben lévő modulokat a felhasználó adataihoz
        $userData['student_courses'] = $studentCourseIds;
        $userData['pendingModules'] = $pendingModules;
    }
    
    // Visszaadjuk az adatokat JSON formátumban
    echo json_encode($userData);
} else {
    // Ha nincs bejelentkezve, üres JSON választ küldünk
    echo json_encode(array());
}
?>
