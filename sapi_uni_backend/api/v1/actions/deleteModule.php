<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userData = getUserData();
    $moduleId = $_POST['moduleId'];
    $courseId = $_POST['courseId'];
    $teacherCourses = getTeacherCourses($db, $userData['user_id']);

    if ($userData['user_role'] == 1 && in_array($courseId, $teacherCourses) || $userData['user_role'] === 2) {

        // Retrieve UUIDs of files associated with the module
        $filesQuery = "SELECT uuid FROM task_files WHERE task_id IN (SELECT id FROM module_tasks WHERE module_id = $moduleId)";
        $filesResult = $db->query($filesQuery);
        
        if ($filesResult !== false) {
            // Extract UUIDs from the result
            $uuids = [];
            while ($row = $filesResult->fetch_assoc()) {
                $uuids[] = $row['uuid'];
            }

            // Delete files from the filesystem
            $uploadDir = 'data/';
            foreach ($uuids as $uuid) {
                $filePath = $uploadDir . $uuid;
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            // Delete records from the task_files table
            $deleteFilesQuery = "DELETE FROM task_files WHERE task_id IN (SELECT id FROM module_tasks WHERE module_id = $moduleId)";
            $deleteFilesResult = $db->query($deleteFilesQuery);

            if ($deleteFilesResult !== false) {
                // Delete module_tasks associated with the module
                $deleteTasksQuery = "DELETE FROM module_tasks WHERE module_id = $moduleId";
                $deleteTasksResult = $db->query($deleteTasksQuery);

                if ($deleteTasksResult !== false) {
                    // Delete the module itself
                    $deleteModuleQuery = "DELETE FROM modules WHERE id = $moduleId";
                    $deleteModuleResult = $db->query($deleteModuleQuery);

                    if ($deleteModuleResult !== false) {
                        echo json_encode(array('success' => true, 'message' => 'Modul sikeresen törölve.'));
                    } else {
                        echo json_encode(array('success' => false, 'message' => 'Hiba történt a modul törlésekor.'));
                    }
                } else {
                    echo json_encode(array('success' => false, 'message' => 'Hiba történt a modul feladatok törlésekor.'));
                }
            } else {
                echo json_encode(array('success' => false, 'message' => 'Hiba történt a fájlok törlésekor.'));
            }
        } else {
            echo json_encode(array('success' => false, 'message' => 'Hiba történt a fájlok lekérésekor.'));
        }
    } else {
        echo json_encode(array('success' => false, 'message' => 'Hiba történt a modul törlésekor.', 'redirect' => 'login.html'));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'Hiba történt a modul törlésekor.'));
}
?>
