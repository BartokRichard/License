<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();

checkUserSession();

$loggedInUserId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['course_id']) || !is_numeric($_GET['course_id'])) {
    StopWith404Custom(["error" => "Érvénytelen kérés vagy hiányzó kurzus azonosító."]);
}

$course_id = $_GET['course_id'];

$sql = "SELECT c.id, c.name AS course_name, c.description AS course_description, u.name AS teacher_name
        FROM course c
        JOIN users u ON c.teacher_id = u.id
        WHERE c.id = ?";

if ($stmt = $db->prepare($sql)) {
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $result = $stmt->get_result(); 

    if ($result === false || $result->num_rows === 0) {
        StopWith404Custom(["error" => "A kurzus nem található."]);
    }

    $row = $result->fetch_assoc();

    $response = [
        'status' => true,
        'id' => $row['id'],
        'name' => $row['course_name'],
        'desc' => $row['course_description'],
        'teacher_name' => $row['teacher_name'],
        'modules' => []
    ];

    $sqlModules = "SELECT * FROM modules WHERE course_id = ?";
    if ($stmtModules = $db->prepare($sqlModules)) {
        $stmtModules->bind_param("i", $course_id);
        $stmtModules->execute();
        $rs_modules = $stmtModules->get_result();

        while ($row_modules = $rs_modules->fetch_assoc()) {
            $module = [
                'm_id' => $row_modules['id'],
                'name' => $row_modules['name'],
                'desc' => $row_modules['description'],
                'deadline' => $row_modules['deadline'],
                'tasks' => []
            ];

            $sqlTasks = "SELECT mt.*, mt.id AS task_id FROM module_tasks mt WHERE mt.module_id = ?";
            if ($stmtTasks = $db->prepare($sqlTasks)) {
                $stmtTasks->bind_param("i", $row_modules['id']);
                $stmtTasks->execute();
                $rs_tasks = $stmtTasks->get_result();

                while ($row_task = $rs_tasks->fetch_assoc()) {
                    $task = [
                        't_id' => $row_task['task_id'],
                        'task_name' => $row_task['task_name'],
                        'module_id' => $row_task['module_id'],
                        'desc' => $row_task['task_description'],
                        'deadline' => $row_task['deadline'],
                        'files' => [],
                        'student_files' => [] // Új tömb a diákok által feltöltött fájlok számára
                    ];

                    $sqlFiles = "SELECT * FROM task_files WHERE task_id = ?";
                    if ($stmtFiles = $db->prepare($sqlFiles)) {
                        $stmtFiles->bind_param("i", $row_task['task_id']);
                        $stmtFiles->execute();
                        $rs_file = $stmtFiles->get_result();

                        while ($row_file = $rs_file->fetch_assoc()) {
                            $file = [
                                'f_id' => $row_file['id'],
                                'task_id' => $row_task['task_id'],
                                'filename' => $row_file['filename'],
                                'uuid' => $row_file['uuid']
                            ];

                            $task['files'][] = $file;
                        }
                        $stmtFiles->close();
                    }

                    if ($loggedInUserId !== null) {
                        $sqlStudentFiles = "SELECT * FROM students_task_files WHERE task_id = ? AND student_id = ?";
                        if ($stmtStudentFiles = $db->prepare($sqlStudentFiles)) {
                            $stmtStudentFiles->bind_param("ii", $row_task['task_id'], $loggedInUserId);
                            $stmtStudentFiles->execute();
                            $rs_studentFiles = $stmtStudentFiles->get_result();

                            while ($row_studentFile = $rs_studentFiles->fetch_assoc()) {
                                $studentFile = [
                                    'uuid' => $row_studentFile['uuid'],
                                    'task_id' => $row_studentFile['task_id'],
                                    'file_name' => $row_studentFile['file_name'],
                                    'upload_date' => $row_studentFile['upload_date']
                                ];

                                $task['student_files'][] = $studentFile;
                            }
                            $stmtStudentFiles->close();
                        }
                    }

                    $module['tasks'][] = $task;
                }
                $stmtTasks->close();
            }

            $response['modules'][] = $module;
        }
        $stmtModules->close();
    }

    echo json_encode($response);
}
?>