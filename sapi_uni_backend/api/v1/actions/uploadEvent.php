<?php
require_once dirname(__FILE__) . '/../db/db.php'; // Ellenőrizd, hogy ez valóban a helyes útvonal
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
checkUserSession();

if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['name'], $_POST['date'], $_POST['time'])) {
    $user_id = $_SESSION['user_id'];
    $event_name = $_POST['name'];
    $event_date = $_POST['date'];
    $event_time = $_POST['time'];

    // Összeállítjuk a név és időt tartalmazó stringet
    $combinedName = $event_name . ' ; ' . $event_time;

    // Formázzuk az időpontot az adatbázisban tárolható formátumra
    $date_time = date('Y-m-d H:i:s', strtotime("$event_date $event_time"));

    // SQL parancs előkészítése a beszúráshoz
    $stmt = $db->prepare("INSERT INTO events (user_id, name, date_time) VALUES (?, ?, ?)");

    // Paraméterek hozzárendelése
    $stmt->bind_param('iss', $user_id, $combinedName, $date_time);

    // SQL parancs végrehajtása
    if($stmt->execute()) {
        // Sikeres beszúrás esetén visszajelzés
        echo json_encode(['status' => 'success', 'message' => 'Esemmény sikersen hozzáadva']);
    } else {
        // Hiba esetén hibaüzenet
        echo json_encode(['status' => 'error', 'message' => 'Nem sikertek hozzáadnii az eseményt ']);
    }

} else {
    // Ha nem POST kérés vagy hiányoznak az adatok, hibaüzenet
    echo json_encode(['status' => 'error', 'message' => 'Nem sikertek hozzáadnii az eseményt ']);
}
?>
