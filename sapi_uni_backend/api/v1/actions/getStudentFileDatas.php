<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

$file_id = $_GET['file_id'];

$userdata = getUserData();

$sql = "SELECT file_name, uuid FROM students_task_files WHERE uuid = '$file_id'";
$result = $db->query($sql);

if ($result === false || $result->num_rows === 0) {
    echo json_encode(["error" => "File not found in the database"]);
    exit;
}

$row = $result->fetch_assoc();
$filename = $row['file_name'];
$uuid = $row['uuid'];

$file_path = dirname(__FILE__) . "/../s_data/{$uuid}";

if (!file_exists($file_path)) {
    echo json_encode(["error" => "File not found"]);
    exit;
}

header('Content-Type: application/octet-stream');
header("Content-Transfer-Encoding: Binary"); 
header("Content-disposition: attachment; filename=\"$filename\""); 
readfile($file_path); 
?>
