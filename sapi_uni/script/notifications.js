const notificationObject = {
    messageList: [], 
    listenerId: null, 
    notificationContainer: null, 

    // Az értesítések megjelenítése
    render: function() {
        // Ha nincs még létrehozva a notificationContainer, akkor létrehozzuk
        if (!this.notificationContainer) {
            this.notificationContainer = $('#notificationContainer');
        }
        // Töröljük az előző értesítéseket a konténerből
        this.notificationContainer.empty();

        // Minden üzenet megjelenítése a listából
        this.messageList.forEach(message => {
            const notificationElement = $('<div>').addClass
            ('notification-item notification navbar-item-wide');
            notificationElement.html(`
                <strong>${message.message}</strong>
                <a href="${message.redirect}" class="notification-link" data-id="${message.id}">Megtekintés</a>
                <span class="delete-notification" data-id="${message.id}">&times;</span>
            `);
            this.notificationContainer.append(notificationElement);
        });

        // Eseményfigyelő hozzáadása az értesítések törléséhez
        $('.delete-notification').click(event => {
            const notificationId = $(event.target).data('id');
            if (notificationId) {
                this.deleteNotification(notificationId);
            }
        });
    },

    // Az új értesítések ellenőrzése és frissítése
    checkNewNotifications: function() {
        setInterval(() => {
            this.query().then(() => {
                const newNotificationCount = 
                this.messageList.length;
                const icon = $('.fa-envelope');
                if (newNotificationCount > 0) {
                    icon.addClass
                    ('has-new-notifications').html
                    ('<i class="fa fa-exclamation"></i>');
                } else {
                    icon.removeClass('has-new-notifications');
                }
            });
        }, 5000);
    },

    // Kezdeti inicializáció
    init: function() {
        this.query();
        this.startListener();
        this.render(); 
        this.checkNewNotifications();
        this.notificationContainer.css({ maxHeight: '400px', overflowY: 'auto' });
    },

    // Értesítések lekérdezése a szerverről
    query: function() {
        return APICall({
            url: 'get/notifications',
            type: 'GET',
            dataType: 'json',
            success: data => {
                this.messageList = data; 
                this.render(); 

                if (this.messageList.length === 0) {
                    const icon = $('.fa-envelope');
                    icon.removeClass('has-new-notifications');
                }
            },
            error: error => {
                console.error(
                    'Error fetching notifications:', error);
            }
        });
    },

    // Üzenetfigyelő indítása
    startListener: function() {
        this.listenerId = setInterval(() => this.query(), 30000);
    },

    // Üzenetfigyelő leállítása
    stopListener: function() {
        clearInterval(this.listenerId);
    },

    // Értesítés törlése
    deleteNotification: function(notificationId) {
        APICall({
            url: 'delete/notification/' + notificationId,
            type: 'DELETE',
            dataType: 'json',
            data: { notificationId: notificationId },
            success: data => {
                if (data.success) {
                    this.messageList = this.messageList.filter(message => message.id !== notificationId);
                    this.render(); // Értesítések megjelenítésének frissítése
                    this.query(); // Értesítések megjelenítésének frissítése
                } else {
                    console.error('Error deleting notification:', data.error);
                }
            },
            error: error => {
                console.error('Error deleting notification:', error);
            }
        });
    }
};

// Az oldal betöltésekor inicializáljuk az értesítési rendszert
$(document).ready(function() {
    notificationObject.init();
});
