

$(document).ready(function() {
    userData = getSessionData('userData');
    setProfileImage(userData.user_id);
    // Függvény a felhasználó adatainak betöltésére és megjelenítésére
    function loadUserProfile() {
        // GET kérés küldése a /user végpontra
        APICall({
            type: "GET",
            url: "get/user",
            success: function(response) {
                respObj = JSON.parse(response);
            
                $('.user_name').text(respObj.user_name);
                $('.user_email').text(respObj.user_email);
            },
            error: function(error) {
                console.log("Error loading user profile:", error);
            }
        });
    }

    // Felhasználói adatok betöltése az oldal betöltésekor
    loadUserProfile();
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