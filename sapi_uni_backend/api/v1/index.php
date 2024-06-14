<?php
 header('Access-Control-Allow-Origin: https://students.csik.sapientia.ro/~gi2021btr/');
 header('Access-Control-Allow-Methods: GET, POST');
 header("Access-Control-Allow-Headers: X-Requested-With");

    require_once 'config.php';
    require_once 'db/db.php';
    require_once 'utils/general.php';
    require_once 'utils/security.php';

    if (!isset($_REQUEST['q']))
        die;

    $request = $_REQUEST['q'];


    define('WEBDIR', dirname(__FILE__));

    $request = rtrim($request, '/');

    /*$splitedpath = explode('/', $request);

    $action = $splitedpath[0];
/* 
    profile, 
    login, 
    register, 
    courses, 
    modules,
    teachers, 
    students, 
    adm
 */

 $routes = array(
    'profile' => 'actions/profile.php',
    'course/registration'=> 'actions/courseRegistration.php',
    'login' => 'actions/loginProcess.php',
    'logout' => 'actions/logoutProcess.php',
    'load/courses/all' => 'actions/loadCourses.php', 
    'load/courses/one' => 'actions/loadOneCourse.php',
    'load/grade/module' => 'actions/loadGradeModule.php',
    'upload/file' => 'actions/uploadFile.php',
    'upload/message' => 'actions/uploadMessage.php',
    'upload/user' => 'actions/uploadUsers.php',
    'upload/event' => 'actions/uploadEvent.php',
    'upload/profile/image' => 'actions/uploadProfileImage.php',
    'create/course' => 'actions/createCourse.php',
    'create/module' => 'actions/createModule.php',
    'create/task' => 'actions/createTask.php',
    'delete/course' => 'actions/deleteCourse.php',
    'delete/registration' => 'actions/deleteRegistration.php',
    'delete/notification' => 'actions/deleteNotification.php',
    'delete/module' => 'actions/deleteModule.php',
    'delete/task' => 'actions/deleteTask.php',
    'delete/file' => 'actions/deleteFile.php',
    'edit/course' => 'actions/editCourse.php',
    'edit/module' => 'actions/editModule.php',
    'edit/task' => 'actions/updateTask.php',
    'get/file' => 'actions/getFileDatas.php',
    'get/student/file' => 'actions/getStudentFileDatas.php',
    'get/user' => 'actions/getUserDatas.php',
    'get/salt' => 'actions/getSalt.php',
    'get/messages' => 'actions/getMessages.php',
    'get/teachers' => 'actions/getTeachers.php',
    'get/events' => 'actions/getEvenets.php',
    'get/notifications' => 'actions/getNotifications.php',
    'get/profile/image' => 'actions/getProfileImage.php',
    'get/grades' => 'actions/getModulesGrades.php',
    'submit/module' => 'actions/submitModuleToEvaluate.php',
    'set/grade/module' => 'actions/setGradeOfModule.php',
    'set/deadlines' => 'actions/setEventDeadlines.php',
    
);

foreach ($routes as $route => $file) {

    if (str_starts_with($request, $route)) {
        require_once($file);
        die();
    }   
}
die("Ismeretlen");

    // switch (true) {

    //     case str_starts_with($request, 'profile'):
    //         require_once('actions/profile.php');
    //         break;

    //     case str_starts_with($request, 'student/courses'):
    //         break;
        
    //     case str_starts_with($request, 'teacher/courses'):
    //         break;
        
    //     default:
    //         StopWith404();

    // }

    /*

    switch ($action) {
        case 'profile':
            require_once 'actions/profile.php'; 
            break;
        case 'student':
            case 'modules':
                require_once 'actions/modules.php'; 
                break;
            case 'courses';
                require_once 'actions/courses.php';
        default:
            echo'Baj van';
            break;
    } */

    // var_dump($action);

    // echo '<pre>'.print_r($splitedpath, true).'</pre>'
?>