
var selectedStudent = null;

APICall({
    type: 'POST',
    url: 'get/user',
    data: {},
    success: function (response) {
        var userData = JSON.parse(response);
        console.log(userData);
        sessionStorage.setItem('userData', JSON.stringify(userData));
        
        },
    error: function(xhr, status, error) {
        console.error(xhr.responseText);
    }
});


$(document).ready(function () {
    disableChat();
    userData = getSessionData('userData');
    setProfileImage(userData.user_id);

    var url = window.location;
    let params = new URLSearchParams(url.search);
    let module_id = params.has('module_id') ? params.get('module_id') : null;
    console.log(module_id);

    userData = getSessionData('userData');
    setProfileImage(userData.user_id)

    setInterval(updateTeacherChat, 5000); // 

    // Diákok listájának frissítése
    setInterval(updateStudentCardsWithEvaluationStatus, 5000); //

    if (userData.user_role !== 1 && userData.user_role !== 2) {
        console.error('Nincs jogosultság');
        sessionStorage.clear();
        setTimeout(function() {
            window.location.href = 'login.html';
        }, 100);
    }
    
   APICall({
        type: "GET",
        url: "load/grade/module?module_id=" + module_id,
        success: function (response) {
            resObj = JSON.parse(response);
            setupInitialUI(resObj);
            window.course_id = resObj.course_id; 
        },
        error: function (error) {
            console.log(error);
        }
    });

    $(document).on('click', '.student-card', function() {
        enableChat();
        window.studentId = $(this).data('student-id');
        window.selectedStudent = resObj.registeredStudents.find(student => student.user_id === window.studentId);
        
        if (selectedStudent) {
            $('.student-card').removeClass('selected-student');
            $(this).addClass('selected-student');
            $('#sname_box').find('p').text(selectedStudent.user_name); // Update the student name
    
            // Mentjük a kiválasztott diákot sessionStorage-be
            sessionStorage.setItem('selectedStudent', JSON.stringify(selectedStudent));
    
            updateTasksWithStudentFiles(resObj.modules, selectedStudent.student_uploads);
            updateModulesWithGradesAndStatus(selectedStudent.passed_modules);
            console.log('itt:',selectedStudent.passed_modules);
    
            $('#messages').html('<div id="loading-animation" style="text-align:center; position:relative;top:50px"><img src="img/spinerloader.gif" /></div>');
            updateTeacherChat(true);
        } else {
            console.log("Selected student not found in the system.");
        }
    });

    function updateModulesWithGradesAndStatus(passedModules) {
        setTimeout(function() {
            
            for (let i = 0; i < resObj.modules.length; i++) {
                let currentModule = resObj.modules[i];
                let moduleElement = $('.module-container[data-id="' + currentModule.module_id + '"]');
                let isStudentPassed = passedModules.some(pm => pm.module_id === currentModule.module_id && pm.passed);
                let isStudentToEvaluate = currentModule.students_to_evaluate.includes(window.selectedStudent.user_id);
    
                // Manage "Osztályzásra vár" and "Osztályozva" visibility
                if (isStudentToEvaluate) {
                    $('#evaluation-pending-' + currentModule.module_id).show();
                    $('#evaluation-success-' + currentModule.module_id).hide();
                } else {
                    $('#evaluation-success-' + currentModule.module_id).show();
                    $('#evaluation-pending-' + currentModule.module_id).hide();
                }
            }
    
            // Update grades and checkboxes
            passedModules.forEach(function(module) {
                var moduleElement = $('.module-container[data-id="' + module.module_id + '"]');
                moduleElement.find('select').val(module.grade);
                moduleElement.find('input[type="checkbox"]').prop('checked', module.passed == 1);
            });
        }, 800);
    }
    

    function updateTeacherChat(delayLoad = false) {
        APICall({
            url: 'get/messages',
            type: 'GET',
            data: {
                student_id: studentId,
                course_id: window.course_id
            },
            success: function(response) {
                var resp = JSON.parse(response);
                
                    setTimeout(function() {
                     
                        // $('#loading-animation').remove();
        
                        if (resp.success) {
                
                            $('#messages').empty();
                        
                                $('#loading-animation').remove();
                                
                                resp.messages.forEach(function(msg) {
                                    var messageContainer = $('<div>').addClass('message-container');
                                    var messageBox;
                                
                                    if (msg.userRole === 1) {
                                        // Diák üzenete
                                        messageBox = $('<div>').addClass('student-message-box is-pulled-right')
                                                .append($('<p>').html('<strong class="teacher-name-chat" style="color: lightgrey;">' + msg.userName + ':</strong><br>' + msg.message));
                                    } else if (msg.userRole === 0) {
                                        // Tanár üzenete
                                        messageBox = $('<div>').addClass('teacher-message-box is-pulled-left')
                                                            .append($('<p>').text(msg.message));
                                    
                                    }
                                
                                    messageContainer.append(messageBox);
                                    $('#messages').append(messageContainer);
                                });
                
                        
                            var chatContainer = $('#messages');
                            chatContainer.scrollTop(chatContainer.prop("scrollHeight"));
                
                           
                        } else {
                        console.error('Hiba az üzenetek lekérése közben: ' + resp.error);
                        }
                    }, 800);
                
            },
            error: function(xhr, status, error) {
                console.error('Hiba az AJAX kérés során: ' + error);
                
            }
        })
    }

    function updateStudentCardsWithEvaluationStatus() {
        APICall({
            type: "GET",
            url: "load/grade/module?module_id=" + module_id,
            success: function (response) {
                resObj = JSON.parse(response);
                const sortedStudents = resObj.registeredStudents.sort((a, b) => {
                    const aEvalNeeded = resObj.modules.some(
                        module => module.students_to_evaluate &&
                        module.students_to_evaluate.includes(a.user_id)
                    );
                    const bEvalNeeded = resObj.modules.some(
                        module => module.students_to_evaluate && 
                        module.students_to_evaluate.includes(b.user_id)
                    );
                    return bEvalNeeded - aEvalNeeded; 
                });

                var studentCardsHTML = '';
                resObj.registeredStudents.forEach(function(student) {
                    // Ellenőrizzük, hogy van-e osztályzásra váró modul
                    const hasEvaluationNeeded = resObj.modules.some(
                        module => module.students_to_evaluate &&
                         module.students_to_evaluate.includes(student.user_id)
                    );
                    
                    // Ellenőrizzük, a student.user_id 
                    const isSelected = sessionStorage.getItem('selectedStudent') ? JSON.parse(
                        sessionStorage.getItem('selectedStudent')
                    ).user_id === student.user_id : false;
    
                    // Ha a diák azonos a sessionStorage-ban tárolttal, hozzáadjuk a selected-student class-t
                    const selectedClass = isSelected ? 'selected-student' : '';
    
                    studentCardsHTML += `
                        <div class="column card-column is-12">
                            <div class="card student-card ${selectedClass}" data-student-id="${student.user_id}">
                                <div class="card-content">
                                    <p class="title is-5 student-card-name">${student.user_name}</p>
                                    ${hasEvaluationNeeded ? 
                                        '<span class="icon has-text-warning is-pulled-right">'+
                                        '<i class="fa fa-exclamation-triangle"></i></span>' : ''}
                                </div>
                            </div>
                        </div>
                    `;
                });
                $('.container .columns').html(studentCardsHTML);
            },
            error: function (error) {
                console.log(error);
            }
        });
    }
    
    
    $("#send-msg-btn").click(function() {
        var messageInput = $("#msg-inp").val().trim();
        if (messageInput.length === 0) {
            $("#msg-inp").val('');
            return; 
        }
    
        var dataToSend = {
            courseId: course_id,
            student_id: window.studentId,
            message: messageInput
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
                    updateTeacherChat();
                    $("#msg-inp").val("");
                }
            }
        });
    });
    
    function disableChat() {
        $('#chat_box').addClass('disabled');
        $('#msg-inp').prop('disabled', true);
    }
    
    function enableChat() {
        $('#chat_box').removeClass('disabled');
        $('#msg-inp').prop('disabled', false);
    }
    function GradeModuleClick() {
        $('.set-grade').click(function() {
            var moduleContainer = $(this).closest('.module-container');
            var moduleId = moduleContainer.data('id');
            var grade = moduleContainer.find('select').val();  // Jegy kiválasztása
            var passed = moduleContainer.find('input[type="checkbox"]').is(':checked');  // Átengedés állapotának kiválasztása
            var dataToSend = {
                studentId: window.selectedStudent.user_id,
                courseId: window.course_id,
                moduleId: moduleId,
                grade: grade,
                passed: passed
            };
            console.log(dataToSend);
    
            // AJAX POST kérés küldése az API-nak
            APICall({
                url: "set/grade/module", 
                type: "POST",
                data: dataToSend,
                success: function(response) {
                    var resp = JSON.parse(response);
                    console.log(resp.message);
                    if (resp.success) {
                        displayNotification(resp.message, 'green')
                    } else {
                        displayNotification(resp.message, 'red')
                    }
                },
                error: function(xhr, status, error) {
                    displayNotification(resp.message, 'red')
                }
            });
        });
    }
    function setupInitialUI(resObj) {
        if (!resObj || !resObj.course_name || !resObj.teacher_name) {
            window.location.href = 'course.html';
            return;
        }
    
        $('#course_name').text(resObj.course_name);
        $('#teacher_name').text(resObj.teacher_name);
    
        // Rendezés azok szerint, akiknek van osztályzásra váró moduljuk
        const sortedStudents = resObj.registeredStudents.sort((a, b) => {
            const aEvalNeeded = resObj.modules.some(module => module.students_to_evaluate && module.students_to_evaluate.includes(a.user_id));
            const bEvalNeeded = resObj.modules.some(module => module.students_to_evaluate && module.students_to_evaluate.includes(b.user_id));
            return bEvalNeeded - aEvalNeeded; // True values (need evaluation) come first
        });
    
        var studentCardsHTML = '';
        resObj.registeredStudents.forEach(function(student) {
            // Ellenőrizzük, hogy van-e osztályzásra váró modul
            const hasEvaluationNeeded = resObj.modules.some(module => module.students_to_evaluate && module.students_to_evaluate.includes(student.user_id));
            
            studentCardsHTML += `
                <div class="column card-column is-12">
                    <div class="card student-card" data-student-id="${student.user_id}">
                        <div class="card-content">
                            <p class="title is-5 student-card-name">${student.user_name}</p>
                            ${hasEvaluationNeeded ? '<span class="icon has-text-warning is-pulled-right" style="font-size: 35px; position: relative; top: -40px;right: -17px"><i class="fa fa-exclamation-triangle"></i></span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        $('.container .columns').html(studentCardsHTML);
    }
    
    
    function populateModulesAndTasks(modules) {
        $('.parent').empty(); // Töröljük a meglévő modulokat
    
        modules.sort((a, b) => {
            const aEvalNeeded = a.students_to_evaluate && a.students_to_evaluate.includes(window.selectedStudent.user_id);
            const bEvalNeeded = b.students_to_evaluate && b.students_to_evaluate.includes(window.selectedStudent.user_id);
            return bEvalNeeded - aEvalNeeded; // A kiértékelést igénylők kerüljenek előre
        });
    
        modules.forEach(function(module) {
            var moduleHTML = `
                <div class="module-container closed" data-id="${module.module_id}">
                    <div class="box has-text-centered title is-4 mt-6 mb-5 module">
                        <strong class="module-header">${module.module_name}</strong><i class="fa fa-caret-right module-icon" style="margin-left: 10px;"></i>
                        <span class="tag is-warning is-pulled-right" id="evaluation-pending-${module.module_id}" style="display: none;">Osztályzásra vár</span>
                        <span class="tag is-success is-pulled-right" id="evaluation-success-${module.module_id}" style="display: none;">Osztályozva</span>
                    </div>
                    <div class="module-content" style="display: none;">
                        <div class="box is-pulled-right grade-box" data-module-id="${module.module_id}">
                            <div class="field">
                                <div class="field-label title is-4 is-pulled-left" id="grading_field" style="width: 100px;">
                                    <label class="label">Jegy:</label>
                                </div>
                                <div class="field-body">
                                    <div class="field is-pulled-right">
                                        <div class="control">
                                            <div class="select" style="position: relative; z-index: 20;">
                                                <select>
                                                    <option>1</option>
                                                    <option>2</option>
                                                    <option>3</option>
                                                    <option>4</option>
                                                    <option>5</option>
                                                    <option>6</option>
                                                    <option>7</option>
                                                    <option>8</option>
                                                    <option>9</option>
                                                    <option>10</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="field is-grouped" style="margin-top: 30px;">
                                <div class="control">
                                    <label class="checkbox">
                                        <input type="checkbox" />
                                        Átenged
                                    </label>
                                </div>
                                <div class="control">
                                    <button class="button is-bottom set-grade" style="background-color: #006A42; color: #fff; font-weight: bold">Osztályzás</button>
                                </div>
                            </div>
                        </div>
                        ${module.tasks.map(task => `
                            <div class="task closed" >
                                <div class="box mb-3 task_parent" data-task-id="${task.task_id}">
                                    <div class="task_icon_wrapper" style="float: left; margin-right: 10px;">
                                        <i class="fa fa-caret-right" style="font-size: 20px; position: relative; top:-5px;"></i>
                                    </div>
                                    <h3 class="title is-4 task_cont closed" data-mid="${module.module_id}">${task.task_name}</h3>
                                    <div class="files-container" style="display: none;"></div> 
                                </div> 
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
    
            $('.parent').append(moduleHTML);
        });
        GradeModuleClick();
        initTaskAccordion(); // Initialize task accordion behavior
        initModuleAccordion(); // Initialize module accordion behavior
    }
    function initModuleAccordion() {
        $('.module-header').click(function() {
            var moduleElement = $(this).closest('.module-container');
            var moduleContent = moduleElement.find('.module-content');
            var icon = $(this).siblings('.module-icon'); // Ellenőrizze, hogy ez a szelektor helyes-e a DOM struktúrához képest
    
            if (moduleElement.hasClass('closed')) {
                moduleContent.slideDown(1000);  // Lassabb kinyitás
                moduleElement.removeClass('closed').addClass('opened');
                icon.removeClass('fa-caret-right').addClass('fa-caret-down');
                $('.module-container').not(moduleElement).removeClass('opened').addClass('closed')
                                     .find('.module-content').slideUp(1000) // Lassabb összecsukás
                                     .end()
                                     .find('.module-icon').removeClass('fa-caret-down').addClass('fa-caret-right');
            } else {
                moduleContent.slideUp(1000);  // Lassabb összecsukás
                moduleElement.removeClass('opened').addClass('closed');
                icon.removeClass('fa-caret-down').addClass('fa-caret-right');
            }
        });
    }
    
    
    
    function initTaskAccordion() {
        $('.task_cont').click(function() {
            var taskElement = $(this).closest('.task_parent');
            var filesContainer = taskElement.find('.files-container');
            var icon = $(this).prev('.task_icon_wrapper').find('.fa');
    
            // Ellenőrzés az 'opened' osztály jelenlétére és ennek megfelelő toggle művelet
            if (!$(this).hasClass('opened')) {
                filesContainer.slideDown('slow');
                $(this).addClass('opened').removeClass('closed');
                icon.removeClass('fa-caret-right').addClass('fa-caret-down');
                $('.task_cont').not(this).removeClass('opened').addClass('closed')
                               .find('.fa-caret-down').removeClass('fa-caret-down').addClass('fa-caret-right');
                $('.files-container').not(filesContainer).slideUp(400).closest('.task_parent').removeClass('opened').addClass('closed');
            } else {
                filesContainer.slideUp('slow');
                $(this).removeClass('opened').addClass('closed');
                icon.removeClass('fa-caret-down').addClass('fa-caret-right');
            }
        });
    }
    

    function updateTasksWithStudentFiles(modules, studentUploads) {
        // Eltávolítja a meglévő modulokat és feladatokat
        $('.module-container').remove();
        $('.task_parent').remove();
        
        // Betöltési animáció megjelenítése
        var loadingAnimationHtml = '<div id="loading-animation" style="text-align:center;"><img src="img/spinerloader.gif" /></div>';
        $('.parent.modules').append(loadingAnimationHtml);
    
        // Tegyük fel, hogy a fájlok betöltése valamilyen aszinkron művelet
        setTimeout(function() {
          
            $('#loading-animation').remove();
  
            populateModulesAndTasks(modules);
            
            modules.forEach(module => {
                module.tasks.forEach(task => {
                    var taskElement = $(`.task_parent[data-task-id="${task.task_id}"] .files-container`);
                    var files = studentUploads.filter(f => f.task_id === task.task_id);
                    files.forEach(file => {
                        var iconClass = getFileIconClass(file.file_name);
                        var fileHTML = `
                        <div class="file-display" style="display: flex; flex-wrap: wrap ;justify-content: center;">
                            <span class="${iconClass} file-icon"></span>
                            <span class="file-name">${file.file_name}</span>
                        </div>`;
                      
                        taskElement.append(fileHTML);
                    });
                });
            });
        }, 800); // Az 1000 ms csak példa, valójában az aszinkron művelet teljesülési ideje szerint kell beállítani
    }
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
        

    $('.task_cont').click(function() {
        var moduleTasks = $(this).closest('.task_parent').find('.module-tasks');
        var icon = $(this).prev('.task_icon_wrapper').find('.fa');
        
        console.log(this);
        $('.module-tasks').not(moduleTasks).slideUp(400); 
        $('.fa-caret-down').removeClass('fa-caret-down').addClass('fa-caret-right');
    
        $('.task_cont').removeClass('selected-task');
    
        setTimeout(function() {
            if (moduleTasks.is(":visible")) {
                moduleTasks.slideToggle('slow'); 
                $(icon).removeClass('fa-caret-down').addClass('fa-caret-right');
            } else {
                moduleTasks.slideToggle('slow'); 
                $(icon).removeClass('fa-caret-right').addClass('fa-caret-down');
                $(this).addClass('selected-task');
            }
        }.bind(this), 100);
    
        var studentId = $(this).data('student-id');
        $('.student-card').removeClass('selected-student');
        $(this).addClass('selected-student');
        updateTasksWithStudentFiles(studentId, resObj);
    });
});

    
$(document).ready(function () {
    setWelcomeMessage();
      
    $('#logout').click(function () {
        APICall({
            type: 'POST',
            url: 'logout',
            success: function (response) {
                var respObj = JSON.parse(response);
                if (HandleRedirect(respObj)) return;
            },
            error: function (error) {
                console.log(error);
            }
        });
    });
});