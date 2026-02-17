import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const defaultFilters = {
  min_price: '',
  max_price: '',
  bedrooms: '',
  property_type: '',
  verified_only: false,
  promoted_only: false,
  newly_listed: false,
}

const propertyTypes = [
  { value: '', label: 'All Types' },
  { value: 'bedsitter', label: 'Bedsitter' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedroom' },
  { value: 'maisonette', label: 'Maisonette' },
  { value: 'bungalow', label: 'Bungalow' },
]

const FiltersDrawer = ({ isOpen, onClose, onApply, initialFilters = {} }) => {
  const [filters, setFilters] = useState({ ...defaultFilters, ...initialFilters })

  useEffect(() => {
    setFilters({ ...defaultFilters, ...initialFilters })
  }, [initialFilters])

  const handleChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const applyFilters = () => {
    onApply(filters)
    onClose()
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
    onApply(defaultFilters)
    onClose()
  }

  return (
    <div
      className={`fixed inset-0 z-[2000] transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
    >
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Filters</h3>
            <p className="text-sm text-gray-500">Refine your search to find the perfect home.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-6 overflow-y-auto h-[calc(100%-140px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (KES)</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price}
                onChange={(e) => handleChange('min_price', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price}
                onChange={(e) => handleChange('max_price', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">House Type</label>
            <select
              value={filters.property_type}
              onChange={(e) => handleChange('property_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {propertyTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Amenities & Preferences</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.verified_only}
                  onChange={(e) => handleChange('verified_only', e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                Verified owners only
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.promoted_only}
                  onChange={(e) => handleChange('promoted_only', e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                Promoted listings
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={filters.newly_listed}
                  onChange={(e) => handleChange('newly_listed', e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500"
                />
                Newly listed
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={resetFilters}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={applyFilters}
            className="bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  )
}

export default FiltersDrawer

