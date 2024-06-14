function regNotification(message) {
    const notification = $('<div>').addClass('notification registration-notification').text(message);

    notification.css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'z-index': '30',
        'text-align': 'center',
        'padding': '26px',
        'background-color': 'green', 
        'color': 'white',
    });

    $('body').append(notification);

    setTimeout(function () {
        notification.remove();
    }, 5000);
}

function regNotificationFail(message) {
    const notification = $('<div>').addClass('notification registration-fail-notification').text(message);

    notification.css({
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'z-index': '30',
        'text-align': 'center',
        'padding': '26px',
        'background-color': 'red', 
        'color': 'white',
    });

    $('body').append(notification);

    setTimeout(function () {
        notification.remove();
    }, 5000);
}

function regCancellationNotification(message) {
    const notification = $('<div>').addClass('notification registration-notification ').text(message);

    notification.css({
        'background-color': 'green',
        'color': 'white',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'z-index': '30',
        'text-align': 'center',
        'padding': '26px',
    });

    $('body').append(notification);

    setTimeout(function () {
        notification.remove();
    }, 5000);
};

function regCancellationNotificationFail(message) {
    const notification = $('<div>').addClass('notification registration-notification ').text(message);

    notification.css({
        'background-color': 'red',
        'color': 'white',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'width': '100%',
        'z-index': '30',
        'text-align': 'center',
        'padding': '26px',
    });

    $('body').append(notification);

    setTimeout(function () {
        notification.remove();
    }, 5000);
};

APICall({
    type: 'POST',
    url:  'get/user',
    data: {},
    success: function (response) {
        var userData = JSON.parse(response);
        sessionStorage.setItem('userData', 
        JSON.stringify(userData));
    },
    error: function(xhr, status, error) {
        console.error(xhr.responseText);
    }
});

function getSessionData(key) {
    var userData = sessionStorage.getItem(key);
    if (userData) {
        return JSON.parse(userData);
    } else {
        return null;
    }
}

function logout() {
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
}


function showModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.classList.add('is-active');

    var closeButton = modal.querySelector('.cancel-modal-btn');
    closeButton.addEventListener('click', function () {
        hideModal(modalId);
    });

    var modalBackground = modal.querySelector('.modal-background');
    modalBackground.addEventListener('click', function () {
        hideModal(modalId);
    });
}

function hideModal(modalId) {
    var modal = document.getElementById(modalId);
    modal.classList.remove('is-active');
}

function setProfileImage(userId) {
    var imagePath = "/License/sapi_uni_backend/api/pp/" + userId + ".jpg";
    $(".profile-image").attr("src", imagePath);
}

function APICall(params) {
    var apiLink = 
    '/~gi2021btr/License/sapi_uni_backend/api/v1/';
    var hostname = window.location.hostname;
    if (hostname === "localhost") {
        apiLink = 
        "/License/sapi_uni_backend/api/v1/";
    }
    params.url = apiLink + params.url;
    return $.ajax(params);
}

function HandleRedirect(respObj){
    if (typeof(respObj) == 'object' && typeof(respObj.redirect) != 'undefined') {
        switch (respObj.redirect) {
            case 'login':
                window.location.href = 'login.html';
                break;
            case 'all_courses':
                window.location.href = 'all_courses.html';
                break;
            case 'profile':
                window.location.href = 'profile.html';
                break;
            case 'calendar':
                window.location.href = 'calendar.html';
                break;
            case 'course':
                window.location.href = 'all_course.html';
                break;
            case 'editprofile':
                window.location.href = 'editprofile.html';
                break;
            case 'editprofile':
                window.location.href = 'editprofile.html';
                break;
            case 'forgotpassword':
                window.location.href = 'forgotpassword.html';
                break;
            case 'my_courses':
                window.location.href = 'my_courses.html';
                break;
            case 'register':
                window.location.href = 'reg.html';
            default:
                window.location.href = 'login.html';
                break;
        }
        return true;
    }

    return false;
}

function validateEmail(email) {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function setWelcomeMessage(){
    APICall({
        type: 'POST',
        url: 'get/user',
        data: {},
        success: function (response) {
            var userData = JSON.parse(response);
            $('#loggedin-username span').html(" Üdvözöljük, <br> " + userData.user_name);
        },
        error: function (error) {
            console.log(error);
        }
    });
}

function getFileIconClass(filename) {
    if (filename.endsWith('.docx')) {
        return 'fa fa-file-word-o';
    } else if (filename.endsWith('.pdf')) {
        return 'fa fa-file-pdf-o';
    } else if (filename.endsWith('.xls') || 
    filename.endsWith('.xlsx') || 
    filename.endsWith('.xlsm')) {
        return 'fa fa-file-excel-o';
    } else if (filename.endsWith('.ppt') || 
    filename.endsWith('.pptx')) {
        return 'fa fa-file-powerpoint-o';
    } else {
        return 'fa fa-file';
    }
}

function moduleAccordion() {
    $('#modulesList').off('click', '.module').on('click', '.module', function(event) {
        event.stopPropagation();
        
        const parentModule = $(this).closest('.parent');
        const moduleDescription = parentModule.find('.description');
        const arrowIcon = $(this).find('.fa-arrow-down');

        if (parentModule.hasClass('active')) {
            parentModule.removeClass('active');
            arrowIcon.removeClass('rotated');
            moduleDescription.slideUp('slow');
        } else {
            $('#modulesList .parent.active').removeClass('active').find('.fa-arrow-down').removeClass('rotated');
            $('#modulesList .parent.active').find('.description').slideUp('slow');

            parentModule.addClass('active');
            arrowIcon.addClass('rotated');
            moduleDescription.slideDown('slow');
        }
    });
}

function taskAccordion() {
    $('#modulesList').off('click', '.task').on('click', '.task', function(event) {
        event.stopPropagation();
        
        const taskDescription = $(this).find('.taskdescription');
        const arrowIcon = $(this).find('.fa-arrow-down');

        if ($(this).hasClass('active')) {
            $(this).removeClass('active');
            arrowIcon.removeClass('rotated');
            taskDescription.slideUp('slow');
        } else {
            $(this).addClass('active');
            arrowIcon.addClass('rotated');
            taskDescription.slideDown('slow');
        }
    });
}

function displayModaleNotification(message, bgColor) {
    const notification = $('<div>', {
        class: 'notification m_notification is-hidden has-text-centered',
        style: 'background-color: ' + bgColor + '; color: aliceblue;'
    });

    const messageSpan = $('<span>', {
        class: 'm_notification-message',
        text: message
    });

    notification.append(messageSpan);

    const modalBackground = $('.modal.is-active .modal-background').first();
    if (modalBackground.length) {
        modalBackground.append(notification);
    } else {
        $('body').append(notification);
    }

    notification.removeClass('is-hidden');

    setTimeout(function() {
        notification.addClass('is-hidden');
        notification.remove();
    }, 3000);
}



function validateInputLength(titleInput, descInput) {
    const titleLength = $(titleInput).val().length;
    const descLength = $(descInput).val().length;

    if (titleLength < 5) {
        displayModaleNotification('A kurzus neve legalább 5 karakter hosszú kell legyen.', 'red');
        return false;
    }

    if (descLength < 20) {
        displayModaleNotification('A kurzus leírása legalább 20 karakter hosszú kell legyen.', 'red');
        return false;
    }

    return true;
}

function displayNotification(message, color) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const notification = $('#notification');
    notification.removeClass('is-hidden').
    css('background-color', color === 'green' ? '#008000' : 'FF0000');
    $('#notification-message').text(message);
    notification.show();
    setTimeout(function() {
        notification.hide().addClass('is-hidden');
    }, 3000);
}
$(document).ready(function() {
    setWelcomeMessage();
    
    $('#logout').click(function() {
        logout(); 
    });
    
});
