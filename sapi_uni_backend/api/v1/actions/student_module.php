<?php
$_SESSION['id'] = 1;

$ui = $_SESSION['id'];

// MODULE LEKERDEZES
$sqlModules = "SELECT * FROM `modules`";
$rsModules = $db->query($sqlModules);

if ($rsModules->num_rows === 0) {
    die('hiba van ...');
}

$modules = array();

while ($rowModule = $rsModules->fetch_assoc()) {
    $module = array();
    $module['name'] = $rowModule['name'];
    $module['deadline'] = $rowModule['deadline'];
    $module['description'] = $rowModule['description'];

    $modules[] = $module;
}

// 0 ROLE USER LEKERDEZES
$sqlUsers = "SELECT * FROM `users` WHERE `role` = 0";
$rsUsers = $db->query($sqlUsers);

if ($rsUsers->num_rows > 0) {
    while ($rowUser = $rsUsers->fetch_assoc()) {
        $user = array();
        $user['name'] = $rowUser['name'];
        $modules[] = $user;
    }
}

$jsonOutput = '';

foreach ($modules as $data) {
    if (isset($data['name'])) {
        if (isset($data['deadline'])) {
            $jsonOutput .= "Module neve: " . $data['name'] . "<br>";
            $jsonOutput .= "Határidő: " . $data['deadline'] . "<br>";
            $jsonOutput .= "Leírás: " . $data['description'] . "<br>";
        } else {
            $jsonOutput .= "Diak neve: " . $data['name'] . "<br>";
        }
    }
}

die($jsonOutput);
