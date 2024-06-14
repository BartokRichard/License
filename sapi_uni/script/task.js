const taskObject = {
    taskId: null,
    currentModuleId: null,
    selectedFile: null,

renderTask: function(task, moduleId) {
    const taskElement = $(`
        <div class="task_parent" id="t_${task.t_id}" >
            <div data-id="${task.t_id}" class="box task mt-3" style="color: rgb(0, 0, 0); width: 100%">
                ${task.task_name}
                <i class="fa fa-arrow-down" aria-hidden="true"></i>
                <div class="box no-border taskdescription" style="color: rgb(0, 0, 0); width: 100%">
                    <p>${task.desc}</p>
                    <div class="teacher-uploaded-files"></div>
                    ${task.student_files.length > 0 ? '<hr style="border:2px dashed black; margin-top: 20px;">' : ''}
                    <div class="student-uploaded-files"></div>
                    <div class="task-buttons" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="button is-success upload-file-btn" style="margin-top: 20px;">
                            <i class="fa fa-upload" aria-hidden="true"></i> <b>Feltöltés</b>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    $(`.module-tasks[data-mid="${moduleId}"]`).append(taskElement);
    this.renderFiles(task.files, taskElement.find('.teacher-uploaded-files'));
    this.renderStudentFiles(task.student_files, taskElement.find('.student-uploaded-files'));

    // Eseménykezelő a feltöltés gombra
    taskElement.find('.upload-file-btn').on('click', () => {
        this.taskId = task.t_id;
        this.currentModuleId = moduleId;
        showModal('fileUploadModal');
    });

    if (courseObject.userData.user_role === 1 && courseObject.userData.teacher_courses.includes(parseInt(courseObject.courseId, 10)) || courseObject.userData.user_role === 2) {
        const deleteTaskButton = `
            <div class="button is-danger delete-task-btn" style="margin-top: 20px;">
                <i class="fa fa-times" aria-hidden="true"></i> <b>Feladat Törlés</b>
            </div>
        `;
        taskElement.find('.task-buttons').append(deleteTaskButton);
        taskElement.find('.delete-task-btn').on('click', this.deleteTask.bind(this));
    }
    },

    renderFiles: function(files, container) {
        files.forEach(file => {
            const iconClass = getFileIconClass(file.filename);
            let deleteButton = '';

            console.log('teacher courses',courseObject.userData.teacher_courses);
            console.log('courseid', courseObject.courseId);
            if (courseObject.userData.user_role === 1 && courseObject.userData.teacher_courses.includes(parseInt(courseObject.courseId, 10)) || courseObject.userData.user_role === 2) {
                deleteButton = 
                '<i class="fa fa-times" style="cursor: pointer; color: red; top: -20px; left: 55%; position: absolute;"></i>';
                ;
            }

            const fileContainer = $('<div>').addClass('file-container').css('position', 'relative');
            const fileDiv = $('<div>')
                .attr('data-id', file.f_id)
                .addClass('file')
                .css({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                }).append($('<i>').addClass(iconClass).attr('aria-hidden', 'true'));

            if (deleteButton) {
                fileDiv.append(deleteButton);
            }

            const fileNameP = $('<p>').css({
                maxWidth: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }).text(file.filename);

            fileContainer.append(fileDiv).append(fileNameP);
            container.append(fileContainer);
        
        });
        this.setupFileDeleteActions();
    },
    

    renderStudentFiles: function(files, container) {
        files.forEach(file => {
            const iconClass = getFileIconClass(file.file_name);
            let deleteButtonHtml = '';
            if (courseObject.userData.user_role === 0) {
                deleteButtonHtml = '<i class="fa fa-times" style="cursor: pointer; color: red; top: -20px; left: 55%; position: absolute;"></i>';
            }
            const studentFileContainer = $(`
                <div class="file-container" style="position: relative; width: 100%; margin-bottom: 10px;">
                    <div data-id="${file.uuid}" class="student-file" style="display: flex; justify-content: center; cursor: pointer; position: relative;">
                        <i class="${iconClass}" aria-hidden="true" style="z-index: 1;"></i>
                        ${deleteButtonHtml}
                    </div>
                    <p style="max-width: calc(100% - 20px);">${file.file_name}</p>
                </div>
            `);

            container.append(studentFileContainer);
        });
    },

    setupTaskActions: function() {
        taskAccordion();
        var self = this;
        $('.delete-task-btn').on('click', this.deleteTask.bind(this));
        $('.grade-module-btn').on('click', this.gradeModule.bind(this));
        $('.submit-task-btn').on('click', this.submitTask.bind(this));
        $('#createTaskBtn').on('click', this.createTask.bind(this));

        // Eseménykezelő a fájl beviteli mező változására
        $('#fileUploadInput').on('change', function(event) {
            self.selectedFile = event.target.files[0];
            $('.file-name').text(self.selectedFile ? self.selectedFile.name : 'Nincs fájl kiválasztva');
        });

        $('#uploadFileBtn').off().on('click', function() {
            self.uploadFile(self.taskId, courseObject.courseId, self.currentModuleId, self.selectedFile);
        });
    },

    deleteTask: function(event) {
        const taskId = $(event.currentTarget).closest('.task_parent').attr('id').split('_')[1];
        $('#confirmationTaskModal').addClass('is-active');
        $('#confirm_delete_task').off();
        $('#confirm_delete_task').on('click', function () {
            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('teacherCourses', courseObject.userData.teacher_courses);
            formData.append('courseId', courseObject.courseId);

            APICall({
                type: 'POST',
                url: 'delete/task',
                data: formData,
                contentType: false,
                processData: false,
                success: function (response) {
                    const respObj = JSON.parse(response);
                    if (respObj.success) {
                        displayNotification(respObj.message, 'green');
                        setTimeout(function() {
                            window.location.reload(true);
                        }, 3000);
                    } else {
                        displayNotification(respObj.message, 'red');
                    }
                },
                error: function (error) {
                    displayNotification('Error deleting task', 'red');
                }
            });
            $('#confirmationTaskModal').removeClass('is-active');
        });

        $('#cancel-delete-task-btn').on('click', function () {
            $('#confirmationTaskModal').removeClass('is-active');
        });
    },

    uploadFile: function(taskId, courseId, moduleId, file) {
        if (!file) {
            displayModaleNotification('Nincs fájl kiválasztva!', 'red');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('taskId', taskId);
        formData.append('courseId', courseId);
        formData.append('moduleId', moduleId);

        APICall({
            type: "POST",
            url: "upload/file",
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
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
            error: function(error) {
                displayModaleNotification('Hiba a feltöltés során!', 'red');
            }
        });
    },

    setupFileDeleteActions: function() {
        $('.file-container .fa-times').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
    
            const fileId = $(this).closest('.file-container').find('.file, .student-file').data('id');
            const isStudentFile = $(this).closest('.student-file').length > 0;
    
            $('#fileDeleteModal').addClass('is-active');
    
            $('#cancelDeleteFile, .modal-background').click(function() {
                $('#fileDeleteModal').removeClass('is-active');
            });
    
            $('.deleteConfirmFile').click(function() {
                console.log('igen')
                APICall({
                    url:  'delete/file',
                    type: 'POST',
                    data: { 
                        file_id: fileId, 
                        course_id: courseObject.courseId 
                    },
                    success: function(response) {
                        console.log(response)
                        const result = JSON.parse(response);
                        console.log(result);
                        if (result.success) {
                            displayModaleNotification(result.message, 'green');
                            setTimeout(function() {
                                window.location.reload(true);
                            }, 3000);
                        } else {
                            displayModaleNotification(result.message, 'red');
                        }
                        $('#fileDeleteModal').removeClass('is-active');
                    },
                    error: function(xhr, status, error) {
                        console.error("Törlési hiba: ", error);
                        $('#fileDeleteModal').removeClass('is-active');
                    }
                });
            });
        });
    },
    

    createTask: function() {
        const taskTitle = $('#taskName').val();
        const taskDescription = $('#taskDescription').val();
        const taskDeadline = $('#taskDeadline').val();
        const fileInput = document.getElementById('taskFileInput');

        if (!validateInputLength('#taskName', '#taskDescription')) {
            return;
        }

        const formData = new FormData();
        formData.append('courseId', courseObject.courseId);
        formData.append('moduleId', this.currentModuleId);
        formData.append('teacherCourses', courseObject.userData.teacher_courses);
        formData.append('taskTitle', taskTitle);
        formData.append('taskDescription', taskDescription);
        formData.append('taskDeadline', taskDeadline);

        const self = this;

        APICall({
            type: 'POST',
            url: 'create/task',
            data: formData,
            contentType: false,
            processData: false,
            success: function (response) {
                const respObj = JSON.parse(response);
                if (respObj.success) {
                    self.taskId = respObj.taskId;
                    showModal('fileUploadModal');
                    $('#uploadFileBtn').off().off('click').on('click', function() {
                        self.uploadFile(self.taskId, courseObject.courseId, self.currentModuleId, fileInput.files[0]);
                    });
                } else {
                    displayModaleNotification(respObj.message, 'red');
                }
            },
            error: function (error) {
                console.error(error);
                displayModaleNotification('Error creating task', 'red');
            }
        });
    },

    gradeModule: function(event) {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
        if (moduleId) {
            window.location.href = 'grading.html?module_id=' + moduleId;
        } else {
            console.error('Module ID not found.');
        }
    },

    submitTask: function() {
        const moduleId = $(event.currentTarget).closest('.parent').data('id');
        $('#confirmSubmitModal').addClass('is-active');

        $('#confirm_submit_module').off().on('click', function () {
            APICall({
                type: "POST",
                url: 'submit/module',
                data: { module_id: moduleId, course_id: courseObject.courseId },
                success: function (response) {
                    const respObj = JSON.parse(response);
                    if (respObj.success) {
                        displayNotification(respObj.message, 'green');
                        setTimeout(function() {
                            $('#confirmSubmitModal').removeClass('is-active');
                        }, 3000);
                    } else {
                        displayNotification(respObj.message, 'red');
                    }
                },
                error: function (error) {
                    displayNotification('Error submitting module', 'red');
                }
            });
        });

        $('#cancel-submit-module-btn, #confirmSubmitModal .modal-background').on('click', function () {
            $('#confirmSubmitModal').removeClass('is-active');
        });
    }
};

// Initialize taskObject when document is ready
$(document).ready(function() {
    taskObject.setupTaskActions();
});
