// PWA Registration and Install Prompt
export const registerServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then((registration) => {
                    console.log('Service Worker registered for PWA installability:', registration.scope)
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error)
                })
        })
    }
}

// Unregister function in case we need to cleanup (keeping it for utility)
export const unregisterServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.unregister();
                console.log('Service Worker unregistered');
            }
        } catch (error) {
            console.error('Error unregistering service worker:', error);
        }
    }
}

// Install prompt handler
let deferredPrompt = null

export const initInstallPrompt = () => {
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault()
        // Stash the event so it can be triggered later
        deferredPrompt = e
        // Show custom install button/banner
        showInstallPromotion()
    })

    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed')
        deferredPrompt = null
        hideInstallPromotion()
    })
}

export const promptInstall = async () => {
    if (!deferredPrompt) {
        console.log('Install prompt not available')
        return false
    }

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)

    // Clear the deferredPrompt for next time
    deferredPrompt = null

    return outcome === 'accepted'
}

export const isInstalled = () => {
    // Check if app is installed
    return window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
}

function showInstallPromotion() {
    // Dispatch custom event that components can listen to
    const event = new CustomEvent('show-install-prompt')
    window.dispatchEvent(event)
}

function hideInstallPromotion() {
    const event = new CustomEvent('hide-install-prompt')
    window.dispatchEvent(event)
}

// Check if iOS and show iOS-specific install instructions
export const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

export const canInstall = () => {
    return deferredPrompt !== null || isIOS()
}
