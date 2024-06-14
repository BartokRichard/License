<?php
// Database connection setup
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Check user session
checkUserSession();
$user_id = $_SESSION['user_id'];
$courseIds = getStudentCourses($db, $user_id);

// Prepare the query with JOINs to include modules and tasks
$query = "
    SELECT 
        c.id AS course_id, 
        c.name AS course_name, 
        c.deadline AS course_deadline, 
        m.name AS module_name, 
        m.deadline AS module_deadline, 
        t.task_name, 
        t.deadline AS task_deadline
    FROM course c
    LEFT JOIN modules m ON m.course_id = c.id
    LEFT JOIN module_tasks t ON t.module_id = m.id
    WHERE c.id IN (".implode(',', $courseIds).")
";

$stmt = $db->prepare($query);
if (!$stmt) {
    die('Query preparation error: ' . $db->error);
}

// Execute the query
if (!$stmt->execute()) {
    die('Query execution error: ' . $stmt->error);
}

// Process the results
$result = $stmt->get_result();
if ($result->num_rows === 0) {
    echo "No results found.";
} else {
    while ($row = $result->fetch_assoc()) {
        echo "Course: " . $row['course_name'] . ", Deadline: " . $row['course_deadline'] . "<br>";
        echo "Module: " . $row['module_name'] . ", Deadline: " . $row['module_deadline'] . "<br>";
        echo "Task: " . $row['task_name'] . ", Deadline: " . $row['task_deadline'] . "<br>";
        echo "<hr>";
    }
}

$stmt->close();
$db->close();
?>