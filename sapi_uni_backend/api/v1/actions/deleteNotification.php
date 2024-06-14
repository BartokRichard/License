<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Felhasználói adatok ellenőrzése
checkUserSession();

// Ellenőrizzük, hogy a kérés DELETE metódussal érkezett-e
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405); // Method Not Allowed
    exit(json_encode(array("success" => false, "error" => "Only DELETE method is allowed for this endpoint.")));
}

// Ellenőrizzük, hogy a kérés testében van-e adat
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['notificationId'])) {
    http_response_code(400); // Bad Request
    exit(json_encode(array("success" => false, "error" => "Missing notificationId parameter in request body.")));
}

$notificationId = $data['notificationId'];

$stmt = $db->prepare("DELETE FROM notifications WHERE id = ?");
$stmt->bind_param("i", $notificationId);

$response = array();

if ($stmt->execute()) {
    $response['success'] = true;
} else {
    $response['success'] = false;
    $response['error'] = "Hiba az értesítés törlésekor.";
}

$stmt->close();

echo json_encode($response);
?>
