<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Felhasználói adatok ellenőrzése
checkUserSession();

if(isset($_POST['teacherCourses'])) {
    $userId = $_SESSION['user_id'];
    $teacherCourses = explode(',', $_POST["teacherCourses"]); // A második argumentum true, hogy tömbként értelmezze

    // Ellenőrizzük, hogy a userId 1
    if($userId = 0) {
        // Ha a userId nem 1, akkor hibát adunk vissza
        echo json_encode(array("success" => false, "message" => "Nincs jogosultság a feladat törléséhez.", "redirect" => "login.html"));
        exit;
    }

    // Ellenőrizzük, hogy a teacherCourses egy tömb
    $teacherCourses = explode(',', $_POST["teacherCourses"]); 
    if(!is_array($teacherCourses)) {
        // Ha a teacherCourses nem tömb, akkor hibát adunk vissza
        echo json_encode(array("success" => false,"message" => "Hibas formatumu tanar kurzusai.", "redirect" => "login.html"));
        exit;
    }

    // Ellenőrizzük, hogy a teacherCourses tartalmazza-e a courseId-t
    $courseId = $_POST['courseId'];
    if(!in_array($courseId, $teacherCourses) && $_SESSION['user_role'] != 2) {
        // Ha a teacherCourses nem tartalmazza a courseId-t, akkor hibát adunk vissza
        echo json_encode(array("success" => false, "message" => "A kurzus nem a bejelentkezett tanár hatáskörébe tartozik", "redirect" => "login.html"));
        exit;
    }
    $taskId = $_POST['taskId']; 
    
    $query = "SELECT COUNT(*) as file_count FROM students_task_files WHERE task_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bind_param("i", $taskId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
   

    if ($row['file_count'] > 0) {
        // there are files associated with this task
        echo json_encode(array("success" => false, "message" => "A feladathoz egy hallgató már tölött fel állományt! A feladat nem törölhető!"));
    } else {
    
        // UUID-k lekérése a task_id alapján
        $getUuidQuery = "SELECT uuid FROM task_files WHERE task_id = ?";
        $getUuidStmt = $db->prepare($getUuidQuery);
        $getUuidStmt->bind_param('i', $taskId);
        $getUuidStmt->execute();
        $result = $getUuidStmt->get_result();

        $uuids = array();
        while($row = $result->fetch_assoc()) {
            $uuids[] = $row['uuid'];
        }

        // Fájlok törlése a data mappából
        foreach($uuids as $uuid) {
            $filePath = dirname(__FILE__) . "/../data/{$uuid}"; // Fájl elérési útvonala
            if(file_exists($filePath)) {
                unlink($filePath); // Fájl törlése
            }
        }

        // Törlés a task_files táblából
        $deleteTaskFilesQuery = "DELETE FROM task_files WHERE task_id = ?";
        $deleteTaskFilesStmt = $db->prepare($deleteTaskFilesQuery);
        $deleteTaskFilesStmt->bind_param('i', $taskId);
        $deleteTaskFilesStmt->execute();

        // Törlés a module_tasks táblából
        $deleteTaskQuery = "DELETE FROM module_tasks WHERE id = ?";
        $deleteTaskStmt = $db->prepare($deleteTaskQuery);
        $deleteTaskStmt->bind_param('i', $taskId);
        $deleteTaskStmt->execute();

        echo json_encode(array("success" => true, "message" => "Feladat sikeresen törölve."));
        exit;
    }
} else {
    // Ha valamelyik adat hiányzik a POST kérésből, akkor hibát adunk vissza
    echo json_encode(array("success" => true, "message" => "Hiányzó tanár kurzusok.", "redirect" => "login.html"));
    exit;
}
?>
