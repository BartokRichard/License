<?php
// Database connection setup
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
echo $_SESSION['user_role'];

if ($_SESSION['user_role'] != 2) {
    echo json_encode(['success' => false, 'message' => 'Nem megfelelő jogosultság', "redirect" => "login.html"]);
    exit();
}

if ($_FILES['file']['error'] == 0) {
    $file = $_FILES['file']['tmp_name'];
    $handle = fopen($file, "r");
    if ($handle) {
        $firstRow = true;  // Flag to skip the first row
        $db->begin_transaction();  // Begin transaction
        try {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if ($firstRow) {
                    $firstRow = false;  // Set flag to false after skipping the first row
                    continue;
                }
                // Assuming CSV columns are name, email, password, role in order
                if(count($data) < 3) continue;
                $name = $db->real_escape_string($data[0]);
                $email = $db->real_escape_string($data[1]);
                $password = hash('sha256', $data[2]); // Hashing password with SHA-256
                $role = isset($data[3]) && in_array($data[3], [0, 1, 2]) ? $data[3] : 0;  // Default to role 0 if not specified or invalid
                $active = 1;  // Setting user as active
                $query = "INSERT INTO users (name, email, auth, role, active) VALUES ('$name', '$email', '{\"password\": \"$password\"}', '$role', '$active')";
                if (!$db->query($query)) {
                    throw new Exception('Database insert failed: ' . $db->error);
                }
            }
            $db->commit();
            echo 'All data successfully imported into the database.';
        } catch (Exception $e) {
            $db->rollback();  // Rollback transaction on error
            echo 'Error importing data: ' . $e->getMessage();
        }
        fclose($handle);
    }
} else {
    echo 'Error in file upload';
}
?>
