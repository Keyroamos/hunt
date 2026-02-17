import { useState } from 'react'
import { MapPin, Bed, Bath, Shield, Heart, Filter } from 'lucide-react'

const ExploreHouses = () => {
  const [showFilters, setShowFilters] = useState(false)

  // Mock data - will be replaced with API calls
  const properties = [
    {
      id: 1,
      title: 'Modern 2BR Apartment in Westlands',
      location: 'Westlands, Nairobi',
      price: 35000,
      deposit: 70000,
      bedrooms: 2,
      bathrooms: 2,
      type: '2 Bedroom',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      verified: true,
      promoted: true,
    },
    {
      id: 2,
      title: 'Cozy Bedsitter Near CBD',
      location: 'Kilimani, Nairobi',
      price: 15000,
      deposit: 30000,
      bedrooms: 1,
      bathrooms: 1,
      type: 'Bedsitter',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      verified: true,
      promoted: false,
    },
    {
      id: 3,
      title: 'Spacious Maisonette in Karen',
      location: 'Karen, Nairobi',
      price: 85000,
      deposit: 170000,
      bedrooms: 3,
      bathrooms: 3,
      type: 'Maisonette',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
      verified: true,
      promoted: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Explore Houses</h1>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <p className="text-gray-600">
              Found {properties.length} properties
            </p>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Enter location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option>Any Price</option>
                  <option>KES 10,000 - 20,000</option>
                  <option>KES 20,000 - 50,000</option>
                  <option>KES 50,000 - 100,000</option>
                  <option>KES 100,000+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Type
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option>All Types</option>
                  <option>Bedsitter</option>
                  <option>1 Bedroom</option>
                  <option>2 Bedroom</option>
                  <option>Maisonette</option>
                  <option>Bungalow</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verified Only
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="ml-2 text-gray-700">Show verified only</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative"
            >
              {property.promoted && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                  PROMOTED
                </div>
              )}
              <div className="relative">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <button className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                  <Heart className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {property.title}
                  </h3>
                  {property.verified && (
                    <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                  )}
                </div>
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span className="text-sm">{property.location}</span>
                </div>
                <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Bed className="w-4 h-4 mr-1" />
                    <span>{property.bedrooms}</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-4 h-4 mr-1" />
                    <span>{property.bathrooms}</span>
                  </div>
                  <span className="text-orange-500 font-semibold">{property.type}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      KES {property.price.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">Deposit: KES {property.deposit.toLocaleString()}</p>
                  </div>
                  <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ExploreHouses

