import { Heart, Shield, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

const PropertyCard = ({ property, highlighted, onSave = () => {}, onClick = () => {} }) => {
  return (
    <motion.div
      id={`property-${property.id}`}
      layout
      whileHover={{ y: -4 }}
      className={`rounded-2xl border bg-white shadow-sm overflow-hidden transition-all duration-200 ${
        highlighted ? 'ring-2 ring-orange-400 border-orange-200' : 'border-gray-100'
      }`}
      onClick={onClick}
    >
      <div className="relative h-48 bg-gray-100">
        <img
          src={property.thumbnail || property.images?.[0]?.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'}
          alt={property.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSave(property.id)
          }}
          className={`absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow ${
            property.is_saved ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
          }`}
          aria-label="Save property"
        >
          <Heart className={`w-4 h-4 ${property.is_saved ? 'fill-red-500' : ''}`} />
        </button>
        {property.owner_verified && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 text-xs font-semibold rounded-full flex items-center gap-1 text-emerald-600">
            <Shield className="w-3 h-3" />
            Verified owner
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-orange-500" />
              {property.location}
            </p>
            <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">KES {Number(property.rent_per_month).toLocaleString()}</p>
            <p className="text-xs text-gray-500">per month</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <span>{property.property_type?.toUpperCase()}</span>
          <span>· {property.bedrooms} beds</span>
          {property.status === 'active' ? (
            <span className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-600 border border-emerald-100">
              Available
            </span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 border border-gray-200">
              {property.status}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default PropertyCard

