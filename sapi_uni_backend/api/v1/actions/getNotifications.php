<?php
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Felhasználói adatok ellenőrzése
checkUserSession();

// Az aktuális felhasználó azonosítója a session-ből
$userId = $_SESSION['user_id'];

// Lekérjük az értesítéseket az adatbázisból az aktuális felhasználó számára
$stmt = $db->prepare("SELECT id, redirect, message FROM notifications WHERE receiver = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

// Értesítések tömbjének inicializálása
$notifications = array();

// Értesítések feltöltése a tömbbe
while ($row = $result->fetch_assoc()) {
    $notifications[] = $row;
}

// Felszabadítjuk a lekérdezés eredményét és bezárjuk a kapcsolatot az adatbázissal
$stmt->close();
$db->close();

// Visszatérünk az értesítésekkel JSON formátumban
echo json_encode($notifications);
?>
