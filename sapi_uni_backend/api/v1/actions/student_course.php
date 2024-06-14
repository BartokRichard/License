<?php
$_SESSION['id'] = 1;

$uid = $_SESSION['id'];

// KURZUS LEKRDEZES
$sqlCourses = "SELECT * FROM `course`";
$rsCourses = $db->query($sqlCourses);

if ($rsCourses->num_rows === 0) {
    die('Hiba van...');
}

$courses = array();

while ($rowCourse = $rsCourses->fetch_assoc()) {
    $course = array();
    $course['type'] = 'course';
    $course['name'] = $rowCourse['name'];

    if (isset($rowCourse['deadline'])) {
        $course['deadline'] = $rowCourse['deadline'];
    } else {
        $course['deadline'] = null;
    }
    $course['active'] = $rowCourse['active'];
    $courses[] = $course;
}

// 0 ROLE USER LEKERDEZES
$sqlUsers = "SELECT * FROM `users` WHERE `role` = 0";
$rsUsers = $db->query($sqlUsers);

if ($rsUsers->num_rows > 0) {
    while ($rowUser = $rsUsers->fetch_assoc()) {
        $user = array();
        $user['type'] = 'user';
        $user['name'] = $rowUser['name'];
        $courses[] = $user;
    }
}

// JSON formátumba alakítás és kimenet
$jsonOutput = json_encode($courses);
header('Content-Type: application/json');
echo $jsonOutput;
?>
