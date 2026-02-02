// Notifications Manager

const NotificationsManager = {
    // Check if notifications are supported
    isSupported() {
        return 'Notification' in window;
    },

    // Get current permission status
    getPermission() {
        if (!this.isSupported()) {
            return 'unsupported';
        }
        return Notification.permission;
    },

    // Request notification permission
    async requestPermission() {
        if (!this.isSupported()) {
            console.warn('Notifications are not supported in this browser');
            return 'unsupported';
        }

        try {
            const permission = await Notification.requestPermission();
            return permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    },

    // Send a notification
    send(title, options = {}) {
        if (!this.isSupported()) {
            console.warn('Notifications are not supported');
            return null;
        }

        if (Notification.permission !== 'granted') {
            console.warn('Notification permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: options.icon,
                body: options.body,
                tag: options.tag,
                requireInteraction: options.requireInteraction || false,
                ...options
            });

            if (options.onClick) {
                notification.onclick = options.onClick;
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    },

    // Schedule daily check (runs when app is open)
    startDailyCheck(checkFunction, intervalMs = 60 * 60 * 1000) {
        // Run immediately
        checkFunction();

        // Then run every hour
        setInterval(checkFunction, intervalMs);
    }
};

// Make it globally available
window.NotificationsManager = NotificationsManager;
