<?php
// Database connection setup
require_once dirname(__FILE__) . '/../db/db.php';
require_once dirname(__FILE__) . '/../config.php';
require_once dirname(__FILE__) . '/../utils/general.php';

session_start();
if (!isset($_SESSION['salt'])) {
    $_SESSION['salt'] = bin2hex(random_bytes(16));
}
echo $_SESSION['salt'];
?>
