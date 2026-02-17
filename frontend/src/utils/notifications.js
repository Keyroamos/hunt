// Notification utility for browser and desktop push notifications

export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

export const showDesktopNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/logo.png', // Make sure to add your logo
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            requireInteraction: false,
            ...options
        })

        notification.onclick = () => {
            window.focus()
            if (options.onClick) {
                options.onClick()
            }
            notification.close()
        }

        return notification
    }
    return null
}

export const showInAppNotification = (message, type = 'info', duration = 5000) => {
    // This will trigger a custom event that our NotificationToast component will listen to
    const event = new CustomEvent('show-notification', {
        detail: { message, type, duration }
    })
    window.dispatchEvent(event)
}
