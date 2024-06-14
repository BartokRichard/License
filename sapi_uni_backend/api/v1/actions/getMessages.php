<?php
// Az adatbázis kapcsolat beállítása
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';
session_start();

// Felhasználói adatok ellenőrzése
checkUserSession();

// Kurzus azonosító lekérése
// Kurzus azonosító lekérése
$courseId = isset($_GET['course_id']) ? $_GET['course_id'] : null;

$user_id = isset($_GET['student_id']) ? $_GET['student_id'] : $_SESSION['user_id'];

if ($courseId !== null) {
    $sql = "SELECT message FROM chat WHERE course_id = ? AND student_id = ?";
    $stmt = $db->prepare($sql);
    $stmt->bind_param("ii", $courseId, $user_id); // Ensure you use the variable $courseId which holds the actual course ID
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = array();

    while ($row = $result->fetch_assoc()) {
        $currentMessage = $row['message'];
        $individualMessages = explode('§', $currentMessage);

        foreach ($individualMessages as $msg) {
            $msgParts = explode(') ', $msg, 2);
            if (count($msgParts) === 2) {
                // Felhasználó nevének és szerepének kinyerése az üzenet szövegéből
                $userDetails = trim($msgParts[0], '('); // Eltávolítjuk a nyitó zárójelet
                list($userName, $userRole) = explode(' - ', $userDetails, 2);
                $userRole = intval($userRole); // Szerep átalakítása számmá
                
                $messages[] = array(
                    'userName' => $userName,
                    'userRole' => $userRole,
                    'message'  => trim($msgParts[1])
                );
            }
        }
    }

    $stmt->close();

    // JSON válasz küldése a kliensnek
    echo json_encode(array("success" => true, "messages" => $messages));
} else {
    // Hiba, ha hiányzik a course_id paraméter
    echo json_encode(array("success" => false, "message" => "Kurzus azonosítója hiányzik."));
}

?>
