<?php
require_once dirname(__FILE__) . '/../db/db.php'; // Ellenőrizd, hogy ez valóban a helyes útvonal
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
checkUserSession();

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_FILES["imageUpload"]) && isset($_SESSION["user_id"])) {
    // Mappa, ahova a képeket menteni szeretnénk
    $target_dir = "../pp/";

    // Ellenőrizzük, hogy létezik-e a mappa, ha nem, létrehozzuk
    if (!is_dir($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    // A feltöltött fájl neve
    $target_file = $target_dir . basename($_FILES["imageUpload"]["name"]);
    // A fájl típusa
    $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

    // Ellenőrizzük, hogy a fájl valódi kép-e vagy sem
    $check = getimagesize($_FILES["imageUpload"]["tmp_name"]);
    if ($check !== false) {
        // Ellenőrizzük a fájl méretét
        if ($_FILES["imageUpload"]["size"] > 500000) {
            echo json_encode(['success' => false, 'message' => 'A kép mérete túl nagy.']);
        } else {
            // Ellenőrizzük a fájl formátumát
            if ($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg") {
                echo json_encode(['success' => false, 'message' => 'A kép formátum nem megfelelő.']);;
            } else {
                // A fájl nevét az adott felhasználó azonosítójára módosítjuk
                $new_filename = $_SESSION["user_id"] . "." . $imageFileType;
                $target_file = $target_dir . $new_filename;

                // A kép áthelyezése a megadott mappába
                if (move_uploaded_file($_FILES["imageUpload"]["tmp_name"], $target_file)) {
                    echo json_encode(['success' => true, 'message' => 'Sikeres feltöltés.']);
                    echo " Az útvonal: " . $target_file;
                } else {
                    echo json_encode(['success' => false, 'message' => 'Hiba történt a kép feltöltésekor']);
                }
            }
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Hiba történt a kép feltöltésekor']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Hiba történt a kép feltöltésekor']);
}
?>
