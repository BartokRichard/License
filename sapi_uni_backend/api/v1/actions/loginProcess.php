<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
session_start();

// ELLENŐRIZZÜK AZ EMAIL ÉS JELSZÓ MEZŐKET
$email = ($_POST['email']);
$hashedPasswordFromClient = ($_POST['hashedPassword']);

$email = $db->real_escape_string($email);

// Lekérdezzük a felhasználó adatait az adatbázisból
$sql = "SELECT id, name, email, role, auth, active FROM `users` WHERE `email` = ?;";
$stmt = $db->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    // Ha nincs találat, hibaüzenet küldése
    echo json_encode(['success' => false, 'redirect' => 'login']);
    exit;
}

$row = $res->fetch_assoc();
$auth = json_decode($row['auth'], true);

if (!$auth || !isset($auth['password'])) {
    echo json_encode(['success' => false, 'redirect' => 'login']);
    exit;
}

// Ellenőrizzük, hogy a felhasználó fiókja aktív-e
if ($row['active'] != 1) {
    echo json_encode(['success' => false, 'redirect' => 'login']);
    exit;
}

// A só kivétele a session-ből
if (!isset($_SESSION['salt'])) {
    echo json_encode(['success' => false, 'redirect' => 'login']);
    exit;
}
$salt = $_SESSION['salt'];

// A szerver oldali hashelés a session-ben tárolt sóval
$serverHashedPassword = hash('sha256', $auth['password'] . $salt);

// Hashelt jelszó összehasonlítása
if ($serverHashedPassword == $hashedPasswordFromClient) {
    $_SESSION['user_id'] = $row['id'];
    $_SESSION['user_name'] = $row['name'];
    $_SESSION['user_email'] = $row['email'];
    $_SESSION['user_role'] = $row['role'];
    echo json_encode(['success' => true, 'redirect' => 'all_courses']);
} else {
    // Hibás jelszó esetén visszaküldjük a hibaüzenetet
    echo json_encode(['success' => false, 'redirect' => 'login']);
    exit;
}
?>
