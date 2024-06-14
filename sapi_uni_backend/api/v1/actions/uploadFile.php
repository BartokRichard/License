<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

if (isset($_POST["taskId"])) {
    $taskId = $_POST["taskId"];
    $userData = getUserData();

    if ($userData['user_role'] == 1 || $userData['user_role'] == 2) {
        handleTeacherUpload($db, $taskId, $userData['user_id']);
    } elseif ($userData['user_role'] == 0) {
        handleStudentUpload($db, $taskId, $userData['user_id']);
    } else {
        echo json_encode(array(
            "success" => false, 
            "message" => "Hiba történt a fájlfeltöltés során"
        ));
    }
} else {
    echo json_encode(array(
        "success" => false, 
        "message" => "Hiba történt a fájlfeltöltés során"
    ));
}

function handleTeacherUpload($db, $taskId, $userId) {
    $uuid = uniqid();
    $filename = basename($_FILES["file"]["name"]);
    $insertQuery = "INSERT INTO task_files (task_id, user_id, filename, uuid) 
    VALUES (?, ?, ?, ?)";

    if ($insertStatement = $db->prepare($insertQuery)) {
        $insertStatement->bind_param('iiss', $taskId, $userId, $filename, $uuid);
        if ($insertStatement->execute()) {
            $uploadDir = 'data/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $targetFile = $uploadDir . $uuid;
            if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
                echo json_encode(array(
                    "success" => true, 
                    "message" => "A fájl sikeresen feltöltve."
                ));
            } else {
                echo json_encode(array(
                    "success" => false, 
                    "message" => "Hiba történt a fájlfeltöltés során"
                ));
            }
        } else {
            internalServerError("Hiba történt az adatbázisba történő mentés során");
        }
        $insertStatement->close();
    } else {
        internalServerError("Adatbázis hiba");
    }
}

function handleStudentUpload($db, $taskId, $userId) {
    // A POST kérésből kapott adatok kiolvasása
    $moduleId = isset($_POST['moduleId']) ? intval($_POST['moduleId']) : 0;
    $courseId = isset($_POST['courseId']) ? intval($_POST['courseId']) : 0;
    $progressModuleId = 0;

    // Lekérdezzük a diák adott kurzushoz tartozó progressét
    $progressQuery = "SELECT module_id FROM students_progress WHERE student_id = ? AND course_id = ?";
    if ($progressStmt = $db->prepare($progressQuery)) {
        $progressStmt->bind_param("ii", $userId, $courseId);
        $progressStmt->execute();
        $progressStmt->bind_result($progressModuleId);
        if (!$progressStmt->fetch()) {
            echo json_encode(array(
                "success" => false, 
                "message" => "Hiba történt a fájlfeltöltés során"
            ));
        }
        $progressStmt->close();
        // Ellenőrizzük, hogy a POST-ból kapott moduleId nagyobb-e, mint a lekérdezett module_id
        if ($moduleId <= $progressModuleId) {
            uploadFile($db, $userId, $taskId, $moduleId);
        } else {
            echo json_encode(array(
                "success" => false, 
                "message" => "Nem lehet feltölteni a fájlt, mert a hallgató még nem érte el az modult."
            ));
        }
    } else {
        internalServerError("Adatbázis lekérdezési hiba.");
    }
}
function uploadFile($db, $userId, $taskId, $module_id) {
    $uuid = uniqid('', true);
    $uploadDir = 's_data/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $targetFile = $uploadDir . $uuid;
    if (move_uploaded_file($_FILES["file"]["tmp_name"], $targetFile)) {
        if ($insertStatement = $db->prepare(
                "INSERT INTO students_task_files (uuid, student_id, task_id, file_name, upload_date)
                VALUES (?, ?, ?, ?, NOW())"
            )) {
            $insertStatement->bind_param("siis", $uuid, $userId, $taskId, $_FILES['file']['name']);
            if ($insertStatement->execute()) {
                echo json_encode(array(
                    "success" => true, 
                    "message" => "Fájl feltöltés sikeresen mentve."
                ));
            } else {
                echo json_encode(array(
                    "success" => false, 
                    "message" => "Hiba történt a fájlfeltöltés során"
                ));
            }
            $insertStatement->close();
        } else {
            echo json_encode(array(
                "success" => false, 
                "message" => "Hiba történt a fájlfeltöltés során"
            ));
        }
    } else {
        echo json_encode(array(
            "success" => false, 
            "message" => "Hiba történt a fájlfeltöltés során"
        ));
    }
}

function deleteFailedUpload($db, $uuid, $tableName) {
    $deleteQuery = "DELETE FROM $tableName WHERE uuid = ?";
    if ($deleteStatement = $db->prepare($deleteQuery)) {
        $deleteStatement->bind_param('s', $uuid);
        $deleteStatement->execute();
        $deleteStatement->close();
    }
    internalServerError("Hiba történt a fájl áthelyezése során");
}

function forbidden() {
    http_response_code(403);
    echo json_encode(array("success" => false, "message" => "Nincs jogosultságod ehhez a művelethez"));
}

function notFound($message) {
    http_response_code(404);
    echo json_encode(array("success" => false, "message" => $message));
}

function internalServerError($message) {
    http_response_code(500);
    echo json_encode(array("success" => false, "message" => $message));
}

function badRequest($message) {
    http_response_code(400);
    echo json_encode(array("success" => false, "message" => $message));
}
?>
