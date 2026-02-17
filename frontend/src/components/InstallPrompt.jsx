import { useState, useEffect } from 'react'
import { Download, X, Share } from 'lucide-react'
import { promptInstall, isIOS, canInstall, isInstalled } from '../utils/pwa'

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false)
    const [isAppInstalled, setIsAppInstalled] = useState(false)

    useEffect(() => {
        // Check if app is already installed
        setIsAppInstalled(isInstalled())

        // Check if mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

        // Only show custom prompt on mobile devices
        if (!isMobile) {
            return // Desktop will use browser's native install button
        }

        // Listen for install prompt event
        const handleShowPrompt = () => {
            if (!isInstalled()) {
                setShowPrompt(true)
            }
        }

        const handleHidePrompt = () => {
            setShowPrompt(false)
        }

        window.addEventListener('show-install-prompt', handleShowPrompt)
        window.addEventListener('hide-install-prompt', handleHidePrompt)

        // Show prompt after 30 seconds if not installed (mobile only)
        const timer = setTimeout(() => {
            if (canInstall() && !isInstalled()) {
                setShowPrompt(true)
            }
        }, 30000)

        return () => {
            window.removeEventListener('show-install-prompt', handleShowPrompt)
            window.removeEventListener('hide-install-prompt', handleHidePrompt)
            clearTimeout(timer)
        }
    }, [])

    const handleInstall = async () => {
        const accepted = await promptInstall()
        if (accepted) {
            setShowPrompt(false)
        }
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        // Don't show again for 7 days
        localStorage.setItem('install-prompt-dismissed', Date.now().toString())
    }

    // Don't show if already installed or not showing prompt
    if (isAppInstalled || !showPrompt) {
        return null
    }

    // Check if dismissed recently
    const dismissedTime = localStorage.getItem('install-prompt-dismissed')
    if (dismissedTime) {
        const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24)
        if (daysSinceDismissed < 7) {
            return null
        }
    }

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-full duration-500">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-white relative">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                            <img src="/icon-192.png" alt="House Hunt" className="w-10 h-10 rounded-lg" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Install House Hunt</h3>
                            <p className="text-sm text-orange-100">Get the app experience</p>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {isIOS() ? (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                To install this app on your iPhone:
                            </p>
                            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                                <li>Tap the <Share className="w-4 h-4 inline" /> Share button</li>
                                <li>Scroll down and tap "Add to Home Screen"</li>
                                <li>Tap "Add" in the top right corner</li>
                            </ol>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Install House Hunt for quick access and offline support
                            </p>
                            <ul className="text-sm text-slate-700 space-y-1">
                                <li>✓ Works offline</li>
                                <li>✓ Fast and responsive</li>
                                <li>✓ Push notifications</li>
                                <li>✓ No app store needed</li>
                            </ul>
                            <button
                                onClick={handleInstall}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-semibold flex items-center justify-center space-x-2"
                            >
                                <Download className="w-5 h-5" />
                                <span>Install App</span>
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="w-full py-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
                            >
                                Maybe later
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default InstallPrompt
