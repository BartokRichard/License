const moduleObject = {
    // Modulok renderelése
    renderModules: function(modules) {
        APICall({
            type: "GET",
            url: "get/grades",
            data: {
                course_id: courseObject.courseId
            },
            success: function(response) {
                const grades = JSON.parse(response);
                modules.forEach(module => {
                    const moduleListItem = $('<li>');
                    const moduleDeadline = `<span class="deadline">Határidő:
                     ${module.deadline}</span>`; 
                    const moduleGrade = courseObject.userData.user_role === 0 ? 
                    `<span class="grade">Osztályzat: 
                    ${grades[module.m_id]  || "---"}</span>` : '';
                    // Modul leadása gomb hozzáadása dițákoknak
                    const studentModuleButtons = courseObject.userData.user_role === 0 ? `
                        <a class="button is-info submit-module-btn" 
                        style="margin-top: 20px;">
                            <i class="mr-3 fa fa-check-square-o" aria-hidden="true"></i>
                            <b>Leadás Osztályozásra</b> 
                        </a> ` : '';

                    moduleListItem.append(`
                        <div class='parent' data-id="${module.m_id}">
                            <div class="box mb-2 module" style="color: rgb(0, 0, 0); width: 100%; position: relative;
                            display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center;">
                                    <i class="fa fa-arrow-down" aria-hidden="true" style="margin-right: 10px;"></i>
                                    <strong>${module.name}</strong>
                                </div>
                                <div>
                                    ${moduleDeadline}
                                    ${moduleGrade}
                                </div>
                            </div>
                            <div class="box description mb-6" style="color: rgb(0, 0, 0); width: 100%">
                                <p>${module.desc}</p>
                                <h3 class="m-3 module-tasks " data-mid="${module.m_id}">
                                    <b>Feladatok: </b>
                                </h3>
                                <div class="buttons module-buttons">
                                    ${courseObject.userData.user_role === 1 || courseObject.userData.user_role == 2 ? `
                                        <a class='button is-link mt-6 edit-module-btn'><b><i class="fa fa-edit"></i>Modul Szerkesztése</b></a>
                                        <a class='button is-link mt-6 add-task-btn'><b><i class="fa fa-plus"></i>Feladat Létrehozása</b></a>
                                        <a class='button is-danger mt-6 delete-module-btn'><b><i class="fa fa-remove"></i>Modul Törlése</b></a>
                                        <a class='button is-success mt-6 grade-module-btn'><b><i class="fa fa-check-square"></i>Modul Kiértékelése</b></a>
                                    ` : ''}
                                    ${studentModuleButtons}
                                </div>
                            </div>
                        </div>
                    `);
                    $('#modulesList').append(moduleListItem);

                    module.tasks.forEach(task => {
                        taskObject.renderTask(task, module.m_id);
                    });

                    moduleListItem.find('.upload-file-btn').on('click', function(event) {
                        event.stopPropagation();
                        showModal('fileUploadModal');
                        moduleId = $(this).closest('.parent').data('id');

                        const taskElement = $(this).closest('.task');

                        currentTaskId = taskElement.data('id');

                        $('#fileUploadInput').on('change', function() {
                            const fileName = $(this).val().split('\\').pop();
                            $('.file-name').text(fileName);
                        });
                    });
                });

                moduleObject.setupModuleActions();
                taskObject.setupTaskActions();
            },
            error: function(error) {
                console.error("Error fetching grades:", error);
            }
        });
    },

    // Modul műveletek beállítása
    setupModuleActions: function() {
        moduleAccordion();
        // Tanári műveletek eseménykezelőinek beállítása
        if (courseObject.userData.user_role == 1 && courseObject.userData.teacher_courses.includes(parseInt(courseObject.courseId)) || courseObject.userData.user_role === 2) {
            $('.edit-module-btn').on('click', 
            this.editModule.bind(this));
            $('.delete-module-btn').on('click', 
            this.showDeleteModuleModal.bind(this));
            $('.add-task-btn').on('click', 
            this.addTask.bind(this));
            $('.grade-module-btn').on('click', 
            this.gradeModule.bind(this));
        }

        // Diákok műveleteinek eseménykezelői
        if (courseObject.userData.user_role === 0) {
            $('.submit-module-btn').on('click', 
            this.submitModule.bind(this));
        }
    },

    // Modul létrehozása
    createModule: function() {
        $('#createModuleModal').addClass('is-active');
        $('#createModuleModal .modal-background', 
        '#cancel-create-module-btn').on('click', function () {
            $('#createModuleModal').removeClass('is-active');
        });

        $('#moduleName, #moduleDescription')
        .off('input').on('input', function() {
            const maxLength = $(this).attr('maxlength');
            const inputLength = $(this).val().length;
            const counterId = $(this).attr('id') + 'Count';
            $('#' + counterId).text(`${inputLength}/${maxLength}`);
        });

        $('#create-module-btn-confirm').off().on('click', function () {
            if (!validateInputLength('#moduleName', '#moduleDescription')) {
                displayModaleNotification(
                    'A modulnak kell neve és leírása legyen', 'red'
                );
            }
            const moduleName = $('#moduleName').val();
            const moduleDeadline = $('#moduleDeadline').val();
            const moduleDescription = $('#moduleDescription').val();

            APICall({
                type: 'POST',
                url: 'create/module',
                data: {
                    moduleName: moduleName,
                    moduleDeadline: moduleDeadline,
                    moduleDescription: moduleDescription,
                    teacherCourses: 
                    courseObject.userData.teacher_courses,
                    courseId: courseObject.courseId,
                },
                success: function (response) {
                    const respObj = JSON.parse(response);
                    if (respObj.success) {
                        displayModaleNotification(
                            respObj.message, 'green'
                        );
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    } else {
                        displayModaleNotification(respObj.message, 'red');
                    }
                },
                error: function (error) {
                    displayModaleNotification('Error creating module', 'red');
                }
            });
        });
    },

    // Modul szerkesztése
    editModule: function(event) {
        const moduleId = $(event.currentTarget).closest
        ('.parent').data('id');
        const moduleName = $(event.currentTarget).closest
        ('.parent').find('.module strong').text().trim();
        const moduleDescription = $(event.currentTarget).closest
        ('.parent').find('.box.description p').text().trim();

        $('#editModuleName').val(moduleName);
        $('#editModuleDescription').val(moduleDescription);
        $('#editModuleModal').attr('data-id', moduleId).addClass('is-active');

        $('#editModuleModal .modal-background', 
        '#cancel-edit-module-btn').on('click', function () {
            $('#editModuleModal').removeClass('is-active');
        });

        $('#editModuleName', 
        '#editModuleDescription').off('input').on('input', function() {
            const maxLength = $(this).attr('maxlength') || 50;
            const inputLength = $(this).val().length;
            const counterId = $(this).attr('id') + 'Count';
            $('#' + counterId).text(`${inputLength}/${maxLength}`);
        });

        $('#edit-module-confirm-btn').off().on('click', function () {
            if (!validateInputLength('#editModuleName', 
            '#editModuleDescription')) {
                return;
            }
            const editedModuleName = $('#editModuleName').val();
            const editedModuleDescription = $('#editModuleDescription').val();
            const editedModuleDeadline = $('#editModuleDeadline').val();

            APICall({
                type: 'POST',
                url: 'edit/module',
                data: {
                    moduleId: moduleId,
                    courseId: courseObject.courseId,
                    moduleName: editedModuleName,
                    moduleDescription: 
                    editedModuleDescription,
                    moduleDeadline: 
                    editedModuleDeadline
                },
                success: function (response) {
                    if (response.success) {
                        displayModaleNotification(
                            response.message, 'green'
                        );
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    } else {
                        displayModaleNotification(
                            response.message, 'red'
                        );
                    }
                },
                error: function (error) {
                    displayModaleNotification('Error editing module', 'red');
                }
            });
        });
    },

    // Modul törlésének megerősítése modal megjelenítése
    showDeleteModuleModal: function(event) {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
        $('#confirmationModuleModal').data('moduleId', moduleId).addClass('is-active');

        $('#confirmationModuleModal .modal-background, #cancel-delete-module-btn').off().on('click', function () {
            $('#confirmationModuleModal').removeClass('is-active');
        });

        $('#confirm_delete_module').off().on('click', this.deleteModule.bind(this));
    },

    // Modul törlése
    deleteModule: function() {
        const moduleId = $('#confirmationModuleModal').data('moduleId');
        console.log("Deleting module ID:", moduleId);

        APICall({
            type: 'POST',
            url: 'delete/module',
            data: {
                courseId: courseObject.courseId,
                moduleId: moduleId
            },
            success: function (response) {
                const respObj = JSON.parse(response);
                if (respObj.success) {
                    displayModaleNotification(respObj.message, 'green');
                    setTimeout(function() {
                        window.location.reload(true);
                    }, 3000);
                } else {
                    displayModaleNotification(respObj.message, 'red');
                }
            },
            error: function (error) {
                displayModaleNotification('Error deleting module', 'red');
            }
        });
    },

    // Új feladat hozzáadása
    addTask: function(event) {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
    
        $('#createTaskModal').addClass('is-active');
        $('#createTaskModal .modal-background, #cancel-add-task-btn').on('click', function () {
            $('#createTaskModal').removeClass('is-active');
        });
    
        // Add event listener for task name input field
        $('#taskName').off('input').on('input', function() {
            const maxLength = $(this).attr('maxlength');
            const inputLength = $(this).val().length;
            $('#taskNameCount').text(`${inputLength}/${maxLength}`);
        });
    
        // Add event listener for task description input field
        $('#taskDescription').off('input').on('input', function() {
            const maxLength = $(this).attr('maxlength');
            const inputLength = $(this).val().length;
            $('#taskDescriptionCount').text(`${inputLength}/${maxLength}`);
        });
    
        $('#createTaskBtn').off().on('click', function () {
            if (!validateInputLength('#taskName', '#taskDescription')) {
                return;
            }
    
            const taskName = $('#taskName').val();
            const taskDescription = $('#taskDescription').val();
            const taskDeadline = $('#taskDeadline').val();
    
            APICall({
                type: 'POST',
                url: 'create/task',
                data: {
                    courseId: courseObject.courseId,
                    moduleId: moduleId,
                    taskName: taskName,
                    taskDescription: taskDescription,
                    taskDeadline: taskDeadline
                },
                success: function (response) {
                    const respObj = JSON.parse(response);
                    if (respObj.success) {
                        displayModaleNotification(respObj.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    } else {
                        displayModaleNotification(respObj.message, 'red');
                    }
                },
                error: function (error) {
                    displayModaleNotification('Error creating task', 'red');
                }
            });
        });
    },

    // Modul kiértékelése
    gradeModule: function(event) {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
        if (moduleId) {
            window.location.href = 'grading.html?module_id=' + moduleId;
        } else {
            console.error('Module ID not found.');
        }
    },

    // Modul leadása osztályozásra (diákoknak)
    submitModule: function(event) {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
        $('#confirmSumitModal').addClass('is-active');
        $('#confirm_submit_module').off().on('click', function() {
            APICall({
                type: "POST",
                url: 'submit/module',
                data: {
                    module_id: moduleId,
                    course_id: courseObject.courseId        
                },
                success: function(response) {
                    const result = JSON.parse(response);
                    if (result.success) {
                        displayModaleNotification(result.message, 'green');
                        setTimeout(function() {
                            $('#confirmSumitModal').removeClass('is-active');
                            window.location.reload(true);
                        }, 3000);
                    } else {
                        displayModaleNotification(result.message, 'red');
                    }
                },
                error: function(error) {
                    displayModaleNotification
                    ('Error submitting module', 'red');
                }
            });
        });
        $('#cancel-submit-module-btn, #confirmSumitModal .modal-background')
        .on('click', function() {
            $('#confirmSumitModal').removeClass('is-active');
        });
    }
};

// Inicializálás, amikor az oldal betöltődött
$(document).ready(function() {
    moduleObject.setupModuleActions();
});
