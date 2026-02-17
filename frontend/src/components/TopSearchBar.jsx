import { useEffect, useRef, useState } from 'react'
import { Search, SlidersHorizontal, MapPin } from 'lucide-react'

const destinations = [
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
]

const TopSearchBar = ({ onSearch = () => { }, onOpenFilters = () => { } }) => {
  const [searchLocation, setSearchLocation] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!window.google || !window.google.maps?.places) return
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['(cities)'],
    })
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const locationVal = place.formatted_address || place.name
      setSearchLocation(locationVal)

      let searchData = { location: locationVal }
      if (place.geometry) {
        searchData.geometry = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          viewport: place.geometry.viewport ? place.geometry.viewport.toJSON() : null
        }
      }
      onSearch(searchData)
    })
  }, [onSearch])

  return (
    <div className="w-full bg-white border-b border-slate-100 z-30">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex flex-1 items-center bg-slate-50 border border-slate-200 rounded-full shadow-sm px-4 py-1.5 transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 hover:bg-white">
          <MapPin className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search by location..."
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm h-9"
          />
          <button
            onClick={() => onSearch({ location: searchLocation })}
            className="bg-slate-900 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-orange-600 transition-colors ml-2"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Filters & Tags */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <div className="flex items-center space-x-2">
            {destinations.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setSearchLocation(city)
                  onSearch({ location: city })
                }}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-orange-600 hover:border-orange-200 transition-all"
              >
                {city}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

          <button
            onClick={onOpenFilters}
            className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 hover:border-slate-900 hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 shadow-sm shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopSearchBar

