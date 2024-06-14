<?php
// TODO: kivenni
$_SESSION['id'] = 1;

$uid = $_SESSION['id'];

$sql = "SELECT users.name AS name, users.email AS email, login.img AS img, login.phone AS phone FROM `login`
        INNER JOIN users ON login.user_id = users.user_id
        WHERE login.id = '$uid';";

$rs = $db->query($sql);

if ($rs->num_rows === 0) {
    redirectToLogin();
}

$resp = array();

$row = $rs->fetch_assoc();
$resp['name'] = $row['name'];
$resp['email'] = $row['email'];
$resp['phone'] = $row['phone'];

echo json_encode($resp);
?>
