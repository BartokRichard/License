<?php

require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

checkUserSession();

if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['module_id']) || !is_numeric($_GET['module_id'])) {
    http_response_code(404);
    echo json_encode(array("error" => "Invalid request or module id missing"));
    exit;
}

$module_id = $_GET['module_id'];

$sql = "SELECT 
            course.id,
            course.name AS course_name,
            users.name AS teacher_name,
            course.registred_student_id
        FROM 
            modules
        INNER JOIN course ON modules.course_id = course.id
        INNER JOIN users ON course.teacher_id = users.id
        WHERE 
            modules.id = ?";

$stmt = $db->prepare($sql);
$stmt->bind_param("i", $module_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result === false || $result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(array("error" => "Module not found"));
    exit;
}

$row = $result->fetch_assoc();
$course_id = $row['id'];
$course_name = $row['course_name'];
$teacher_name = $row['teacher_name'];
$registered_student_ids = json_decode($row['registred_student_id'], true);

$registeredStudents = array();
if (!empty($registered_student_ids)) {
    foreach ($registered_student_ids as $student_id) {
        $sql_student = "SELECT id, name FROM users WHERE id = ?";
        $stmt_student = $db->prepare($sql_student);
        $stmt_student->bind_param("i", $student_id);
        $stmt_student->execute();
        $result_student = $stmt_student->get_result();
    
        if ($result_student && $result_student->num_rows > 0) {
            $row_student = $result_student->fetch_assoc();
            $studentData = array(
                "user_id" => $row_student['id'],
                "user_name" => $row_student['name'],
                "student_uploads" => array(),
                "passed_modules" => array()  // Initialize passed_modules array
            );
    
            // Query to fetch uploads by the student
            $sql_uploads = "SELECT stf.task_id, stf.file_name, mt.task_name 
                            FROM students_task_files stf 
                            JOIN module_tasks mt ON mt.id = stf.task_id 
                            WHERE stf.student_id = ?";
            $stmt_uploads = $db->prepare($sql_uploads);
            $stmt_uploads->bind_param("i", $student_id);
            $stmt_uploads->execute();
            $result_uploads = $stmt_uploads->get_result();
    
            while ($row_uploads = $result_uploads->fetch_assoc()) {
                $studentData['student_uploads'][] = array(
                    'task_id' => $row_uploads['task_id'],
                    'task_name' => $row_uploads['task_name'],
                    'file_name' => $row_uploads['file_name']
                );
            }
    
            // Query to fetch passed modules and grades
            $sql_passed_modules = "SELECT sw.module_id, sw.grade, sw.passed, m.name AS module_name
                                   FROM students_works sw
                                   JOIN modules m ON m.id = sw.module_id
                                   WHERE sw.student_id = ?";
            $stmt_passed_modules = $db->prepare($sql_passed_modules);
            $stmt_passed_modules->bind_param("i", $student_id);
            $stmt_passed_modules->execute();
            $result_passed_modules = $stmt_passed_modules->get_result();
    
            while ($row_passed = $result_passed_modules->fetch_assoc()) {
                $studentData['passed_modules'][] = array(
                    'module_id' => $row_passed['module_id'],
                    'module_name' => $row_passed['module_name'],
                    'grade' => $row_passed['grade'],
                    'passed' => $row_passed['passed']
                );
            }
    
            $registeredStudents[] = $studentData;
        }
    }
    
}


$sql_modules = "SELECT 
                    modules.id,
                    modules.name,
                    modules.description,
                    modules.deadline
                FROM 
                    modules
                WHERE 
                    modules.course_id = ?";

$stmt_modules = $db->prepare($sql_modules);
$stmt_modules->bind_param("i", $course_id);
$stmt_modules->execute();
$result_modules = $stmt_modules->get_result();

if ($result_modules === false) {
    http_response_code(404);
    echo json_encode(array("error" => "Error fetching modules"));
    exit;
}

$modules = array();
while ($row_module = $result_modules->fetch_assoc()) {
    $module_id = $row_module['id'];
    $module_name = $row_module['name'];
    $module_description = $row_module['description'];
    $module_deadline = $row_module['deadline'];
    $tasks = array();

    // Fetch the students_to_eval data
    $sql_students_to_eval = "SELECT students_to_eval FROM modules WHERE id = ?";
    $stmt_students_to_eval = $db->prepare($sql_students_to_eval);
    $stmt_students_to_eval->bind_param("i", $module_id);
    $stmt_students_to_eval->execute();
    $result_students_to_eval = $stmt_students_to_eval->get_result();
    $row_students_to_eval = $result_students_to_eval->fetch_assoc();
    $students_to_evaluate = json_decode($row_students_to_eval['students_to_eval'], true);
    $stmt_students_to_eval->close();

    $sql_tasks = "SELECT 
                    module_tasks.id,
                    module_tasks.task_name,
                    module_tasks.task_description,
                    module_tasks.deadline
                FROM 
                    module_tasks
                WHERE 
                    module_tasks.module_id = ?";

    $stmt_tasks = $db->prepare($sql_tasks);
    $stmt_tasks->bind_param("i", $module_id);
    $stmt_tasks->execute();
    $result_tasks = $stmt_tasks->get_result();

    if ($result_tasks === false) {
        http_response_code(404);
        echo json_encode(array("error" => "Error fetching tasks for module"));
        exit;
    }

    while ($row_task = $result_tasks->fetch_assoc()) {
        $task_id = $row_task['id'];
        $task_name = $row_task['task_name'];
        $task_description = $row_task['task_description'];
        $task_deadline = $row_task['deadline'];
        $files = array();

        $sql_files = "SELECT 
                        task_files.id,
                        task_files.filename,
                        task_files.uuid
                    FROM 
                        task_files
                    WHERE 
                        task_files.task_id = ?";

        $stmt_files = $db->prepare($sql_files);
        $stmt_files->bind_param("i", $task_id);
        $stmt_files->execute();
        $result_files = $stmt_files->get_result();

        if ($result_files === false) {
            http_response_code(404);
            echo json_encode(array("error" => "Error fetching files for task"));
            exit;
        }

        while ($row_file = $result_files->fetch_assoc()) {
            $files[] = array(
                "file_id" => $row_file['id'],
                "filename" => $row_file['filename'],
                "uuid" => $row_file['uuid']
            );
        }

        $tasks[] = array(
            "task_id" => $task_id,
            "task_name" => $task_name,
            "task_description" => $task_description,
            "task_deadline" => $task_deadline,
            "files" => $files
        );
    }

    $modules[] = array(
        "module_id" => $module_id,
        "module_name" => $module_name,
        "module_description" => $module_description,
        "module_deadline" => $module_deadline,
        "tasks" => $tasks,
        "students_to_evaluate" => $students_to_evaluate // Add the students_to_evaluate data
    );
}

$response = array(
    "course_id" => $course_id,
    "course_name" => $course_name,
    "teacher_name" => $teacher_name,
    "registeredStudents" => $registeredStudents,
    "modules" => $modules
);

echo json_encode($response);

?>
