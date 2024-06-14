var url = window.location;
var moduleId;
var currentTaskId;
let params = new URLSearchParams(url.search);
let course_id = params.has('course_id') ? params.get('course_id') : null;

$(document).ready(function () {
    userData = getSessionData('userData');
    setProfileImage(userData.user_id);
   

    if (!userData || $.isEmptyObject(userData)) {
        console.error('Not logged in');
        window.location.href = 'login.html'; 
    }
    var currentTaskId;
    setTimeout(function () {    
        updateChat();
    }, 300)
    if (!course_id) {
        // display appropriate message "course not found"
        return;
    }

    APICall(
        {
        type: "GET",
        url: "load/courses/one?course_id=" + course_id,
        success: function (response) {
            $('.description, .taskdescription').hide();
            var course = JSON.parse(response);
            console.log("course:",course);
            

            $('#loader').hide();
            $('.course_title').text(course.name);
            $('.course_description').text(course.desc);
            $('.teacher-name').text(course.teacher_name);

            for (var i = 0; i < course.modules.length; i++) {
                var module = course.modules[i];
                var moduleListItem = $('<li>');
                moduleListItem.append(`
                <div class='parent' data-id="${module.m_id}">
                    <div class="box has-text-centered mb-2 module" style="color: rgb(0, 0, 0); width: 100%; position: relative">
                        <strong>${module.name}</strong>
                        <i class="fa fa-arrow-down" aria-hidden="true"></i>
                    </div>
                    <div class="box description mb-6" style="color: rgb(0, 0, 0); width: 100%">
                        <p>${module.desc}</p>
                        <h3 class="m-3 module-tasks" data-mid="${module.m_id}">
                            Feladatok
                        </h3>
                        <div class="buttons module-buttons">
                            <!-- Module specific buttons here -->
                        </div>
                    </div>
                </div>
                `);
                
                $('#modulesList').append(moduleListItem);
            
                for (var j = 0; j < module.tasks.length; j++) {
                    var task = module.tasks[j];
                    var taskId = task.t_id;
                    var taskElement = $(`
                        <div class="task_parent" id="t_${taskId}">
                            <div data-id="${task.t_id}" class="box task mt-3" style="color: rgb(0, 0, 0); width: 100%" >
                                ${task.task_name}
                                <i class="fa fa-arrow-down" aria-hidden="true"></i>
                                <div class="box no-border taskdescription" style="color: rgb(0, 0, 0); width: 100%">
                                    <p>${task.desc}</p>
                                    <div class="teacher-uploaded-files">
                                        <!-- Teacher uploaded files will go here -->
                                    </div>
                                    <!-- Dashed line separator will only be added if there are student files -->
                                    ${task.student_files.length > 0 ? '<hr style="border:2px dashed black; margin-top: 20px;">' : ''}
                                    <div class="student-uploaded-files">
                                        <!-- Student uploaded files will go here -->
                                    </div>
                                    <div class="task-buttons"> 
                                        <div class="button is-success upload-file-btn" style="margin-top: 20px;">
                                            <i class="fa fa-upload" aria-hidden="true"></i> <b>Feltöltés</b>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                    `);
            
                    // Append the task element to the module tasks container
                    $(`.module-tasks[data-mid="${module.m_id}"]`).append(taskElement);
            
                    var teacherFilesContainer = taskElement.find('.teacher-uploaded-files');
                    var studentFilesContainer = taskElement.find('.student-uploaded-files');
                    var course_Id = parseInt(course_id, 10); 
                    task.files.forEach(function(file) {
                        var iconClass = getFileIconClass(file.filename);
                        var deleteButton = '';
         
                        if (userData.user_role == 1 && userData.teacher_courses.includes(course_Id  )) {
                            
                            deleteButton = '<i class="fa fa-times" style="cursor: pointer; color: red; top: -20px; left: 55%; position: absolute;"></i>';
                        }

                        var fileContainer = $('<div>').addClass('file-container').css('position', 'relative');
                        var fileDiv = $('<div>')
                            .attr('data-id', file.f_id)
                            .addClass('file')
                            .css({
                                display: 'flex',
                                alignItems: 'center',  // Center the content vertically
                                justifyContent: 'center',
                                cursor: 'pointer',
                                position: 'relative'
                            }).append($('<i>').addClass(iconClass).attr('aria-hidden', 'true'));

                        if (deleteButton) {
                            fileDiv.append(deleteButton);
                        }

                        var fileNameP = $('<p>').css({
                            maxWidth: '100%',
                            whiteSpace: 'nowrap',  // Prevent the filename from wrapping
                            overflow: 'hidden',  // Hide overflow
                            textOverflow: 'ellipsis'  // Add ellipsis if the text overflows
                        }).text(file.filename);

                        fileContainer.append(fileDiv).append(fileNameP);
                        teacherFilesContainer.append(fileContainer);
                    });

                    // Student files
                    task.student_files.forEach(function(file) {
                        var iconClass = getFileIconClass(file.file_name);
                        var deleteButtonHtml = '';
                        if (userData.user_role == 0) {  // Assuming '0' is the role ID for students
                            deleteButtonHtml = '<i class="fa fa-times" style="cursor: pointer; color: red; top: -20px; left: 55%;    position: absolute;"></i>';
                        }
                        var studentFileContainer = $(
                            `<div class="file-container" style="position: relative; width: 100%; margin-bottom: 10px;">
                                <div data-id="${file.uuid}" class="student-file" style="display: flex; justify-content: center; cursor: pointer; position: relative;">
                                    
                                        <i class="${iconClass}" aria-hidden="true" style="z-index: 1;"></i>
                                        ${deleteButtonHtml}
                                </div>
                                <p style="max-width: calc(100% - 20px);">${file.file_name}</p>
                            </div>`
                        );

                        studentFilesContainer.append(studentFileContainer);
                    });

                }
            
                moduleListItem.find('.upload-file-btn').on('click', function (event) {
                    event.stopPropagation(); 
                    showModal('fileUploadModal');
                    moduleId = $(this).closest('.parent').data('id');
                    console.log("Module ID:", moduleId);
            
                    var taskElement = $(this).closest('.task');
                    console.log("Task element:", taskElement);
            
                    // Globális változó frissítése
                    currentTaskId = taskElement.data('id');
                    console.log("Current Task ID:", currentTaskId);
                    
                    $('#fileUploadInput').on('change', function() {
                        var fileName = $(this).val().split('\\').pop(); // Kiválasztott fájl nevének kinyerése
                        $('.file-name').text(fileName); // Fájlnév beállítása a megfelelő HTML elembe
                    });
                });
                
            }
            
            // Utility function to determine the file icon class based on file extension
            function getFileIconClass(filename) {
                var iconClass = '';
                if (filename.endsWith('.docx')) {
                    iconClass = 'fa fa-file-word-o';
                } else if (filename.endsWith('.pdf')) {
                    iconClass = 'fa fa-file-pdf-o';
                } else if (filename.endsWith('.xls') || filename.endsWith('.xlsx') || filename.endsWith('.xlsm')) {
                    iconClass = 'fa fa-file-excel-o'; 
                } else if (filename.endsWith('.ppt') || filename.endsWith('.pptx')) {
                    iconClass = 'fa fa-file-powerpoint-o'; 
                } else {
                    iconClass = 'fa fa-file'; 
                }
                return iconClass;
            }
            
            // Make sure to call these functions to initialize the accordions
            moduleAccordion();
            taskAccordion();
            
        },
        error: function (error) {
            console.log(error);
            // display error here
            $('#loader').hide();
            $('#error').show().html('Course not found ... etc.');
        }
    });
   
    function updateChat() {
        APICall({
            url: 'get/messages',
            type: 'GET',
            data: {
                course_id: course_id
            },
            success: function(response) {
                resp = JSON.parse(response);
                console.log(resp);
                if (resp.success) {
                    var messages = resp.messages;
                    $('#messages').empty();
                    messages.forEach(function(msg) {
                        var messageContainer = $('<div>').addClass('message-container');
                        var messageBox;
                    
                        if (msg.userRole === 0) {
                            // Diák üzenete
                            messageBox = $('<div>').addClass('student-message-box is-pulled-right')
                                                   .append($('<p>').text(msg.message));
                        } else if (msg.userRole === 1) {
                            // Tanár üzenete
                            messageBox = $('<div>').addClass('teacher-message-box is-pulled-left')
                                                   .append($('<p>').html('<strong class="teacher-name-chat">' + msg.userName + ': </strong><br>' + msg.message));
                           
                        }
                    
                        messageContainer.append(messageBox);
                        $('#messages').append(messageContainer);
                    });
                    
        
                    $('.input').val('');
                } else {
                    console.error('Hiba az üzenetek lekérése közben: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                console.error('Hiba az AJAX kérés során: ' + error);
            }
        }).done(function(data) {
            if (!data.success && data.redirect) {
                window.location.href = data.redirect;
            }
        });
    };
    
    
    
    var queryString = window.location.search;
    var urlParams = new URLSearchParams(queryString);
    var courseId = urlParams.get('course_id');


    APICall({
        type: 'POST',
        url: 'get/user',
        data: {},
        success: function (response) {
            resp = JSON.parse(response);
            var userData = getSessionData('userData');

            $('#loggedin-username span').html("Üdvözüljük, <br> " + resp.user_name);
            teacherCourses = userData.teacher_courses;
            console.log(teacherCourses);
            if (userData.user_role == 0  ) {
                var chatBtn = '<button class="button chat-button is-rounded is-large" id="chat-toggle-button">Chat</button>';
                setTimeout(function() {
                    $('.chat-button-container').append(chatBtn);

                    $("#chat-toggle-button").click(function() {
                    
                    $(".chat-container").toggleClass("active");
                    $("body").toggleClass("chat-active"); 
                });
                }, 100);

                $("#chat-close-button").click(function() {
                    $(".chat-container").removeClass("active");
                    $("body").removeClass("chat-active"); 
                });
            }
            $("#send-msg-btn").click(function() {
                var messageInput = $("#msg-inp").val().trim();
                if (messageInput.length === 0) {
                    $("#msg-inp").val('');
                    return; 
                }
                var dataToSend = {
                    courseId: courseId,
                    userId: userData.user_id,
                    userRole: userData.user_role,
                    student_courses: userData.student_courses,
                    userName: userData.user_name,
                    message: messageInput,   
                };
            
                APICall({
                    url: "upload/message",
                    type: "POST",
                    data: {dataToSend},
                    success: function(response) {
                        // Sikeres válasz esetén
                        console.log('repsonse',response);
                        var resp = JSON.parse(response);
                        if (resp.success) {
                            // Sikeres üzenetfeltöltés esetén frissítsük a chatet
                            updateChat();
                        }
                    }
                });
            });
            var courseIdNumber = parseInt(courseId, 10); // a "10" az számrendszer alapja
           
            if (userData.user_role == 1 && teacherCourses.indexOf(courseIdNumber) !== -1) {
                var removeCourseButton = "<a class='button is-danger mt-6 ' id='remove-course-btn' data-target='modaly-image2'>Kurzus Törlése </a>";
                var createModuleButton = "<a class='button is-link mt-6' id='create-module-btn' data-target='modal-image2'>Modul Létrehozása</a>"
                var editModuleButton = "<a class='button is-link mt-6 edit-module-btn'>Modul Szerkesztése</a>"
                var addTaskButton = "<a class='button is-link mt-6 add-task-btn'>Feladat Létrehozása</a>"
                var deleteModuleButton = "<a class='button is-danger mt-6 delete-module-btn'>Modul Törlése</a>"
                var deleteTaskButton = "<a class='button is-danger is-pulled-right mt-6 delete-task-btn'>Feladat Törlése</a>"
                var gradeModuleButton = "<a class='button is-success mt-6 grade-module-btn'>Modul Kiértékelése</a>";
                $('.action_buttons').append(createModuleButton);
                $('.action_buttons').append(removeCourseButton);
                $('.course-edit-btn').show();
                setTimeout(function() {
                    $('.module-buttons').append(editModuleButton);
                    $('.module-buttons').append(addTaskButton);
                    $('.module-buttons').append(deleteModuleButton);
                    $('.task-buttons').append(deleteTaskButton);
                    $('.module-buttons').append(gradeModuleButton);

                    
                    deleteTaskOnClick();
                    gradeModuleOnClick();
                    editModuleOnClick();
                    addTaskOnClick();
                    deleteModuleOnClick();
                }, 100);
                    

                $('.course-registration-btn').remove();
              
            } else if (userData.user_role == 0 && userData.student_courses.indexOf(courseId) !== -1) {
                var submitModule = '<a class="button is-info submit-task-btn pulled-right" style="margin-top: 20px;"><i class="fa fa-upload" aria-hidden="true"></i> <b>Leadás Osztályozásra</b></a>';
                setTimeout(function() {
                    $('.module-buttons').append(submitModule);

                    submitModuleOnClick();
                },100);
            }
          
            $('#modulesList .file').on('click', function(event) {
                event.stopPropagation();
                var fileId = $(this).data('id');
                window.location.href = apiLink + "get/file?file_id=" + fileId;       
            });

            $('#modulesList .student-file').on('click', function(event) {
                event.stopPropagation();
                var fileId = $(this).data('id');
                window.location.href = apiLink + "get/student/file?file_id=" + fileId;       
            });
                
            $('#uploadFileBtn').on('click', function () {
                
                var fileInput = document.getElementById('fileUploadInput');
                var file = fileInput.files[0];
                
                var formData = new FormData(); 
                formData.append('file', file);
                formData.append('taskId', currentTaskId); 
                formData.append('teacherCourses', teacherCourses); 
                formData.append('moduleId', moduleId);
                formData.append('courseId', course_id);
                console.log(formData);
                
                APICall({
                    type: "POST",
                    url: "upload/file",
                    data: formData,
                    contentType: false, 
                    processData: false, 
                    success: function (response) {
                        respObj = JSON.parse(response);
                        console.log(respObj.message)
                        if (respObj.success == false){
                            displayModuleNotification(respObj.message, 'red');
                        } else {
                            displayModuleNotification(respObj.message, 'green');
                            setTimeout(function() {
                                window.location.reload(true);
                            }, 3000);
                        }
                    },
                    error: function (error) {
                        console.log(error);
                    }
                }).done(function(data) {
                    dataObj = JSON.parse(data);
                    if (!dataObj.success && dataObj.redirect) {
                        window.location.href = dataObj.redirect;
                    }
                });
            });

            $('.file-container .fa-times').click(function(e) {
                e.preventDefault();
                e.stopPropagation();
            
                var fileId = $(this).closest('.file-container').find('.file, .student-file').data('id');
                 
                var dialogHtml = `
                    <div id="fileDeleteModal" class="modal" style="display: flex;">
                        <div class="modal-background"></div>
                        <div class="modal-content">
                            <div class="box">
                                <p>Biztos szeretné törölni ezt a fájlt?</p>
                                <button class="button is-danger deleteConfirmFile">Igen</button>
                                <a class="button" id="cancelDelete">Mégsem</a>
                            </div>
                        </div>
                    </div>
                `;
            
                $('main').append(dialogHtml);
            
                $('#cancelDelete, .modal-background').click(function() {
                    $('#fileDeleteModal').remove(); 
                });
            
                $('.deleteConfirmFile').click(function() {
                    APICall({
                        url: 'delete/file', 
                        type: 'POST',
                        data: { 
                                file_id: fileId,
                                course_id: course_id
                            },
                        success: function(response) {
                            var result = JSON.parse(response);
                            console.log(result);
                            if (result.success == false){
                                displayModuleNotification(result.message, 'red');
                            } else {
                                displayModuleNotification(result.message, 'green');
                                
                                    window.location.reload(true);
                                
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error("Törlési hiba: ", error);
                            $('#fileDeleteModal').remove();
                        }
                    });
                });
            });
            
            

        $('.course-edit-btn').on('click', function () {
         
                $('#editCourseModal').addClass('is-active');
            
                // Kurzus nevének és leírásának kinyerése
                var editedTitle = $('.course_title').text().trim();
                var editedDescription = $('.course_description').text().trim();
            
                // Betöltjük az értékeket a modalba
                $('#editCourseTitle').val(editedTitle);
                $('#editCourseDescription').val(editedDescription);
            
                // Hozzáadjuk az eseménykezelőt a háttérre kattintáshoz
                $('#editCourseModal .modal-background').on('click', function () {
                    hideModal('editCourseModal');
                });
            
                // Hozzáadjuk az eseménykezelőt a cancel gombhoz
                $('#cancel-edit-course-btn').on('click', function () {
                   hideModal('editCourseModal');
                });
            
                APICall({
                    url: 'get/teachers', 
                    method: 'GET',
                    data: {
                        course_id: course_id,
                    },
                    success: function(data) {
                        var teachersDropdown = $('#editCourseTeacher');
                        teachersDropdown.empty(); // Töröljük a korábbi elemeket
                        teachersDropdown.append($('<option>', {
                            value: '',
                            text: 'Tanár kiválasztva'
                        }));
                        data.forEach(function(teacher) {
                            teachersDropdown.append($('<option>', {
                                value: teacher.id, // Itt tároljuk az azonosítót
                                text: teacher.name,
                                'data-extra-info': 'További információ' // További adat tárolása, ha szükséges
                            }));
                        });
                    },
                    error: function(xhr, status, error) {
                        console.error("Error loading teachers: ", error);
                    }
                });
                
       
                    
                $('#editCourseDescription').on('input', function() {
                    var inputLength = $(this).val().length;
                    var maxLength = 200;
                    $('#editCourseDescCount').text(inputLength + '/' + maxLength);
                        
                    if (inputLength >= maxLength) {
                        $(this).val($(this).val().substring(0, maxLength));
                    }
                                
                    $('#editCourseDescCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
                });
                        
            $('#edit-course-btn').off();
            $('#edit-course-btn').on('click', function () {
                
                if (!validateInputLength('#editCourseTitle', '#editCourseDescription')) {
                    return;
                }
                // A módosított adatok lekérése
                var editedTitle = $('#editCourseTitle').val();
                var editedDescription = $('#editCourseDescription').val();
                var editedAssignedTeacher = $('#editCourseTeacher').val();
                var editedDeadline = $('#editCourseDeadline').val();
                var dataToSend = {
                    courseId: courseId,
                    teacherCourses: userData.teacher_courses
                };
                        
                // Ellenőrizzük, hogy melyik mezők tartalmaznak adatot, és csak azokat küldjük el
                if (editedTitle.trim() !== '') {
                    dataToSend.editedTitle = editedTitle;
                }
                        
                if (editedDescription.trim() !== '') {
                    dataToSend.editedDescription = editedDescription;
                }
                        
                if (editedAssignedTeacher.trim() !== '' && editedAssignedTeacher !== 'Select Teacher') {
                    dataToSend.editedAssignedTeacher = editedAssignedTeacher;
                }
                        
                if (editedDeadline.trim() !== '') {
                    dataToSend.editedDeadline = editedDeadline;
                }
                
                APICall({
                    type: 'POST',
                    url: 'edit/course',
                    data: dataToSend,
                    success: function (response) {
                        respObj = JSON.parse(response);
                        if (respObj.success == false){
                            displayModuleNotification(respObj.message, 'red');
                        } else {
                            displayModuleNotification(respObj.message, 'green');
                            setTimeout(function() {
                                // window.location.reload(true);
                            }, 3000);
                        }
                    },
                    error: function (error) {
                        console.log(error);
                        // Hibás kérése esetén is megjelenítjük a hibaüzenetet
                        $('#notification-message').text("Error: " + error.statusText);
                        $('#notification').removeClass('is-hidden');
                    }
                }).done(function(data) {
                    if (!data.success && data.redirect) {
                        window.location.href = data.redirect;
                    }
                });           
            });
        });
                
            
        $('#remove-course-btn').on('click', function () {
            // Show the confirmation modal
            $('#confirmationModal').addClass('is-active');
            
            $('#confirmationModal .modal-background').on('click', function () {
                hideModal('confirmationModal');
            });

            $('#cancel-delete-course-btn').on('click', function () {
                hideModal('confirmationModal');
            });
            
            // Set up event listener for confirm button
            $('#confirmationModal .modal-confirm').on('click', function () {
                // Perform the delete operation via API
                APICall({
                    type: 'POST',
                    url: 'delete/course',     
                    data: {
                        courseId: courseId,
                        teacherCourses: userData.teacher_courses // Itt adod át a teacher_courses értékét
                    },
                    success: function (response) {
                        var result = JSON.parse(response);            
                        if (result.success) {
                            // Megkeressük a #notification elemet és beállítjuk a háttérszínt sikeres művelet esetén
                            var notification = $('#notification').css('background-color', 'green'); // Sikeres művelet színe
                        
                            // Beállítjuk az üzenet szövegét a #notification-message elembe
                            $('#notification-message').text(result.message);
                        
                            // Megjelenítjük az üzenetet az is-hidden osztály eltávolításával
                            notification.removeClass('is-hidden');
                        
                            // Beállítunk egy időzítőt az üzenet automatikus elrejtéséhez 5 másodperc után
                            setTimeout(function () {
                                notification.addClass('is-hidden');
                                window.location.href = 'all_courses.html'; // Átirányítás az all_courses.html oldalra
                            }, 3000);
            
                        } else {
                            // Hiba esetén hasonló logika, de más szöveggel és háttérszínnel
                            var notification = $('#notification').css('background-color', 'red'); // Hiba esetén szín
                            $('#notification-message').text(result.message); // Alapértelmezett hibaüzenet
                            notification.removeClass('is-hidden');
                        
                            // Itt nincs átirányítás, csak az üzenet elrejtése 5 másodperc után
                            setTimeout(function () {
                                notification.addClass('is-hidden');
                            }, 3000);
                        }
                        
                    },
                    error: function () {
                    }
                }).done(function(data) {
                    var dataObj = JSON.parse(data);     
                    if (!dataObj.success && dataObj.redirect) {
                        window.location.href = dataObj.redirect;
                    }
                });
                hideModal('confirmationModal');
            });
        });

            
                // Modal megnyitása a gombra kattintva
        $('#create-module-btn').click(function () {
            $('#createModuleModal').addClass('is-active');
        });
                
        $('.modal-background, .modal-close').on('click', function () {
            $('#createModuleModal').removeClass('is-active');
        });
                
        $('#cancel-create-module-btn').on('click', function () {
            hideModal('createModuleModal');
        });
        $('#moduleName').on('input', function () {
            var inputLength = $(this).val().length;
            var maxLength = 50;
            $('#moduleNameCount').text(inputLength + '/' + maxLength);

            if (inputLength >= maxLength) {
                $(this).val($(this).val().substring(0, maxLength));
            }
                
            $('#moduleNameCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
        });
                
        $('#moduleDescription').on('input', function () {
            var inputLength = $(this).val().length;
            var maxLength = 200;
            $('#moduleDescriptionCount').text(inputLength + '/' + maxLength);
                
            if (inputLength >= maxLength) {
                $(this).val($(this).val().substring(0, maxLength));
            }
                
            $('#moduleDescriptionCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
        });
        $('#create-module-btn-confirm').on('click', function () {
            if (!validateInputLength('#moduleName', '#moduleDescription')) {
                return;
            }
                
            // Adatok begyűjtése a modalban lévő mezőkből
            var moduleName = $('#moduleName').val();
            var moduleDeadline = $('#moduleDeadline').val();
            var moduleDescription = $('#moduleDescription').val();
                
            // AJAX kérés a szerver felé a modul létrehozásához
            APICall({
                type: 'POST',
                url: 'create/module',
                data: {
                    moduleName: moduleName,
                    moduleDeadline: moduleDeadline,
                    moduleDescription: moduleDescription,
                    teacherCourses: userData.teacher_courses,
                    courseId: courseId,
                },
                success: function (response) {
                    respObj = JSON.parse(response);
                    console.log('itt vagyunk',respObj);
                    if (respObj.success == false){
                        displayModuleNotification(respObj.message, 'red');
                    } else {
                        displayModuleNotification(respObj.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    }
                
                },
                error: function (error) {
                            // Hibakezelés
                    console.log(error);
                },  
            }).done(function(data) {
                dataObj = JSON.parse(data);
                if (!dataObj.success && dataObj.redirect) {
                    window.location.href = dataObj.redirect;
                }
            });
        });
        var course_id_number = parseInt(course_id, 10)
        if (userData.user_role == 0) {
            if (userData.student_courses.includes(course_id)) {
                        
                setTimeout(function() {
                    
                    $('.course-cancellation-btn').show();
                
                }, 100)
                console.log('ide be jon meg')
            } else {
                // Student not registered for the course, show registration button
                setTimeout(function() {
                console.log('ide nem jon be')
                $('.course-registration-btn').show();
                },100)
            }
            
            if (userData.user_role !== "0") {
                $('.course-registration-btn').hide();
                $('.course-cancellation-btn').hide();
            }
        }
        
    }
            
});

        

    $('.course-registration-btn').on('click', function () {
        var urlParams = new URLSearchParams(window.location.search);
        var courseId = urlParams.get('course_id');
        
        APICall({
            type: "POST",
            url: "upload/students",
            data: {
                courseId: courseId
            },
            success: function (response) {
                var result = JSON.parse(response);
                console.log(result);
                if (result.success == true) {
                    regNotification(result.message);
                    $('.course-registration-btn').hide(); 
                    $('.course-cancellation-btn').show();
                    setTimeout(function() {
                        location.reload(); 
                    }, 3000); 
                } else if (result.success == false) {
                    regNotificationFail(result.message);
                }            
            },
            error: function (error) {
                console.log(error);
            }
        });
    });


    $('.course-cancellation-btn').on('click', function () {
        var urlParams = new URLSearchParams(window.location.search);
        var courseId = urlParams.get('course_id');

        // AJAX kérés küldése a kurzus lemondásához
        APICall({
            type: 'POST',
            url: 'delete/registration',
            data: {
                courseId: courseId
            },
            success: function (response) {
                var result = JSON.parse(response);
                if (result.success) {
                    $('.course-cancellation-btn').hide();
                    $('.course-registration-btn').show(); 
                    regCancellationNotification(result.message);
                    setTimeout(function() {
                        location.reload();
                    }, 3000); 
                } else {
                    regCancellationNotificationFail(result.message);
                }
            },
            error: function (error) {
                console.log("AJAX error:", error);
            }
        });
    });
});

function moduleAccordion() {
    $('#modulesList .module').click( function () {

        // Kiválasztjuk a megfelelő leírás és nyíl elemeket a kattintott modulhoz
        var moduleDescription = $(this).closest('li').find('.description');
        var arrowIcon = $(this).find('.fa-arrow-down');
        // Az aktív modulokat megtaláljuk és eltávolítjuk róluk az 'active' osztályt
        $('.module.active').not(this).removeClass('active');
        // Hozzáadjuk az 'active' osztályt az aktuális modulhoz
        $(this).toggleClass('active');
        // Az ikon forgatása
        arrowIcon.toggleClass('rotated');
        // Összecsukjuk vagy kinyitjuk a leírást a slideToggle segítségével
        moduleDescription.slideToggle('slow');
    });
}

function taskAccordion() {
    $('#modulesList .task').click(function (event) {
 
        event.stopPropagation();

        // Kiválasztjuk a megfelelő nyilat és leírást a kattintott feladathoz
        var arrowIcon = $(this).find('.fa-arrow-down');
        var taskDescription = $(this).find('.taskdescription');
        // Az ikon forgatása
        arrowIcon.toggleClass('rotated');
        // Összecsukjuk vagy kinyitjuk a leírást a slideToggle segítségével
        taskDescription.slideToggle('slow');
    });
};

function displayModuleNotification(message, bgColor) {
    // Létrehozzuk a notifikációs elemet
    var notification = $('<div>', {
        class: 'notification m_notification is-hidden has-text-centered',
        style: 'background-color: ' + bgColor + '; color: aliceblue;'
    });

    // Hozzáadunk egy <span> elemet az üzenettel
    var messageSpan = $('<span>', {
        class: 'm_notification-message',
        text: message
    });

    // Hozzáadjuk az üzenetet tartalmazó <span>-t a notifikációhoz
    notification.append(messageSpan);

    // Megkeressük az aktív modális ablak .modal-background elemét
    var modalBackground = $('.modal.is-active .modal-background').first();
    if (modalBackground.length) {
        // Ha létezik .modal-background az aktív modális ablakban, hozzáadjuk a notifikációt
        modalBackground.append(notification);
    } else {
        // Alternatív megoldás, ha nincs .modal-background vagy nincs aktív modális ablak
        $('body').append(notification);
    }

    // Az is-hidden osztály eltávolításával megjelenítjük a notifikációt
    notification.removeClass('is-hidden');

    // 3 másodperc után elrejtjük a notifikációt
    setTimeout(function() {
        notification.addClass('is-hidden');
        // Eltávolítjuk a DOM-ból, hogy ne maradjon felesleges elem
        notification.remove();
    }, 3000);
}

function validateInputLength(titleInput, descInput) {
    var titleLength = $(titleInput).val().length;
    var descLength = $(descInput).val().length;
    
    if (titleLength < 5) {
        displayModuleNotification('A kurzus neve legalább 5 karakter hosszú kell legyen.');
        return false;
    }

    if (descLength < 20) {
        displayModuleNotification('A kurzus leírása legalább 20 karakter hosszú kell legyen.');
        return false;
    }

    return true;
}



function gradeModuleOnClick() {
    $('.grade-module-btn').on('click', function () {
        // Keresd meg a legközelebbi '.parent' osztályú elemet, ami tartalmazza a modul azonosítót
        var moduleId = $(this).closest('.parent').data('id');
        
        if (moduleId) {
            window.location.href = 'grading.html?module_id=' + moduleId;
        } else {
            console.error('Nem található modul azonosító.');
        }
    });
}


function addTaskOnClick() {
    $('.parent .add-task-btn').click(function () {
        var moduleId = $(this).closest('.parent').data('id');
        console.log('Module ID:', moduleId);
            
        // Megjelenítjük a modal-t
        $('#createTaskModal').addClass('is-active');
            
        // Hozzáadjuk az eseménykezelőt a háttérre kattintáshoz
        $('#createTaskModal .modal-background').on('click', function () {
            hideModal('createTaskModal');
        });
            
        // Hozzáadjuk az eseménykezelőt a cancel gombhoz
        $('#cancel-add-task-btn').on('click', function () {
            hideModal('createTaskModal');
        });
            
        // Hozzáadjuk az eseménykezelőt a fájl feltöltéséhez
        $('.file-input').on('change', function () {
            var fileName = $(this).val().split('\\').pop();
            $(this).closest('.file').find('.file-name').text(fileName);
        });
            
        // Karakterszámlálók hozzáadása a task névhez és leíráshoz
        $('#taskName').on('input', function () {
        var inputLength = $(this).val().length;
        var maxLength = 50;
        $('#taskNameCount').text(inputLength + '/' + maxLength);
        
        if (inputLength >= maxLength) {
            $(this).val($(this).val().substring(0, maxLength));
        }
                
        $('#TaskNameCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
        });
            
        $('#taskDescription').on('input', function () {
            var inputLength = $(this).val().length;
            var maxLength = 200;
            $('#taskDescriptionCount').text(inputLength + '/' + maxLength);
            if (inputLength >= maxLength) {
                $(this).val($(this).val().substring(0, maxLength));
            }

            $('#taskDescriptionCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
        });
            
        $('#createTaskBtn').on('click', function () {
            if (!validateInputLength('#taskName', '#taskDescription')) {
                return;
            }
            // A módosított adatok lekérése
            var taskTitle = $('#taskName').val();
            var taskDescription = $('#taskDescription').val();
            var taskDeadline = $('#taskDeadline').val();
            
                
            var formData = new FormData();
            formData.append('courseId', course_id);
            formData.append('moduleId', moduleId);
            formData.append('teacherCourses', userData.teacher_courses);
            formData.append('taskFile', $('#taskFileInput')[0].files[0]); 
                
            if (taskTitle.trim() !== '') {
                formData.append('taskTitle', taskTitle);
            }
                
            if (taskDescription.trim() !== '') {
                formData.append('taskDescription', taskDescription);
            }
                
            if (taskDeadline.trim() !== '') {
                formData.append('taskDeadline', taskDeadline);
            }
                
                    // AJAX kérés elküldése
            APICall({
                type: 'POST',
                url: 'create/task',
                data: formData,
                contentType: false,  
                processData: false,  
                success: function (response) {
                    respObj = JSON.parse(response);
                    console.log(respObj);
                    if (respObj.success == false){
                        displayModuleNotification(respObj.message, 'red');
                    } else {
                        displayModuleNotification(respObj.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    }
                },
                error: function (error) {
                    console.log(error);
                    // Hibás kérése esetén is megjelenítjük a hibaüzenetet
                    $('#notification-message').text("Error: " + error.statusText);
                    $('#notification').removeClass('is-hidden');
                }
            }).done(function(data) {
                dataObj = JSON.parse(data);
                if (!dataObj.success && dataObj.redirect) {
                    window.location.href = dataObj.redirect;
                }
            });        
        });       

    });     
};

function editModuleOnClick() {
    $('.parent .edit-module-btn').click (function () {
        moduleId = $(this).closest('.parent').data('id');
        console.log(moduleId);
        var dataToSend = {
            moduleId: moduleId,
            teacherCourses: userData.teacher_courses,
            courseId: course_id,
        };
   

        var originalModuleName = $(this).closest('.parent').find('.module strong').text().trim();
        var originalModuleDescription = $(this).closest('.parent').find('.box.description p').text().trim();
                

        // Az eredeti értékek feltöltése a modal-ba
        $('#editModuleName').val(originalModuleName);
        $('#editModuleDescription').val(originalModuleDescription);
        // $('#editModuleDeadline').val(originalModuleDeadline);
            
        $('#editModuleModal').attr('data-id', moduleId);
        
        showModal('editModuleModal');
        // Karakterszámlálók beállítása és kezelése
        $('#editModuleName').on('input', function() {
            var inputLength = $(this).val().length;
            var maxLength = 50;
            $('#editModuleNameCount').text(inputLength + '/' + maxLength);
                        
            if (inputLength >= maxLength) {
                $(this).val($(this).val().substring(0, maxLength));
            }
                    
            $('#editModuleNameCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);

        });
                
        $('#editModuleDescription').on('input', function() {
            var inputLength = $(this).val().length;
            var maxLength = 200;
            $('#editModuleDescriptionCount').text(inputLength + '/' + maxLength);

            if (inputLength >= maxLength) {
                $(this).val($(this).val().substring(0, maxLength));
            }
                    
            $('#editModuleDescriptionCount').text(Math.min(inputLength, maxLength) + '/' + maxLength);
        });
        
            
        $('#edit-module-confirm-btn').on('click', function () {
            if (!validateInputLength('#editModuleName', '#editModuleDescription')) {
                return;
            }
            var editedModuleName = $('#editModuleName').val();
            var editedModuleDescription = $('#editModuleDescription').val();
            var editedModuleDeadline = $('#editModuleDeadline').val();
                
            // Ellenőrizzük, hogy melyik mezők tartalmaznak adatot, és csak azokat küldjük el
            if (editedModuleName.trim() !== originalModuleName) {
                dataToSend.editedModuleName = editedModuleName;
            }
                    
            if (editedModuleDescription.trim() !== originalModuleDescription) {
                dataToSend.editedModuleDescription = editedModuleDescription;
            }
                    
            if (editedModuleDeadline.trim() !== '') {
                dataToSend.editedModuleDeadline = editedModuleDeadline;
            }
                
            APICall({
                type: 'POST',
                url: 'edit/module',
                data: dataToSend,
                dataType: 'json',
                success: function (response) {
                    if (response.success == false){
                        displayModuleNotification(response.message, 'red');
                    } else {
                        displayModuleNotification(response.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    }
                },
                error: function (error) {
                }
            }).done(function(data) {
                if (!data.success && data.redirect) {
                    // Ha a válaszban van redirect utasítás
                    window.location.href = data.redirect;
                }
            });
        });       
    });   
};

function submitModuleOnClick() {
    // Attach click event to the submit module button
    $(document).on('click', '.submit-task-btn', function() {
        moduleId = $(this).closest('.parent').data('id');
        console.log(moduleId);

        // Show the confirmation modal
        $('#confirmSumitModal').addClass('is-active');

        $('#confirm_submit_module').off();
        $('#confirm_submit_module').on('click', function() {
    
            APICall({
                type: "POST",
                url: 'submit/module',
                data: { module_id: moduleId,
                    course_id: course_id        
                },
                success: function(response) {
                    var result = JSON.parse(response);
                    console.log(result);
                    if (result.success == false){
                        displayModuleNotification(result.message, 'red');
                    } else {
                        displayModuleNotification(result.message, 'green');
                        setTimeout(function() {
                            $('#confirmSumitModal').removeClass('is-active');
                        }, 3000);
                    }
                },
                error: function(error) {
                  
                }
            });
        });

        // Set up event listener for cancel button and modal background
        $('#cancel-submit-module-btn, #confirmSumitModal .modal-background').on('click', function() {
            // Close the modal
            $('#confirmSumitModal').removeClass('is-active');
        });
    });
}



function deleteModuleOnClick() {
    $('.parent .delete-module-btn').click(function () {
        moduleId = $(this).closest('.parent').data('id');
        console.log(moduleId);

        var dataToSend = {
            moduleId: moduleId,
            teacherCourses: userData.teacher_courses,
            courseId: course_id,
        };

        showModal('confirmationModuleModal');

    // Set up event listener for confirm button
        $('#confirm_delete_module').on('click', function () {

            APICall({
                type: 'POST',
                url: 'delete/module',     
                data: dataToSend,
                success: function (response) {        
                    var result = JSON.parse(response);
                    console.log(result);
                    if (result.success == false){
                        displayModuleNotification(result.message, 'red');
                    } else {
                        displayModuleNotification(result.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    }
                },
                error: function () {
                }
            }).done(function(data) {
                dataObj = JSON.parse(data);
                if (!dataObj.success && dataObj.redirect) {
                    window.location.href = dataObj.redirect;
                }
            });
        hideModal('confirmationModal');
        });
    });
};

function deleteTaskOnClick() {
    $('.parent .delete-task-btn').click(function(event) {
        event.stopPropagation(); 
        var taskId = $(this).closest('.task_parent').attr('id').split('_')[1]; // Extract the taskId from the DOM element id
        console.log('Task ID:', taskId);

        // Show the confirmation modal
        $('#confirmationTaskModal').addClass('is-active');

        // Event handler for confirming task deletion
        $('#confirm_delete_task').on('click', function() {
            var formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('teacherCourses', userData.teacher_courses);
            formData.append('courseId', course_id);

            // Perform AJAX request to delete the task
            APICall({
                url: 'delete/task',
                method: 'POST',
                data: formData, // Passing the FormData object
                contentType: false,
                processData: false,
                success: function(response) {
                    var result = JSON.parse(response);
                    console.log(result);
                    if (result.success) {
                        displayModuleNotification(result.message, 'green');
                    } else {
                        displayModuleNotification(result.message, 'red');
                    }
                    setTimeout(function() {
                        window.location.reload(true);
                    }, 3000);
                },
                error: function(xhr, status, error) {
                    console.log(error);
                }
            });

            // Close the modal
            $('#confirmationTaskModal').removeClass('is-active');
        });

        // Event handler for cancel button
        $('#cancel-delete-task-btn').on('click', function() {
            $('#confirmationTaskModal').removeClass('is-active');
        });
    });
}
