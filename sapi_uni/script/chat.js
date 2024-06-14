const chatObject = {
    updateChat: function() {
        APICall({
            url: 'get/messages',
            type: 'GET',
            data: { course_id: courseObject.courseId },
            success: function(response) {
                const resp = JSON.parse(response);
                if (resp.success) {
                    $('#messages').empty();
                    resp.messages.forEach(msg => {
                        const messageContainer = $('<div>').addClass('message-container');
                        let messageBox;
                    
                        if (msg.userRole === 0) {
                            messageBox = $('<div>').addClass
                            ('student-message-box is-pulled-right')
                                .append($('<p>').text(msg.message));
                        } else if (msg.userRole === 1) {
                            messageBox = $('<div>').addClass
                            ('teacher-message-box is-pulled-left').append
                            ($('<p>').html
                            ('<strong class="teacher-name-chat">' 
                            + msg.userName + ': </strong><br>' + msg.message));
                        }
                    
                        messageContainer.append(messageBox);
                        $('#messages').append(messageContainer);
                    });

                    $('.input').val('');
                } else {
                    console.error('Error fetching messages: ' + response.error);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error in AJAX request: ' + error);
            }
        }).done(function(data) {
            if (!data.success && data.redirect) {
                window.location.href = data.redirect;
            }
        });
    },

    setupChat: function() {
        if (courseObject.userData.user_role === 0) {
            const chatBtn = 
            '<button class="button chat-button is-rounded is-large"' +
            'id="chat-toggle-button">Chat</button>';
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
            const messageInput = $("#msg-inp").val().trim();
            if (messageInput.length === 0) {
                $("#msg-inp").val('');
                return;
            }

            const dataToSend = {
                courseId: courseObject.courseId,
                userId: courseObject.userData.user_id,
                userRole: courseObject.userData.user_role,
                student_courses: courseObject.userData.student_courses,
                userName: courseObject.userData.user_name,
                message: messageInput
            };

            APICall({
                url: "upload/message",
                type: "POST",
                data: { dataToSend },
                success: function(response) {
                    const resp = JSON.parse(response);
                    if (resp.success) {
                        chatObject.updateChat();
                    }
                }
            });
        });
    }
};

// Initialize chatObject when document is ready
$(document).ready(function() {
    chatObject.updateChat();
    chatObject.setupChat();
});
