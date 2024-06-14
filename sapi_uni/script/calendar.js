
var currYear, currMonth;
userData = getSessionData('userData');
setProfileImage(userData.user_id);

function getSessionData(key) {
    return JSON.parse(sessionStorage.getItem(key) || "null");
}

function fetchEventsAndRenderCalendar() {
    let userData = getSessionData('userData');
    if (!userData) {
        console.error('User data is not available.');
        return;
    }

    APICall({
        type: 'GET',
        url: 'get/events',
        success: function (events) {
            let eventsMap = {};
            events.forEach(event => {
                let dateOnly = event.event_date.split(' ')[0]; // Get date part only
                eventsMap[dateOnly] = event.event_name;
            });
            renderCalendar(eventsMap);
        },
        error: function(xhr) {
            console.error('Error fetching events:', xhr.responseText);
        }
    });
}

function renderCalendar(events) {
    const daysTag = $(".days");
    const currentDateDisplay = $(".current-date");
    let daysInMonth = new Date(currYear, currMonth + 1, 0).getDate();
    let firstDayOfMonth = new Date(currYear, currMonth, 1).getDay();
    firstDayOfMonth = firstDayOfMonth === 0 ? 7 : firstDayOfMonth; // Adjust if first day is Sunday to Monday start

    let today = new Date();
    let todayFormatted = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`.replace(/-(\d)\b/g, '-0$1'); // Format today's date as yyyy-mm-dd

    let html = '';
    for (let i = 1; i < firstDayOfMonth; i++) {
        html += "<li class='inactive'></li>"; // Fill in the blanks before the first day
    }
    for (let day = 1; day <= daysInMonth; day++) {
        let fullDate = `${currYear}-${currMonth + 1}-${day}`.replace(/-(\d)\b/g, '-0$1'); // Format date as yyyy-mm-dd
        let className = "day";
        let title = "";
        
        // Check if the fullDate is today's date and add the 'active' class if it is
        if (fullDate === todayFormatted) {
            className += " active";
        }
        
        if (events[fullDate]) {
            className += " special-day";
            title = ` title="${events[fullDate]}"`;
        }
        html += `<li class="${className}"${title}>${day}</li>`;
    }
    daysTag.html(html);
    currentDateDisplay.text(new Date(currYear, currMonth).toLocaleString('hu-HU', { month: 'long', year: 'numeric' }));
    
    ($("li.day")).click(function() {
        const dayNumber = $(this).text(); // a nap száma a naptárban
        const fullDate = `${currYear}-${String(currMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        
        // Megnyitjuk a modális ablakot és tároljuk az adott nap dátumát
        $("#eventModal").addClass('is-active').data('date', fullDate);
    });
    $(".save").off();
     $(".save").click(function() {
        // Kinyerjük az értékeket az input mezőkből
        var eventName = $("#eventModal .input[type='text']").val();
        var eventTime = $("#eventModal .input[type='time']").val();
        var selectedDate = $("#eventModal").data('date');

    
        var eventData = {
            name: eventName, 
            date: selectedDate, 
            time: eventTime 
        };

        // AJAX hívás az esemény feltöltéséhez
        APICall({
            type: 'POST',
            url: 'upload/event',
            data: eventData,
            success: function(response) {
                // Sikeres válasz esetén zárjuk be a modális ablakot és frissítsük a naptárat
                $("#eventModal").removeClass('is-active');
                fetchEventsAndRenderCalendar();
            },
            error: function(xhr) {
                console.error('Failed to upload event:', xhr.responseText);
            }
        });
    });
    // Close event modal when clicking on modal background or closing button
    $(".modal-background, .cancel-save").click(function() {
        $("#eventModal").removeClass('is-active');
    });
}


$(document).ready(function () {
    currYear = new Date().getFullYear();
    currMonth = new Date().getMonth();
    
    if (!getSessionData('userData')) {
        // Fetch user data first if not available
        APICall({
            type: 'GET',
            url: 'get/user',
            success: function (response) {
                sessionStorage.setItem('userData', JSON.stringify(response));
                
                fetchEventsAndRenderCalendar();
            },
            error: function(xhr) {
                console.error('Failed to fetch user data:', xhr.responseText);
            }
        });
    } else {
        fetchEventsAndRenderCalendar();
    }

    $("#prev").click(function () {
        currMonth--;
        if (currMonth < 0) {
            currMonth = 11;
            currYear--;
        }
        fetchEventsAndRenderCalendar();
    });

    $("#next").click(function () {
        currMonth++;
        if (currMonth > 11) {
            currMonth = 0;
            currYear++;
        }
        fetchEventsAndRenderCalendar();
    });
});
