import { useState, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bed, Bath, Heart, Eye, Grid, List, Search, X, Sparkles, Filter, ArrowUpRight, Home, Map as MapIcon } from 'lucide-react'
import PremiumCard from '../components/PremiumCard'
import TopSearchBar from '../components/TopSearchBar'

// ... (other imports)

// ... Explore component ...

// Remove PremiumCard definition (Lines 387-481)

import FiltersDrawer from '../components/FiltersDrawer'
import MapView from '../components/MapView'
import { propertyAPI, favoriteAPI } from '../utils/api'
import InfiniteScroll from 'react-infinite-scroll-component'

const Explore = () => {
  const [properties, setProperties] = useState([])
  const [totalProperties, setTotalProperties] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [mapBounds, setMapBounds] = useState(null)
  const [pendingBounds, setPendingBounds] = useState(null)
  const [hasPendingChanges, setHasPendingChanges] = useState(false)
  const [filters, setFilters] = useState({})
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [highlightedId, setHighlightedId] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savedProperties, setSavedProperties] = useState(() => new Set())
  const [viewMode, setViewMode] = useState('grid')
  const navigate = useNavigate()
  const [showMobileMap, setShowMobileMap] = useState(false)
  const [mapPins, setMapPins] = useState([])
  const [forcedBounds, setForcedBounds] = useState(null)

  const fetchMapPins = useCallback(async ({ boundsArg, filterArg } = {}) => {
    const targetBounds = boundsArg || pendingBounds || mapBounds
    const targetFilters = filterArg || filters

    const params = {}
    if (targetBounds) {
      params.lat_min = targetBounds.south
      params.lat_max = targetBounds.north
      params.lng_min = targetBounds.west
      params.lng_max = targetBounds.east
    }

    Object.entries(targetFilters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params[key] = value
      }
    })

    try {
      const response = await propertyAPI.getMapPins(params)
      setMapPins(response.data || [])
    } catch (error) {
      console.error("Failed to load map pins", error)
    }
  }, [mapBounds, pendingBounds, filters])

  // Initial Fetch
  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true)
        // Fetch List
        const response = await propertyAPI.getAll({ page: 1 })
        const results = response.data?.results ?? response.data ?? []
        setProperties(results)
        setTotalProperties(response.data?.count ?? results.length)
        setHasMore(Boolean(response.data?.next))
        setPage(2)

        // Fetch Map Pins
        const pinsResponse = await propertyAPI.getMapPins({})
        setMapPins(pinsResponse.data || [])
      } catch (error) {
        console.error('Failed to load initial properties', error)
      } finally {
        setLoading(false)
      }
    }
    initialFetch()
  }, [])

  const fetchProperties = useCallback(
    async ({ reset = false, pageArg = 1, boundsArg, filterArg } = {}) => {
      const targetBounds = boundsArg || pendingBounds || mapBounds
      const targetFilters = filterArg || filters
      if (reset) setLoading(true)

      if (reset) {
        fetchMapPins({ boundsArg, filterArg })
      }

      try {
        const params = { page: pageArg }

        if (targetBounds) {
          params.lat_min = targetBounds.south
          params.lat_max = targetBounds.north
          params.lng_min = targetBounds.west
          params.lng_max = targetBounds.east
        }

        Object.entries(targetFilters).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params[key] = value
          }
        })

        const response = await propertyAPI.getAll(params)
        const results = response.data?.results ?? response.data ?? []

        setProperties((prev) => (reset ? results : [...prev, ...results]))
        if (reset || response.data?.count) {
          setTotalProperties(response.data?.count ?? (reset ? results.length : properties.length + results.length))
        }
        setHasMore(Boolean(response.data?.next))
        setPage(pageArg + 1)

        if (reset && boundsArg) {
          setMapBounds(boundsArg)
          setPendingBounds(null)
          setHasPendingChanges(false)
        }
        return results
      } catch (error) {
        console.error('Failed to load properties', error)
      } finally {
        if (reset) setLoading(false)
      }
    },
    [mapBounds, pendingBounds, filters, properties.length, fetchMapPins]
  )

  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds((currentBounds) => {
      if (!currentBounds) {
        return bounds
      } else {
        setPendingBounds(bounds)
        setHasPendingChanges(true)
        return currentBounds
      }
    })
  }, [])

  const handleFiltersApply = (newFilters) => {
    setFilters(newFilters)
    setIsFiltersOpen(false)
    fetchProperties({ reset: true, pageArg: 1, filterArg: newFilters })
  }

  const handleSearch = ({ location, geometry }) => {
    let updatedFilters = { ...filters }
    let boundsOverride = null

    if (geometry && geometry.viewport) {
      if (updatedFilters.location) delete updatedFilters.location
      boundsOverride = geometry.viewport
      setForcedBounds(geometry.viewport)
    } else {
      updatedFilters.location = location
    }

    setFilters(updatedFilters)
    fetchProperties({ reset: true, pageArg: 1, filterArg: updatedFilters, boundsArg: boundsOverride })
  }

  const handleSearchThisArea = () => {
    if (!pendingBounds) return
    fetchProperties({ reset: true, pageArg: 1, boundsArg: pendingBounds })
  }

  const handleToggleSave = async (propertyId) => {
    try {
      if (savedProperties.has(propertyId)) return
      setSavedProperties((prev) => new Set(prev).add(propertyId))
      await favoriteAPI.add(propertyId)
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login')
      }
      setSavedProperties((prev) => {
        const updated = new Set(prev)
        updated.delete(propertyId)
        return updated
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      <TopSearchBar onSearch={handleSearch} onOpenFilters={() => setIsFiltersOpen(true)} />

      <FiltersDrawer
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        onApply={handleFiltersApply}
        initialFilters={filters}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Property List */}
        <div
          id="scrollable-list"
          className="w-full lg:w-[55%] xl:w-[45%] h-full overflow-y-auto bg-slate-50 scroll-smooth relative z-0"
        >
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col">

            {/* Header Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    Explore Properties
                    {loading && <span className="text-sm font-normal text-slate-400 animate-pulse">(Updating...)</span>}
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    {totalProperties > 0
                      ? `Showing ${totalProperties} verified homes available now`
                      : 'Searching for the best homes...'
                    }
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm self-start">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'grid'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${viewMode === 'list'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Filters */}
              <AnimatePresence>
                {Object.keys(filters).length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="flex flex-wrap gap-2 overflow-hidden"
                  >
                    {Object.entries(filters).map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-900 text-white shadow-sm">
                        {key}: {value}
                        <button
                          onClick={() => {
                            const newFilters = { ...filters }
                            delete newFilters[key]
                            setFilters(newFilters)
                            fetchProperties({ reset: true, pageArg: 1, filterArg: newFilters })
                          }}
                          className="ml-2 hover:bg-slate-700 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => {
                        setFilters({})
                        fetchProperties({ reset: true, pageArg: 1, filterArg: {} })
                      }}
                      className="text-xs font-medium text-slate-500 hover:text-rose-500 underline decoration-slate-300 hover:decoration-rose-500 underline-offset-2 transition-all"
                    >
                      Clear All
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Content Area */}
            {loading && properties.length === 0 ? (
              <ListSkeleton />
            ) : properties.length === 0 ? (
              <EmptyState onReset={() => {
                setFilters({})
                fetchProperties({ reset: true, pageArg: 1, filterArg: {} })
              }} />
            ) : (
              <InfiniteScroll
                dataLength={properties.length}
                next={() => fetchProperties({ pageArg: page })}
                hasMore={hasMore}
                loader={<div className="py-8 flex justify-center"><LoadingSpinner /></div>}
                scrollableTarget="scrollable-list"
                className="pb-20"
              >

                <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      onMouseEnter={() => setHighlightedId(property.id)}
                      onMouseLeave={() => setHighlightedId(null)}
                      onClick={() => setFocusedId(property.id)}
                      className="h-full cursor-pointer"
                    >
                      <PremiumCard
                        property={{ ...property, is_saved: savedProperties.has(property.id) }}
                        highlighted={highlightedId === property.id || focusedId === property.id}
                        onSave={() => handleToggleSave(property.id)}
                        layout={viewMode}
                      />
                    </div>
                  ))}
                </div>
              </InfiniteScroll>
            )}
          </div>
        </div>

        {/* Right Side: Map */}
        <div className={`${showMobileMap ? 'fixed inset-0 z-40 h-[100dvh]' : 'hidden lg:block flex-1 relative'} bg-slate-100 border-l border-slate-200 shadow-inner transition-all duration-300`}>
          {hasPendingChanges && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]"
            >
              <button
                onClick={handleSearchThisArea}
                className="px-5 py-2.5 bg-white text-slate-900 rounded-full shadow-lg border border-slate-200 font-medium text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-1 ring-black/5"
              >
                <Search className="w-4 h-4 text-orange-500" />
                Search this area
              </button>
            </motion.div>
          )}
          <MapView
            properties={mapPins}
            highlightedId={highlightedId}
            focusedId={focusedId}
            forcedBounds={forcedBounds}
            onBoundsChanged={handleBoundsChange}
            onPinClick={(id) => {
              setHighlightedId(id)
              if (showMobileMap) {
                const property = mapPins.find(p => p.id === id)
                navigate(`/property/${property?.slug || id}`)
              } else {
                const el = document.getElementById(`property-card-${id}`)
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }
            }}
          />
        </div>
      </div>

      {/* Mobile Map Toggle */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 lg:hidden">
        <button
          onClick={() => setShowMobileMap(!showMobileMap)}
          className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold transform transition-transform hover:scale-105 active:scale-95 border border-slate-800"
        >
          {showMobileMap ? (
            <>
              <List className="w-4 h-4" /> Show List
            </>
          ) : (
            <>
              <MapIcon className="w-4 h-4" /> Show Map
            </>
          )}
        </button>
      </div>

      {/* Thin Static Footer */}
      <div className="bg-white border-t border-slate-100 py-1.5 px-6 flex items-center justify-between z-20 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
        <div className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wide">
          &copy; {new Date().getFullYear()} HouseHunt Inc.
        </div>
        <div className="flex items-center gap-4 text-[10px] sm:text-xs text-slate-500">
          <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Terms</a>
          <a href="#" className="hover:text-orange-500 transition-colors">Sitemap</a>
          <span className="hidden sm:inline border-l border-slate-200 pl-4 text-slate-400">Trusted by 10k+ Landlords</span>
        </div>
      </div>
    </div>
  )
}

// --- Sub Components ---



const EmptyState = ({ onReset }) => (
  <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
      <Search className="w-10 h-10 text-orange-200" />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">No properties found</h3>
    <p className="text-slate-500 max-w-sm mb-8">
      We couldn't find any homes matching your criteria in this area. Try zooming out or changing your filters.
    </p>
    <button
      onClick={onReset}
      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-105 transition-all"
    >
      Clear Filters
    </button>
  </div>
)

const LoadingSpinner = () => (
  <div className="relative w-10 h-10">
    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
    <div className="absolute inset-0 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
  </div>
)

const ListSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="bg-white rounded-2xl h-[380px] border border-gray-100 overflow-hidden flex flex-col">
        <div className="h-48 bg-slate-100 w-full" />
        <div className="p-4 flex-1 flex flex-col gap-4">
          <div className="h-6 bg-slate-100 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-8 w-16 bg-slate-100 rounded" />
            <div className="h-8 w-16 bg-slate-100 rounded" />
          </div>
          <div className="mt-auto h-10 bg-slate-100 rounded-xl w-full" />
        </div>
      </div>
    ))}
  </div>
)

export default Explore
