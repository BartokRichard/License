const courseObject = {
    courseId: null,
    userData: null,

    init: function() {
        this.userData = getSessionData('userData'); // Felhasználói adatok betöltése
        this.courseId = new URLSearchParams(window.location.search).get('course_id'); // Kurzus azonosító lekérése az URL-ből

        // Üres felhasználüi adatok, hiba kezelése
        if (!this.userData || $.isEmptyObject(this.userData)) {
            console.error('Not logged in');
            window.location.href = 'login.html';
        }

        if (!this.courseId) {
            console.error('Course not found');
            window.location.href = 'all_courses.html';
        }

        this.loadCourse();
        this.setProfileImage();
        this.setupCourseButtons();
    },

    // Profilkép beállítása
    setProfileImage: function() {
        setProfileImage(this.userData.user_id);
    },

    // Kurzus adatok betöltése
    loadCourse: function() {
        const courseId = this.courseId;
        APICall({
            type: "GET",
            url: "load/courses/one?course_id=" + courseId,
            success: function (response) {
                const course = JSON.parse(response);
                $('#loader').hide();
                $('.course_name').text(course.name);
                $('.course_title').text(course.name);
                $('.course_description').text(course.desc);
                $('.teacher-name').text(course.teacher_name);
                moduleObject.renderModules(course.modules); 
                courseObject.setupFileActions(); 
                courseObject.setupTeacherActions(course); 
                courseObject.setupCourseActions(); 
                moduleAccordion(); 
                taskAccordion(); 
            },
            error: function (error) {
                $('#loader').hide();
                $('#error').show().html('A kurzus nem található');
            }
        });
    },

    // Gombok beállítása a szerepkörének megfelelően
    setupCourseButtons: function() {
        const userRole = this.userData.user_role;
        const courseId = this.courseId;

        // Tanári gombok beállítása
        if (userRole === 1 && this.userData.teacher_courses.includes(parseInt(courseId)) || userRole === 2) {
            const buttonsHtml = `
                <a class='button is-danger mt-6' id='remove-course-btn' data-target='modaly-image2'><b><i class="fa fa-remove"></i>Kurzus Törlése</b></a>
                <a class='button is-link mt-6' id='create-module-btn' data-target='modal-image2'><b><i class="fa fa-plus"></i>Modul Létrehozása</b></a>
                <a class='button is-link mt-6 course-edit-btn'><b><i class="fa fa-edit"></i>Kurzus Szerkesztése</b></a>
            `;
            $('.action_buttons').append(buttonsHtml);
            this.setupTeacherButtonActions();
        }

        // Diák gombok beállítása
        if (userRole === 0) {
            if (this.userData.student_courses.includes(courseId)) {
                const studentButtonsHtml = `
                    <a class='button is-danger course-cancellation-btn' style='display: none;'>Kurzus Lemondása</a>
                `;
                $('.action_buttons').append(studentButtonsHtml);
                $('.course-cancellation-btn').show(); // Kurzus lemondása gomb megjelenítése
            } else {
                const studentButtonsHtml = `
                    <a class='button is-success course-registration-btn' style='display: none;'>Kurzus Felvétele</a>
                `;
                $('.action_buttons').append(studentButtonsHtml);
                $('.course-registration-btn').show(); // Kurzus felvétele gomb megjelenítése
            }
        }
    },

    // Kurzushoz tartozó eseménykezelők beállítása
    setupCourseActions: function() {
        const courseId = this.courseId;
        const userRole = this.userData.user_role;

        if (userRole === 0) {
            // Kurzus felvétele
            $('.course-registration-btn').on('click', function () {
                APICall({
                    type: "POST",
                    url: "course/registration",
                    data: { courseId: courseId },
                    success: function (response) {
                        const result = JSON.parse(response);
                        if (result.success) {
                            regNotification(result.message);
                            $('.course-registration-btn').hide();
                            $('.course-cancellation-btn').show();
                            setTimeout(function() {
                                location.reload();
                            }, 3000);
                        } else {
                            regNotificationFail(result.message);
                        }
                    },
                    error: function (error) {
                        console.log(error);
                    }
                });
            });

            // Kurzus lemondása
            $('.course-cancellation-btn').on('click', function () {
                APICall({
                    type: 'POST',
                    url: 'delete/registration',
                    data: { courseId: courseId },
                    success: function (response) {
                        const result = JSON.parse(response);
                        if (result.success) {
                            $('.course-cancellation-btn').hide();
                            $('.course-registration-btn').show();
                            regCancellationNotification
                                (result.message);
                            setTimeout(function() {
                                location.reload();
                            }, 3000);
                        } else {
                            regCancellationNotificationFail
                            (result.message);
                        }
                    },
                    error: function (error) {
                        console.log("AJAX error:", error);
                    }
                });
            });
        }
    },

    // Tanári gombok eseménykezelőinek beállítása
    setupTeacherButtonActions: function() {
        $('#remove-course-btn').on('click',
        this.showRemoveCourseModal.bind(this));
        $('#create-module-btn').on('click',
        moduleObject.createModule.bind(moduleObject));
        $('.course-edit-btn').on('click',
        this.editCourse.bind(this));
    },

    // Fájl letöltés eseménykezelőinek beállítása
    setupFileActions: function() {
        $('#modulesList').on('click', '.file', function(event) {
            event.stopPropagation();
            const fileId = $(this).data('id');
            window.location.href = '/licence/sapi_uni_backend/api/v1/' + "get/file?file_id=" + fileId;
        });

        $('#modulesList').on('click', '.student-file', function(event) {
            event.stopPropagation();
            const fileId = $(this).data('id');
            window.location.href = '/licence/sapi_uni_backend/api/v1/' + "get/student/file?file_id=" + fileId;
        });
    },

    // Tanári műveletek beállítása a modulokhoz és feladatokhoz
    setupTeacherActions: function(course) {
        setTimeout(function() {
            moduleObject.setupModuleActions(); 
            taskObject.setupTaskActions(); 
        }, 100);
    },

    // Kurzus törlés dialog ablak megjelenítése
    showRemoveCourseModal: function() {
        $('#confirmationModal').addClass('is-active');
        $('#confirmationModal .modal-background, #cancel-delete-course-btn').on('click', function () {
            $('#confirmationModal').removeClass('is-active');
        });

        $('#confirmationModal .modal-confirm').on('click', this.removeCourse.bind(this));
    },

    // Kurzus törlése
    removeCourse: function() {
        const courseId = this.courseId;
        $('#confirmationModal').removeClass('is-active');
        
        APICall({
            type: 'POST',
            url: 'delete/course',
            data: {
                courseId: courseId,
                teacherCourses: courseObject.userData.teacher_courses
            },
            success: function (response) {
                const result = JSON.parse(response);
                if (result.success) {
                    displayNotification(result.message, 'green');
                    setTimeout(function () {
                        window.location.href = 'all_courses.html';
                    }, 3000);
                } else {
                    displayNotification(result.message, 'red');
                }
            },
            error: function () {
                displayNotification('Error deleting course', 'red');
            }
        });

       
    },

    // Kurzus szerkesztése dialog ablak megjelenítése
    editCourse: function() {
        $('#editCourseModal').addClass('is-active');

        const editedTitle = $('.course_name').text().trim();
        const editedDescription = $('.course_description').text().trim();

        // Ensure the title is only set once
        $('#editCourseTitle').val(editedTitle).off('input');
        $('#editCourseDescription').val(editedDescription);
        $('#editCourseTitleCount').text(`${editedTitle.length}/50`);
        $('#editCourseDescCount').text(`${editedDescription.length}/200`);

        $('#editCourseModal .modal-background, #cancel-edit-course-btn').on('click', function () {
            $('#editCourseModal').removeClass('is-active');
        });

        $('#editCourseTitle, #editCourseDescription').on('input', function() {
            const maxLength = $(this).attr('maxlength');
            const inputLength = $(this).val().length;
            const counterId = $(this).attr('id') + 'Count';
            $('#' + counterId).text(inputLength + '/' + maxLength);
        });

        APICall({
            url: 'get/teachers',
            type: 'GET',
            data: { course_id: this.courseId },
            success: function(data) {
                var teachersDropdown = $('#editCourseTeacher');
                teachersDropdown.empty(); 
                teachersDropdown.append($('<option>', {
                    value: '',
                    text: 'Tanár Kiválasztása'
                }));
                data.forEach(function(teacher) {
                    teachersDropdown.append($('<option>', {
                        value: teacher.id,
                        text: teacher.name
                    }));
                });
            },
            error: function(xhr, status, error) {
                console.error("Error loading teachers: ", error);
            }
        });

        $('#edit-course-btn').off();
        $('#edit-course-btn').on('click', function () {
            if (!validateInputLength('#editCourseTitle', '#editCourseDescription')) {
                return;
            }

            const editedTitle = $('#editCourseTitle').val();
            const editedDescription = $('#editCourseDescription').val();
            const editedAssignedTeacher = $('#editCourseTeacher').val();
            const editedDeadline = $('#editCourseDeadline').val();

            const dataToSend = {
                courseId: courseObject.courseId,
                teacherCourses: courseObject.userData.teacher_courses
            };

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
                    displayModaleNotification('Error editing course', 'red');
                }
            });
        });
    },

};

// Inicializálás, amikor az oldal betöltődött
$(document).ready(function() {
    courseObject.init();
});
