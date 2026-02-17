import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    MapPin, Bed, Bath, ArrowLeft, Heart, Share2,
    Maximize2, ChevronRight, Check, Calendar, MessageSquare,
    Shield, User, Star, Clock, Home, Map as MapIcon, X, Send, AlertCircle
} from 'lucide-react'
import { propertyAPI, favoriteAPI, inquiryAPI, paymentAPI } from '../utils/api'
import MapView from '../components/MapView' // We can reuse this or simple embed

// M-PESA Payment Modal where user enters phone number
const MpesaPaymentModal = ({ onClose, onSubmit, paymentStatus }) => {
    const [phone, setPhone] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Validate phone number
        const cleanPhone = phone.trim().replace(/\s/g, '').replace(/-/g, '')
        if (!cleanPhone) {
            return alert('Please enter your M-Pesa phone number')
        }

        // Check if it's a valid Kenyan phone number
        const phoneRegex = /^(0|254|\+254)?[17]\d{8}$/
        if (!phoneRegex.test(cleanPhone)) {
            return alert('Invalid phone number format.\n\nPlease use:\n• 0712345678\n• 254712345678\n• +254712345678')
        }

        setIsSubmitting(true)
        await onSubmit(cleanPhone)
        setIsSubmitting(false)
    }

    const handleClose = () => {
        if (paymentStatus === 'processing' || paymentStatus === 'polling') return
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={handleClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
                {paymentStatus === 'success' ? (
                    <div className="text-center py-6">
                        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Payment Confirmed!</h3>
                        <p className="text-slate-600 mb-8 leading-relaxed">
                            Redirecting to contact details...
                        </p>
                        {/* Button removed as auto-redirect happens
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                        >
                            View Contact Details
                        </button>
                        */}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold font-serif">Unlock Contacts</h3>
                            <button
                                onClick={handleClose}
                                className={`p-2 bg-slate-100 rounded-full hover:bg-slate-200 ${paymentStatus === 'processing' || paymentStatus === 'polling' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-xl mb-4">
                                <Shield className="w-6 h-6 flex-shrink-0" />
                                <p className="text-sm font-medium">Pay <span className="font-bold">KES 499</span> to verify your identity and view landlord details instantly.</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Why pay this fee?</p>
                                <ul className="space-y-2">
                                    <li className="flex items-start text-sm text-slate-700">
                                        <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>Instant access to landlord's direct phone number</span>
                                    </li>
                                    <li className="flex items-start text-sm text-slate-700">
                                        <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>Avoid agent fees and middleman costs</span>
                                    </li>
                                    <li className="flex items-start text-sm text-slate-700">
                                        <Check className="w-4 h-4 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>Safe and secure verification process</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">M-PESA Phone Number</label>
                                <input
                                    type="tel"
                                    placeholder="0712345678"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    autoFocus
                                    maxLength="13"
                                    disabled={paymentStatus === 'processing' || paymentStatus === 'polling'}
                                />
                                <p className="text-xs text-slate-500 mt-1">Enter your Safaricom M-Pesa number</p>
                            </div>

                            {paymentStatus === 'polling' && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium flex items-center animate-pulse">
                                    <AlertCircle className="w-4 h-4 mr-2" /> STK Push sent! Please check your phone.
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting || paymentStatus === 'processing' || paymentStatus === 'polling'}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {paymentStatus === 'polling' ? (
                                    <span className="flex items-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> Waiting for PIN...</span>
                                ) : paymentStatus === 'processing' ? 'Sending Request...' : 'Pay Now'}
                            </button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    )
}

const PropertyDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [property, setProperty] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeImage, setActiveImage] = useState(0)
    const [showFullGallery, setShowFullGallery] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [showContactModal, setShowContactModal] = useState(false)
    const [showMpesaModal, setShowMpesaModal] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState('idle') // 'idle', 'processing', 'polling', 'success', 'error'
    const [pollingInterval, setPollingInterval] = useState(null)
    const [verificationReference, setVerificationReference] = useState(null)

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                setLoading(true)
                const { data } = await propertyAPI.get(id)
                setProperty(data)

                // Increment view count silently
                propertyAPI.incrementViews(id).catch(console.error)

                // Check if saved - ideally api returns this, otherwise we might need to check favorites list
                // For now, let's assume is_saved comes from backend or default false
            } catch (error) {
                console.error('Failed to fetch property details', error)
            } finally {
                setLoading(false)
            }
        }
        fetchProperty()
        window.scrollTo(0, 0)
    }, [id])

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval) clearInterval(pollingInterval)
        }
    }, [pollingInterval])

    const handleToggleSave = async () => {
        if (!property) return
        setIsSaved(!isSaved)
        try {
            if (!isSaved) await favoriteAPI.add(property.id)
            else await favoriteAPI.remove(property.id)
        } catch (err) {
            console.error("Error toggling favorite", err)
            setIsSaved(!isSaved) // revert on error
        }
    }

    if (loading) return <LoadingSkeleton />
    if (!property) return <NotFound />



    const handleAccessPayment = () => {
        const token = localStorage.getItem('access_token')
        if (!token) {
            navigate('/login')
            return
        }
        setShowMpesaModal(true)
    }

    const processPayment = async (phone) => {
        // Format phone number exactly like verification
        let p = phone.replace(/\D/g, '')
        console.log('Phone after removing non-digits:', p, 'Length:', p.length)

        if (p.startsWith('0')) p = '254' + p.substring(1)
        else if (p.length === 9) p = '254' + p

        const formattedPhone = '+' + p
        console.log('Formatted phone to send:', formattedPhone, 'Length:', formattedPhone.length)

        try {

            setPaymentStatus('processing')

            console.log('Sending payment request with phone:', formattedPhone)

            const { data } = await paymentAPI.contactAccessPayment({
                phone: formattedPhone,
                property_id: property.id
            })

            if (data && data.reference) {
                setVerificationReference(data.reference)
                setPaymentStatus('polling')

                // Show STK push notification
                // Alert removed: Modal stays open to show status
                // alert(`✅ M-Pesa payment request sent!\n\n📱 Check your phone (${phone})\n🔐 Enter your M-Pesa PIN to complete payment`)

                // Start polling for payment verification
                const interval = setInterval(async () => {
                    try {
                        const { data: verifyData } = await paymentAPI.verifyCallback(data.reference)
                        if (verifyData.status === 'verified' || verifyData.payment_type === 'contact_access') {
                            clearInterval(interval)
                            setPaymentStatus('success')

                            // Delay slightly to show success checkmark
                            setTimeout(async () => {
                                setShowMpesaModal(false)

                                // Refresh property to get updated has_access
                                // Using ID directly might fail if it's a slug, but 'id' param comes from useParams() which holds the slug
                                const { data: updatedProperty } = await propertyAPI.get(id)
                                setProperty(updatedProperty)

                                setShowContactModal(true)
                            }, 2000)
                        }
                    } catch (err) {
                        // Keep polling - payment might still be processing
                        console.log('Polling for payment verification...')
                    }
                }, 4000) // Poll every 4 seconds like verification

                setPollingInterval(interval)
            } else if (data && data.authorization_url) {
                // Fallback to payment link
                window.location.href = data.authorization_url
            }
        } catch (error) {
            console.error("Payment failed", error)
            console.error("Error response data:", error.response?.data)
            console.error("Error response status:", error.response?.status)
            console.error("Error response headers:", error.response?.headers)
            setPaymentStatus('error')
            const msg = error.response?.data?.details?.message || error.response?.data?.error || "Payment failed. Please try again."
            alert(`Error: ${msg}`)
        }
    }

    const images = property.images && property.images.length > 0
        ? property.images.map(img => img.image)
        : ['https://images.unsplash.com/photo-1600596542815-6ad4c4246608?w=1200&q=80']

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col lg:flex-row overflow-clip">

            {/* Left Column - Content (Sticky on Desktop) */}
            <div className="w-full lg:w-[45%] lg:h-screen lg:overflow-y-auto bg-white border-r border-slate-100 flex flex-col order-2 lg:order-1 relative z-20 scrollbar-hide pb-24 lg:pb-0">

                {/* Navbar / Header in Side Panel */}
                <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 px-6 py-5 flex items-center justify-between border-b border-slate-50 transition-all">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleToggleSave}
                            className={`p-2 rounded-full transition-all ${isSaved ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                        >
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                        <button className="p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-6 md:p-10 lg:p-12 flex-1">
                    {/* Tags */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-md">
                            {property.property_type.replace('_', ' ')}
                        </span>
                        {property.status === 'active' && (
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold uppercase tracking-wider rounded-md flex items-center gap-1.5 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-serif text-slate-900 leading-tight mb-4">
                        {property.title}
                    </h1>

                    <div className="flex items-center text-slate-500 font-medium text-sm mb-8">
                        <MapPin className="w-4 h-4 mr-1.5" />
                        {property.location}
                    </div>

                    {/* Agent / Booking Block (Top Priority) */}
                    <div className="bg-slate-900 text-white p-8 rounded-2xl mb-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="relative z-10">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Monthly Rent</p>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-light">KES {Number(property.rent_per_month).toLocaleString()}</span>
                            </div>

                            <button
                                onClick={() => {
                                    if (property.has_access) {
                                        setShowContactModal(true)
                                    } else {
                                        // Initiate Payment
                                        handleAccessPayment()
                                    }
                                }}
                                className="w-full bg-white text-slate-900 py-3.5 rounded-lg font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                            >
                                <>
                                    <MessageSquare className="w-4 h-4" /> Contact Owner
                                </>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8 border-t border-b border-slate-100 py-8 mb-10">
                        <div>
                            <span className="block text-slate-400 text-xs uppercase tracking-wide font-bold mb-1">Bedrooms</span>
                            <span className="text-xl font-serif">{property.bedrooms || 1}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 text-xs uppercase tracking-wide font-bold mb-1">Bathrooms</span>
                            <span className="text-xl font-serif">{property.bathrooms || 1}</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 text-xs uppercase tracking-wide font-bold mb-1">Size</span>
                            <span className="text-xl font-serif">1,200 sqft</span>
                        </div>
                        <div>
                            <span className="block text-slate-400 text-xs uppercase tracking-wide font-bold mb-1">Type</span>
                            <span className="text-xl font-serif capitalize">{property.property_type}</span>
                        </div>
                    </div>

                    <h2 className="text-lg font-bold mb-4 font-serif">About this property</h2>
                    <div className="prose prose-slate prose-lg text-slate-600 leading-relaxed mb-12">
                        <p>{property.description}</p>
                    </div>

                    <h2 className="text-lg font-bold mb-6 font-serif">Amenities</h2>
                    <div className="grid grid-cols-2 gap-4 mb-12">
                        {(property.amenities?.length > 0 ? property.amenities : ['Secure Parking', 'Water Supply', 'Security', 'Wifi']).map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <Check className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium text-slate-700">{amenity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-8 mt-auto">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 text-lg">
                                {(property.owner_name || 'L').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-900">{property.owner_name || 'Landlord'}</p>
                                <p className="text-xs text-slate-400">Response time: &lt; 1 hr</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Right Column - Visuals (Scrollable Feed) */}
            <div className="w-full lg:w-[55%] bg-slate-200 order-1 lg:order-2 lg:h-screen lg:overflow-y-auto relative scroll-smooth no-scrollbar">
                <div className="flex flex-col gap-1 min-h-screen">
                    {images.map((img, idx) => (
                        <div
                            key={idx}
                            className="relative group cursor-zoom-in"
                            onClick={() => { setActiveImage(idx); setShowFullGallery(true); }}
                        >
                            <img
                                src={img}
                                className="w-full h-auto object-cover min-h-[300px] lg:min-h-[50vh]"
                                alt={`${property.title} - ${idx + 1}`}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                    ))}

                    {/* Map at bottom of feed */}
                    <div className="h-[50vh] w-full bg-slate-100 relative grayscale hover:grayscale-0 transition-all duration-500">
                        {property.map_embed ? (
                            <div
                                className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full"
                                dangerouslySetInnerHTML={{ __html: property.map_embed }}
                            />
                        ) : (
                            <MapView
                                properties={[property]}
                                focusedId={property.id}
                            />
                        )}
                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-md text-xs font-bold shadow-sm">
                            Exact Location
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 pb-6 lg:hidden z-40 flex items-center justify-between shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Rent per month</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-slate-900">{Number(property.rent_per_month).toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-500">KES</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        if (property.has_access) {
                            setShowContactModal(true)
                        } else {
                            handleAccessPayment()
                        }
                    }}
                    className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    <>
                        <MessageSquare className="w-4 h-4" /> Contact Owner
                    </>
                </button>
            </div>

            {/* Full Screen Gallery Modal */}
            <AnimatePresence>
                {showFullGallery && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black flex flex-col"
                        onClick={() => setShowFullGallery(false)}
                    >
                        <div className="h-16 flex items-center justify-between px-4 z-50 bg-gradient-to-b from-black/50 to-transparent">
                            <span className="text-white font-mono text-sm">{activeImage + 1} / {images.length}</span>
                            <button
                                onClick={() => setShowFullGallery(false)}
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition-colors backdrop-blur-md"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 relative flex items-center justify-center p-4">
                            <motion.img
                                key={activeImage}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    if (offset.x > 100) setActiveImage(prev => Math.max(0, prev - 1))
                                    if (offset.x < -100) setActiveImage(prev => Math.min(images.length - 1, prev + 1))
                                }}
                                src={images[activeImage]}
                                alt={property.title}
                                className="max-h-full max-w-full object-contain shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />

                            {/* Navigation Arrows */}
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === 0 ? images.length - 1 : prev - 1)) }}
                                className="absolute left-4 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all hidden md:block"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveImage(prev => (prev === images.length - 1 ? 0 : prev + 1)) }}
                                className="absolute right-4 p-4 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-all hidden md:block"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contact Modal */}
            <AnimatePresence>
                {showContactModal && (
                    <ContactModal
                        property={property}
                        onClose={() => setShowContactModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* M-PESA Modal */}
            <AnimatePresence>
                {showMpesaModal && (
                    <MpesaPaymentModal
                        onClose={() => setShowMpesaModal(false)}
                        onSubmit={processPayment}
                        paymentStatus={paymentStatus}
                    />
                )}
            </AnimatePresence>

        </div>
    )
}

const ContactModal = ({ property, onClose }) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(property.contact_phone)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleWhatsApp = () => {
        let phone = property.contact_phone.replace(/\D/g, '')
        if (phone.startsWith('0')) phone = '254' + phone.substring(1)
        window.open(`https://wa.me/${phone}?text=Hi, I'm interested in ${property.title}`, '_blank')
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative"
            >
                {/* Decorative Header */}
                <div className="h-32 bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800" />
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-6 bottom-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-0 left-0 w-full p-6 flex items-end translate-y-1/2 gap-4">
                        <div className="w-20 h-20 bg-white p-1 rounded-2xl shadow-xl">
                            <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-2xl">
                                {(property.owner_name || 'L').charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div className="pb-8">
                            <h3 className="text-xl font-bold text-white mb-0.5">{property.owner_name || 'Landlord'}</h3>
                            {property.owner_verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wide border border-emerald-500/30 backdrop-blur-sm">
                                    <Shield className="w-3 h-3" /> Verified Landlord
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-14 pb-8 px-6 space-y-6">
                    {/* Phone Section */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Contact Number</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between group hover:border-slate-200 transition-colors">
                                <span className="font-mono text-lg font-bold text-slate-700 tracking-tight">
                                    {property.contact_phone || 'No number listed'}
                                </span>
                                {property.contact_phone && (
                                    <button
                                        onClick={handleCopy}
                                        className="text-slate-400 hover:text-slate-900 transition-colors p-1"
                                        title="Copy number"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <span className="text-xs font-bold">Copy</span>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        {property.contact_phone && (
                            <>
                                <a
                                    href={`tel:${property.contact_phone}`}
                                    className="flex items-center justify-center gap-2 p-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    <span className="text-xl">📞</span> Call Now
                                </a>
                                <button
                                    onClick={handleWhatsApp}
                                    className="flex items-center justify-center gap-2 p-3.5 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#20bd5a] transition-all shadow-lg shadow-green-500/20 active:scale-95"
                                >
                                    <MessageSquare className="w-5 h-5 fill-current" /> WhatsApp
                                </button>
                            </>
                        )}
                    </div>

                    {/* Safety Tip */}
                    <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg h-fit text-orange-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-900 text-sm">Safety First</h4>
                            <p className="text-xs text-orange-700 leading-relaxed mt-1">
                                Never pay any money (rent or deposit) before viewing the property physically.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

const FeatureItem = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col gap-1 p-3 rounded-2xl bg-white border border-slate-100 hover:border-orange-200 hover:shadow-md transition-all">
        <Icon className="w-5 h-5 text-orange-500 mb-1" />
        <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
        <span className="text-slate-900 font-bold capitalize">{value}</span>
    </div>
)

const LoadingSkeleton = () => (
    <div className="max-w-[1400px] mx-auto px-6 pt-20 animate-pulse">
        <div className="h-96 bg-slate-100 rounded-3xl mb-8 w-full" />
        <div className="grid grid-cols-3 gap-8">
            <div className="col-span-2 space-y-4">
                <div className="h-10 bg-slate-100 rounded-lg w-3/4" />
                <div className="h-6 bg-slate-100 rounded-lg w-1/2" />
                <div className="h-40 bg-slate-100 rounded-2xl mt-8" />
            </div>
            <div className="h-80 bg-slate-100 rounded-3xl" />
        </div>
    </div>
)

const NotFound = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800">Property Not Found</h2>
        <p className="text-slate-500 mb-6">The property you are looking for does not exist or has been removed.</p>
        <button onClick={() => window.history.back()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">
            Go Back
        </button>
    </div>
)




export default PropertyDetails
