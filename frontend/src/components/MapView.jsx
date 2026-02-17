import { useEffect, useMemo, useRef, useState } from 'react'

const defaultCenter = { lat: -1.286389, lng: 36.817223 } // Nairobi

const markerIconConfig = {
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
}

const highlightedIconConfig = {
  iconUrl: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -28],
}

const MapView = ({ properties = [], onBoundsChanged = () => { }, highlightedId, focusedId, forcedBounds, onPinClick = () => { } }) => {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersLayerRef = useRef(null)
  const previousPropertiesRef = useRef(properties)
  const hasFittedRef = useRef(false)
  const onBoundsChangedRef = useRef(onBoundsChanged)
  const onPinClickRef = useRef(onPinClick)
  const [leafletReady, setLeafletReady] = useState(() => typeof window !== 'undefined' && Boolean(window.L))

  // Update the ref when callback changes
  useEffect(() => {
    onBoundsChangedRef.current = onBoundsChanged
  }, [onBoundsChanged])

  useEffect(() => {
    onPinClickRef.current = onPinClick
  }, [onPinClick])

  const propertiesWithCoords = useMemo(
    () =>
      properties.filter(
        (property) =>
          property.latitude !== null &&
          property.latitude !== undefined &&
          property.longitude !== null &&
          property.longitude !== undefined
      ),
    [properties]
  )

  useEffect(() => {
    if (leafletReady) return
    let intervalId

    const waitForLeaflet = () => {
      if (typeof window !== 'undefined' && window.L && window.L.markerClusterGroup) {
        setLeafletReady(true)
        clearInterval(intervalId)
      }
    }

    intervalId = window.setInterval(waitForLeaflet, 150)
    waitForLeaflet()

    return () => clearInterval(intervalId)
  }, [leafletReady])

  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return
    const L = window.L
    if (!L) return

    const mapInstance = L.map(containerRef.current, {
      center: [defaultCenter.lat, defaultCenter.lng],
      zoom: 11,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(mapInstance)

    const clusterLayer =
      typeof L.markerClusterGroup === 'function'
        ? L.markerClusterGroup({
          chunkedLoading: true,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
        })
        : L.layerGroup()

    clusterLayer.addTo(mapInstance)
    markersLayerRef.current = clusterLayer
    mapRef.current = mapInstance

    const emitBounds = () => {
      const bounds = mapInstance.getBounds()
      if (!bounds) return
      const ne = bounds.getNorthEast()
      const sw = bounds.getSouthWest()
      onBoundsChangedRef.current({
        north: ne.lat,
        east: ne.lng,
        south: sw.lat,
        west: sw.lng,
      })
    }

    mapInstance.on('moveend zoomend', emitBounds)
    emitBounds()

    return () => {
      mapInstance.off('moveend', emitBounds)
      mapInstance.off('zoomend', emitBounds)
      mapInstance.remove()
      mapRef.current = null
      markersLayerRef.current = null
      hasFittedRef.current = false
    }
  }, [leafletReady])

  // Monitor container resize to update map layout
  useEffect(() => {
    if (!mapRef.current || !containerRef.current) return

    const resizeObserver = new ResizeObserver(() => {
      mapRef.current?.invalidateSize()
    })

    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [leafletReady]) // leafletReady indicates map is likely initialized or close to it. mapRef.current check inside effect handles null.

  useEffect(() => {
    const L = window.L
    const map = mapRef.current
    const layer = markersLayerRef.current
    if (!leafletReady || !L || !map || !layer) return

    layer.clearLayers()

    const defaultIcon = L.icon(markerIconConfig)
    const highlightedIcon = L.icon(highlightedIconConfig)
    const markerPositions = []
    const previousProperties = previousPropertiesRef.current

    propertiesWithCoords.forEach((property) => {
      const lat = Number(property.latitude)
      const lng = Number(property.longitude)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return

      const marker = L.marker([lat, lng], {
        icon: (highlightedId === property.id || focusedId === property.id) ? highlightedIcon : defaultIcon,
      })

      marker.on('click', () => onPinClickRef.current(property.id))
      marker.bindPopup(createPopupContent(property))
      layer.addLayer(marker)
      markerPositions.push([lat, lng])
    })

    // Handle initial fit or property updates
    if (markerPositions.length) {
      if (!hasFittedRef.current || previousProperties !== properties) {
        const bounds = L.latLngBounds(markerPositions)
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
        hasFittedRef.current = true
      }
    } else {
      map.setView([defaultCenter.lat, defaultCenter.lng], 11)
      hasFittedRef.current = false
    }

    previousPropertiesRef.current = properties
  }, [leafletReady, propertiesWithCoords, highlightedId, focusedId, properties])

  // Handle flying to focused property
  useEffect(() => {
    if (!mapRef.current || !focusedId) return
    const property = properties.find((p) => p.id === focusedId)
    if (property && property.latitude && property.longitude) {
      const lat = Number(property.latitude)
      const lng = Number(property.longitude)
      // Check if current bounds contain this point? If not fly.
      // But simple setView is safer for focus.
      mapRef.current.setView([lat, lng], 16, {
        animate: true,
        duration: 1.5
      })
    }
  }, [focusedId, properties])

  // Handle forced bounds (Search)
  useEffect(() => {
    if (!mapRef.current || !forcedBounds) return

    if (typeof forcedBounds.south === 'number') {
      const bounds = [
        [forcedBounds.south, forcedBounds.west],
        [forcedBounds.north, forcedBounds.east]
      ]
      mapRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [forcedBounds])

  if (!leafletReady) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-sm text-gray-500">
        <p className="font-semibold text-gray-700">Loading map resources...</p>
        <p className="mt-1">This usually takes a moment the first time.</p>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}

const createPopupContent = (property) => {
  const imageUrl =
    property.thumbnail || property.images?.[0]?.image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
  const rent = Number(property.price || property.rent_per_month)
  const rentDisplay = Number.isNaN(rent) ? 'KES —' : `KES ${rent.toLocaleString()}`

  const wrapper = document.createElement('div')
  wrapper.className = 'space-y-1'

  const imageEl = document.createElement('img')
  imageEl.src = imageUrl
  imageEl.alt = property.title ?? 'Property image'
  imageEl.className = 'w-full h-24 object-cover rounded'

  const titleEl = document.createElement('p')
  titleEl.className = 'text-sm font-semibold text-gray-900'
  titleEl.textContent = property.title ?? 'Untitled property'

  const locationEl = document.createElement('p')
  locationEl.className = 'text-xs text-gray-500'
  locationEl.textContent = property.location ?? 'Location unavailable'

  const rentEl = document.createElement('p')
  rentEl.className = 'text-sm font-bold text-orange-500'
  rentEl.textContent = rentDisplay

  wrapper.append(imageEl, titleEl, locationEl, rentEl)
  return wrapper
}

export default MapView

