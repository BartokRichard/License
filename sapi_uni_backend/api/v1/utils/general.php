<?php
require_once dirname(__FILE__) . '/../index.php';

function StopWith404() {
    header("HTTP/1.0 404 Not Found");
    die();
}

function StopWith404Custom($arr) {
    header("HTTP/1.0 404 Not Found");
    $arr['status'] = false;
    die(json_encode($arr));
}

function checkUserSession() {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_name']) || !isset($_SESSION['user_email']) || !isset($_SESSION['user_role'])) {
       
        header("Location: login.html"); // Az áti
        
        echo "nincs bejelentkezve";
        exit(); // Azonnali kilépés a függvényből
    }
}

function getUserData() {
    $userData = array();

    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        $userName = $_SESSION['user_name'];
        $userEmail = $_SESSION['user_email'];
        $userRole = $_SESSION['user_role'];

        $userData = array(
            'user_id' => $userId,
            'user_name' => $userName,
            'user_email' => $userEmail,
            'user_role' => $userRole
        );
    }

    return $userData;
}
function getTeacherCourses($db, $userId) {
    $courseIds = [];
    $sql = "SELECT id FROM course WHERE teacher_id = ?";

    if ($stmt = $db->prepare($sql)) {
        $stmt->bind_param("i", $userId);
        
        $stmt->execute();
        
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $courseIds[] = $row['id'];
        }
        
        $stmt->close();
    }

    return $courseIds;
}

function getStudentCourses($db, $userId) {
    $courseIds = [];
    $sql = "SELECT id, registred_student_id FROM course";

    if ($result = $db->query($sql)) {
        while ($row = $result->fetch_assoc()) {
            $registeredStudents = json_decode($row['registred_student_id'], true);
            if (in_array($userId, $registeredStudents)) {
                $courseIds[] = $row['id'];
            }
        }
    }

    return $courseIds;
}
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function SendEmail($to, $toname, $subject, $body) {
    if(!class_exists('PHPMailer')) {
        require WEBDIR . '/lib/phpmailer/Exception.php';
        require WEBDIR . '/lib/phpmailer/PHPMailer.php';
        require WEBDIR . '/lib/phpmailer/SMTP.php';
    }
   
    $phpmailer = new PHPMailer();
    $phpmailer->isSMTP();
    $phpmailer->setFrom(SYS_EMAIL, SYS_NAME);
    $phpmailer->addAddress($to, $toname);
    $phpmailer->Subject = $subject;
    $phpmailer->isHTML(true);
    $phpmailer->Debugoutput = 'html';
    $phpmailer->SMTPDebug  = 1;
    $to = htmlentities($to);
    $phpmailer->Body = $body;
    try {
        return $phpmailer->send();
    } catch(Exception $ex) {
        error_log('Email error: ' . $ex->getMessage());
        return false;
    }
}
?>
