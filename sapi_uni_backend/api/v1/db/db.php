<?php
require_once(dirname(__FILE__) . '/../config.php');

    $db = new mysqli($db_host, $db_user, $db_pass, $db_name);

    if ($db -> connect_errno){
        echo 'Failed to connect to MySQL: (' . $db -> connect_errno . ') ' . $db -> connect_error;
        die();
    }

    
?>