$(document).ready(function() {
    // window.location.href = apiLink + "set/deadlines";
    userData = getSessionData('userData');
    setProfileImage(userData.user_id)
    $('#add-course-btn').click(function() {
        $('#createCourseModal').addClass('is-active');
    });

    $('#cancel-create-course-btn').on('click', function () {
        hideModal('createCourseModal');
    });
    
    $('#createCourseModal .modal-background').on('click', function () {
        hideModal('createCourseModal');
    });
    
    $('#courseTitle').on('input', function() {
        var inputLength = $(this).val().length;
        var maxLength = 50;
        if (inputLength > maxLength) {
            $(this).val($(this).val().substr(0, maxLength));
            inputLength = maxLength; // Frissítsük az input hosszát a maximumra
        }
        $('#courseTitleCount').text(inputLength + '/' + maxLength);
    });
    
    $('#courseDescription').on('input', function() {
        var inputLength = $(this).val().length;
        var maxLength = 200;
        if (inputLength > maxLength) {
            $(this).val($(this).val().substr(0, maxLength));
            inputLength = maxLength; // Frissítsük az input hosszát a maximumra
        }
        $('#courseDescCount').text(inputLength + '/' + maxLength);
    });
    
    
    // Minimum hosszúság ellenőrzése
    $('#create-course-btn').on('click', function() {
        var titleLength = $('#courseTitle').val().length;
        var descLength = $('#courseDescription').val().length;
        if (titleLength < 5) {
            displayNotification('A kurzus neve legalább 5 karakter hosszú kell legyen.');
            return false;
        }
        if (descLength < 20) {
            displayNotification('A kurzus leírása legalább 20 karakter hosszú kell legyen.');
            return false;
        }
        createCourse(); 
    });
    
    
    function displayNotification(message) {
        $('#notification-message').text(message);
        $('#notification').removeClass('is-hidden');
        setTimeout(function() {
            $('#notification').addClass('is-hidden');
        }, 3000); 
    }
    
    
    function createCourse() {
        var courseTitle = $('#courseTitle').val(); // Kurzus címe
        var courseDescription = $('#courseDescription').val(); // Kurzus leírása
        var courseDeadline = $('#courseDeadline').val(); // Kurzus határideje
        
        APICall({
            type: 'POST',
            url: 'create/course',
            data: {
                courseName: courseTitle,
                courseDeadline: courseDeadline,
                courseDescription: courseDescription
            },
            success: function(response) {
                var respObj = JSON.parse(response);
                console.log(respObj);
                if (respObj.success) {
                    location.reload(); // Sikeres feltöltés esetén újratöltjük az oldalt
                } else {
                    console.log("Course creation failed: " + respObj.error);
                    // Esetleg más kezelés, ha a feltöltés nem sikerült
                }
            },
            error: function(error) {
                console.log(error);
            }
        }).done(function(data) {
            if (!data.success && data.redirect) {
                window.location.href = data.redirect;
            }
        });
    }

    $('#logout').click(function() {
        APICall({
            type: 'POST',
            url: 'logout',
            success: function(response) {
                var respObj = JSON.parse(response);
                if(HandleRedirect(respObj)) return;
            
            },
            error: function(error) {
                console.log(error);
            }
        });
    }); 
});

$(document).ready(function () {
APICall({
    type: "POST",
    url: "login",
    data: {},
    success: function (response) {
        setWelcomeMessage();
    },
    error: function (error) {
        console.log(error);
    }
});
});
$(document).ready(function() {

// ajax for loading courses
APICall({
    type: 'POST',
    url: 'load/courses/all',
    data: {}, 
    success: function(response) {
        // Válasz JSON formátumban
        var courses = JSON.parse(response);
        console.log(courses);
        
        // Itt történik a kurzusok megjelenítése
        for (var i = 0; i < courses.length; i++) {
            var course = courses[i];
            
            var courseCard = `
            <div class='column is-4' data-course-id='${course.course_id}'>
            <div class='card is-shady'>
                <div class='card-image'>
                    <figure class='image is-16by9'>
                        <img src='https://images.unsplash.com/photo-1687851898832-650714860119?ixlib=rb-4.0.3&amp;ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&amp;auto=format&amp;fit=crop&amp;w=1170&amp;q=80' alt='Image'>
                    </figure>
                </div>
                <div class='card-content'>
                    <div class='media'>
                        <div class='media-left'>
                            <figure class='image is-48x48'>
                                <img src='img/prof_icon.png' alt='Image'>
                            </figure>
                        </div>
                        <div class='media-content'>
                            <p class='title is-4 no-padding'>${course.course_name}</p>
                            <p class='subtitle is-6'>${course.teacher_name}</p>
                        </div>
                    </div>
                    <div class='content'>
                        <p>
                            ${course.course_description}
                        </p>
                        <div class="buttons">
                            <a class='button is-link modal-button is-half course-registration-btn' data-target='modal-image2' style='background-color: #006A42; display: none;'>Jelentkezés</a>
                            <a class='button is-link is-pulled-right view-course-btn'>Megtekintés</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;

            // A kártyát hozzáadhatod a '.row.columns.is-multiline' elemhez
            $('.row.columns.is-multiline').append(courseCard);
        }
    },
    error: function(error) {
        console.log("Error loading courses:", error);
    }
});

APICall({
    type: 'POST',
    url: 'get/user',
    data: {},
    success: function (response) {
        var userData = JSON.parse(response);
        var addCourseButton = '<a class="button is-link is-centered" id="add-course-btn">Kurzus létrehozása</a>';
        
        // setProfileImage(userData.user_id);
        $('#loggedin-username span').html("Üdvözüljük, <br> " + userData.user_name);
        // console.log(userData);
        if (userData.user_role == "1" ) {
            // Create the "Add Course" button
            
            
            $('#buttons').append(addCourseButton);
            
            $('#add-course-btn').click(function() {
                $('#createCourseModal').addClass('is-active');
            });

        } else if (userData.user_role == 2) {
            var uploadUsersButton = '<a class="button is-link is-centered" id="upload-users-btn" href="uploadCSV.html">Felhasználók hozzáadása</a>';

            $('#buttons').append(addCourseButton);
            $('#buttons').append(uploadUsersButton);
        
            
            $('#add-course-btn').click(function() {
                $('#createCourseModal').addClass('is-active');
            });

        
        }
        // Ellenőrizzük a diák kurzusai
        console.log(userData);
        if (userData.student_courses) {
            $('.course-registration-btn').each(function () {
                var courseId = $(this).closest('.column').data('course-id');
                console.log(courseId);
                var courseFound = false;
                for (var key in userData.student_courses) {
                    if (userData.student_courses.hasOwnProperty(key) && userData.student_courses[key] == courseId) {
                        courseFound = true;
                        break;
                    }
                }
                if (courseFound) {
                    $(this).hide(); // Ha a kurzus már szerepel a diák kurzusai között, elrejtjük a "Course Registration" gombot
                } else {
                    $(this).show(); // Ha a kurzus nem szerepel a diák kurzusai között, megjelenítjük a "Course Registration" gombot
                }
            });
        }
    }   
});


// Oldal átírányítása, Kurzus_ID tovább adása
    $(document).on('click', '.view-course-btn', function () {
        var courseId = $(this).closest('.column').data('course-id');
    
        console.log(courseId);
        
        window.location.href = 'course.html?course_id=' + courseId;
    });
});

function hideModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.classList.remove('is-active');
}