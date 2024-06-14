<?php
session_start();

// Ellenőrizzük, hogy be van-e jelentkezve a felhasználó
if (isset($_GET["user_id"])) {
    // Mappa, ahol a profilképek vannak
    $target_dir = "pp/";

    // A felhasználóhoz tartozó profilkép neve
    $image_name = $_GET["user_id"] . ".jpg"; // Vagy a megfelelő kiterjesztésű fájlnevet használd

    // Teljes elérési útvonal a profilképhez
    $image_path = $target_dir . $image_name;

    // Ellenőrizzük, hogy a fájl létezik-e
    if (file_exists($image_path)) {
        // Ha igen, küldjük vissza a képet
        header("Content-Type: image/jpeg"); // Vagy a megfelelő MIME típust állítsd be
        readfile($image_path);
    } else {
        // Ha nincs, küldjünk vissza egy alapértelmezett képet vagy üres képet
        // Példa: ha nincs alapértelmezett kép, akkor küldhetünk egy üres képet
        $default_image_path = "pp/default.jpg";
        if (file_exists($default_image_path)) {
            header("Content-Type: image/jpeg");
            readfile($default_image_path);
        } else {
            // Ha nincs alapértelmezett kép, küldjünk vissza üres képet
            header("Content-Type: image/jpeg");
            readfile("pp/empty.jpg");
        }
    }
} else {
    // Ha a felhasználó nincs bejelentkezve, küldjünk vissza hibát vagy üres képet
    // Példa: ha nincs bejelentkezve, küldhetünk vissza egy üres képet vagy hibaképet
    header("Content-Type: image/jpeg");
    readfile("pp/error.jpg");
}
?>
