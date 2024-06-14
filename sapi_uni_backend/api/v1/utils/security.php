<?php
    function requireStudentLogin(){
        #check the role and the id

        if (!isset($_SESSION['id'])) {
            die('{"success": false ;"redirect": "login"}');
            
        }
    }

    function requireTeacherLogin(){
        #check the role and the id

        if (!isset($_SESSION['id'])) {
            die('{"success": false ;"redirect": "login"}');
        }
    }

    
    
    function redirectToLogin(){
        die('{"success": false , "redirect": "login"}');
    }

    function redirectToDashboard($fields = null){
        if(!is_array($fields)) 
            die('{"success": true, "redirect": "all_courses"}');
            
        $fields['success'] = true;
        $fields['redirect'] = "all_courses";
        die(json_encode($fields));
   }
    // <!-- {"succes": false;"redirect": "login"} -->
?>
