import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bed, Bath, Heart, ArrowUpRight } from 'lucide-react'

const PremiumCard = ({ property, highlighted, onSave, layout = 'grid' }) => {
    const navigate = useNavigate()
    const isList = layout === 'list'
    // Handle undefined property safely
    if (!property) return null;

    return (
        <motion.div
            id={`property-card-${property.id}`}
            layout
            className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 ${highlighted
                ? 'border-orange-500 shadow-xl shadow-orange-500/10 ring-1 ring-orange-500'
                : 'border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-lg'
                } ${isList ? 'flex flex-col sm:flex-row h-auto sm:h-48' : 'flex flex-col h-full'}`}
        >
            {/* Image Container */}
            <div className={`relative overflow-hidden bg-slate-200 ${isList ? 'w-full sm:w-64 h-48 shrink-0' : 'w-full aspect-[4/3]'}`}>
                <img
                    src={property.images?.[0]?.image || property.thumbnail || 'https://images.unsplash.com/photo-1600596542815-6ad4c4246608?w=800&q=80'}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {property.status === 'active' && (
                        <div className="backdrop-blur-md bg-white/90 px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold text-emerald-600 shadow-sm">
                            Active
                        </div>
                    )}
                    {property.owner_verified && (
                        <div className="backdrop-blur-md bg-blue-500/90 text-white px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm flex items-center gap-1">
                            Verified
                        </div>
                    )}
                    {property.is_promoted && (
                        <div className="backdrop-blur-md bg-orange-500/90 text-white px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm flex items-center gap-1">
                            Featured
                        </div>
                    )}
                </div>

                {onSave && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md bg-white/50 text-white hover:bg-white hover:text-rose-500 transition-all shadow-sm"
                    >
                        <Heart className={`w-4 h-4 ${property.is_saved ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                )}

                {/* Price Overlay on Image (Mobile/Grid preferrence) */}
                <div className="absolute bottom-3 left-3 text-white">
                    <p className="text-xl font-bold font-display tracking-tight drop-shadow-md">
                        KES {Number(property.rent_per_month || property.price).toLocaleString()}
                        <span className="text-xs font-normal opacity-80">/mo</span>
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {property.title}
                        </h3>
                    </div>

                    <div className="flex items-center text-slate-500 text-sm mb-3 gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{property.location}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <Bed className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700">{property.bedrooms}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">Beds</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            <Bath className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-700">{property.bathrooms}</span>
                            <span className="text-xs text-slate-400 hidden sm:inline">Baths</span>
                        </div>
                        <div className="text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 uppercase tracking-wide">
                            {property.property_type}
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => navigate(`/property/${property.slug || property.id}`)}
                    className="w-full mt-auto py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2 group-hover:shadow-md"
                >
                    View Details
                    <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                </button>
            </div>
        </motion.div>
    )
}

export default PremiumCard
