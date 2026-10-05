import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './NetworkMap.css'
import { corridors, delayReasons, globalMarkets, indiaStates, internationalCorridors, internationalTrucks as seedInternationalTrucks, internationalWarehouses, trucks as seedTrucks, warehouses } from './data/network'

const whById = Object.fromEntries(warehouses.map((w) => [w.id, w]))
const internationalWhById = Object.fromEntries(internationalWarehouses.map((w) => [w.id, w]))
const levelOf = (z) => (z < 6 ? 'Country' : z < 8 ? 'State' : z < 11 ? 'Area' : 'Road')
const worldLevelOf = (z) => (z <= 2 ? 'World' : z <= 4 ? 'Service area' : z <= 7 ? 'Hub' : 'Road')
const now = () => new Date().toLocaleTimeString('en-IN', { hour12: false })
const km = (a, b) => L.latLng(a).distanceTo(L.latLng(b)) / 1000
const UNPLANNED_STOP_THRESHOLD_MS = 60 * 60 * 1000
const formatDeliveryTime = (timestamp) => new Date(timestamp).toLocaleString('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function estimateManifestDelivery(truck, itemIndex, timestamp) {
  if (!timestamp) return ''
  const international = truck.id.startsWith('NGL-INT')
  const hubs = international ? internationalWhById : whById
  const pathDistanceKm = km(
    [hubs[truck.from].lat, hubs[truck.from].lng],
    [hubs[truck.to].lat, hubs[truck.to].lng],
  )
  const direction = truck.dir ?? truck.direction
  const remainingProgress = direction === 1 ? 1 - truck.progress : truck.progress
  const routeMinutes = (pathDistanceKm * remainingProgress / truck.speed) * 60
  const destinationId = direction === 1 ? truck.to : truck.from
  const handoffMinutes = 25 + itemIndex * 15
  return {
    at: timestamp + (routeMinutes + handoffMinutes) * 60 * 1000,
    destination: hubs[destinationId].name,
  }
}

function buildPath(points) {
  const cum = [0]
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + km(points[i - 1], points[i]))
  return { points, cum, total: cum[cum.length - 1] }
}
function pointAt(path, p) {
  const d = p * path.total
  let i = 1
  while (i < path.cum.length - 1 && path.cum[i] < d) i++
  const t = (d - path.cum[i - 1]) / ((path.cum[i] - path.cum[i - 1]) || 1)
  const a = path.points[i - 1], b = path.points[i]
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

function downloadContract(truck) {
  const { driver } = truck
  const content = [
    'SAMPLE DEMO DRIVER CONTRACT',
    'Illustrative fixture only. Not a legal document, offer, or verified identity record.',
    '',
    `Driver: ${driver.name}`,
    `Demo driver ID: ${driver.id}`,
    `Vehicle: ${truck.id}`,
    `Illustrative licence reference: ${driver.license}`,
    `Illustrative term through: ${driver.contractThrough}`,
    `Demo contract reference: ${driver.contract}`,
    '',
    'Replace this fixture with an approved, access-controlled document system before production use.',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${driver.contract}-SAMPLE.txt`
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function NetworkMap({ onSelectHub, alerts = [], notifications = [], automationEnabled = true, onAlert, onStopThreshold, onIncidentResolved, onToggleAutomation, onRequestHuman }) {
  const el = useRef(null)
  const sim = useRef(null)
  const mapRef = useRef(null)
  const bubblesRef = useRef(null)
  const viewModeRef = useRef('india')
  const worldRegionRef = useRef(null)
  const hubCb = useRef(onSelectHub)
  const onAlertRef = useRef(onAlert)
  const onIncidentResolvedRef = useRef(onIncidentResolved)
  const onStopThresholdRef = useRef(onStopThreshold)
  const alertSequence = useRef(0)
  const [level, setLevel] = useState('Country')
  const [log, setLog] = useState(() => { try { return JSON.parse(localStorage.getItem('ngl-log') || '[]') } catch { return [] } })
  const [stats, setStats] = useState({ transit: 0, delayed: 0, unloading: 0, congested: 0 })
  const [sel, setSel] = useState(null)
  const [picked, setPicked] = useState(null)
  const [roads, setRoads] = useState('Straight-line hub links (go online for road geometry)')
  const [viewMode, setViewMode] = useState('india')
  const [refreshSeconds, setRefreshSeconds] = useState(5)
  const [refreshedAt, setRefreshedAt] = useState(() => now())
  const [clockNow, setClockNow] = useState(0)

  useEffect(() => {
    hubCb.current = onSelectHub
    onAlertRef.current = onAlert
    onIncidentResolvedRef.current = onIncidentResolved
    onStopThresholdRef.current = onStopThreshold
  }, [onAlert, onIncidentResolved, onSelectHub, onStopThreshold])

  useEffect(() => {
    const updateClock = () => {
      const timestamp = Date.now()
      setClockNow(timestamp)
      setRefreshedAt(new Date(timestamp).toLocaleTimeString('en-IN', { hour12: false }))
    }
    updateClock()
    const timer = setInterval(updateClock, refreshSeconds * 1000)
    return () => clearInterval(timer)
  }, [refreshSeconds])

  useEffect(() => {
    const map = L.map(el.current, { center: [22.6, 79.5], zoom: 5, minZoom: 1, maxZoom: 17, zoomControl: false })
    mapRef.current = map
    L.control.zoom({ position: 'topright' }).addTo(map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', subdomains: 'abc', maxZoom: 19, noWrap: true,
    }).addTo(map)

    const addLog = (text, kind = 'info') => setLog((l) => {
      const next = [{ t: now(), text, kind }, ...l].slice(0, 60)
      try { localStorage.setItem('ngl-log', JSON.stringify(next)) } catch { /* storage unavailable */ }
      return next
    })

    // State-level view: India is shown as a network of state nodes and hub clusters.
    const stateSummary = Object.fromEntries(indiaStates.map((state) => [state.name, []]))
    warehouses.forEach((w) => {
      if (stateSummary[w.state]) stateSummary[w.state].push(w)
    })

    // Warehouses
    const wh = {}
    warehouses.forEach((w) => {
      wh[w.id] = { ...w, load: Math.round(w.cap * (0.45 + Math.random() * 0.3)), status: 'Normal' }
      wh[w.id].marker = L.marker([w.lat, w.lng], {
        icon: L.divIcon({ className: 'wh-icon', html: `<div class="wh-pin"></div><span class="wh-label">${w.name}</span>`, iconSize: [22, 22] }),
      }).addTo(map).on('click', () => { setSel({ type: 'wh', id: w.id }); setPicked(wh[w.id]); hubCb.current?.(w.id) })
        wh[w.id].fence = L.circle([w.lat, w.lng], { radius: 6000, color: '#0b7a75', weight: 1, fillOpacity: 0.08, className: 'india-fence' }).addTo(map)
    })

    // State bubbles (country view)
    const bubbles = L.layerGroup().addTo(map)
    Object.entries(stateSummary).forEach(([state, list]) => {
      if (!list.length) return
      const lat = list.reduce((s, w) => s + w.lat, 0) / list.length
      const lng = list.reduce((s, w) => s + w.lng, 0) / list.length
      L.marker([lat, lng], {
        icon: L.divIcon({ className: 'state-bubble', html: `<b>${list.length}</b><span>${state}</span>`, iconSize: [92, 38] }),
      }).addTo(bubbles).on('click', () => map.fitBounds(L.latLngBounds(list.map((w) => [w.lat, w.lng])).pad(0.8), { maxZoom: 8 }))
    })
    bubblesRef.current = bubbles

    const globalLayer = L.layerGroup()
    globalMarkets.forEach((market) => {
      L.marker([market.lat, market.lng], {
        icon: L.divIcon({ className: 'market-icon', html: `<span>${market.id}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] }),
        title: `${market.name} service area · map anchor: ${market.anchor}`,
      }).addTo(globalLayer).on('click', () => {
        setSel({ type: 'market', id: market.id })
        setPicked(market)
        worldRegionRef.current = market.country
        setLevel('Hub')
        map.setView([market.lat, market.lng], 5, { animate: false })
      })
    })
    globalLayer.addTo(map)

    const internationalLayer = L.layerGroup().addTo(map)
    const internationalWh = {}
    internationalWarehouses.forEach((warehouse) => {
      internationalWh[warehouse.id] = { ...warehouse, load: Math.round(warehouse.cap * (0.45 + Math.random() * 0.3)), status: 'Normal' }
      internationalWh[warehouse.id].marker = L.marker([warehouse.lat, warehouse.lng], {
        icon: L.divIcon({ className: 'intl-wh-icon', html: `<div class="wh-pin"></div><span class="wh-label">${warehouse.name}</span>`, iconSize: [22, 22] }),
        title: `${warehouse.name} · simulated demo hub`,
      }).addTo(internationalLayer).on('click', () => {
        setSel({ type: 'international-wh', id: warehouse.id })
        setPicked(internationalWh[warehouse.id])
        worldRegionRef.current = warehouse.country
        hubCb.current?.(warehouse.id)
      })
    })
    const internationalPaths = internationalCorridors.map(([fromId, toId]) => buildPath([
      [internationalWhById[fromId].lat, internationalWhById[fromId].lng],
      [internationalWhById[toId].lat, internationalWhById[toId].lng],
    ]))
    internationalCorridors.forEach((_, index) => L.polyline(internationalPaths[index].points, {
      color: '#c26a49', weight: 2, opacity: 0.68, dashArray: '5 6', className: 'international-corridor',
    }).addTo(internationalLayer))
    const internationalFleet = seedInternationalTrucks.map((truck) => {
      const vehicle = { ...truck, status: 'In transit', wait: 0, trips: 0 }
      vehicle.marker = L.marker(pointAt(internationalPaths[vehicle.corridor], vehicle.progress), {
        icon: L.divIcon({ className: 'intl-truck-icon', html: '<div class="truck-dot"></div><span class="truck-label"></span>', iconSize: [18, 18] }),
        title: `${vehicle.id} · simulated international fleet`,
      }).addTo(internationalLayer).on('click', () => {
        setSel({ type: 'international-truck', id: vehicle.id })
        setPicked(vehicle)
        worldRegionRef.current = internationalWhById[vehicle.from].country
      })
      return vehicle
    })

    // Corridors, trucks
    const paths = corridors.map(([a, b]) => buildPath([[whById[a].lat, whById[a].lng], [whById[b].lat, whById[b].lng]]))
    const lines = corridors.map((_, i) => L.polyline(paths[i].points, { color: '#0b7a75', weight: 2, opacity: 0.55, dashArray: '6 6', className: 'india-route' }).addTo(map))
    const fleet = seedTrucks.map((t) => {
      const o = { ...t, status: 'In transit', wait: 0, trips: 0, delayReason: '' }
      o.marker = L.marker([0, 0], { icon: L.divIcon({ className: 'truck-icon', html: '<div class="truck-dot"></div><span class="truck-label"></span>', iconSize: [18, 18] }) })
        .addTo(map).on('click', () => { setSel({ type: 'truck', id: t.id }); setPicked(o) })
      return o
    })
    internationalFleet.forEach((truck) => { truck.delayReason = '' })

    const reportIncident = (vehicle, scope, location) => {
      const id = `${vehicle.id}-${Date.now()}-${++alertSequence.current}`
      vehicle.activeIncidentId = id
      vehicle.lastDelayReason = vehicle.delayReason
      const incident = {
        id,
        truckId: vehicle.id,
        scope,
        reason: vehicle.delayReason,
        location,
        severity: /puncture|blockage|Unplanned stop/i.test(vehicle.delayReason) ? 'Critical' : 'High',
        requiresHuman: /puncture|blockage|Unplanned stop/i.test(vehicle.delayReason),
        createdAt: new Date().toISOString(),
        driver: vehicle.driver,
      }
      onAlertRef.current?.(incident)
    }

    const checkUnplannedStopThreshold = (vehicle) => {
      if (
        vehicle.unplannedStopStartedAt
        && !vehicle.stopThresholdReached
        && Date.now() - vehicle.unplannedStopStartedAt >= UNPLANNED_STOP_THRESHOLD_MS
      ) {
        vehicle.stopThresholdReached = true
        onStopThresholdRef.current?.(vehicle.activeIncidentId)
      }
    }

    // Road geometry from OSRM (optional, cached); falls back to straight links
    const loadRoads = async () => {
      let ok = 0
      for (let i = 0; i < corridors.length; i++) {
        const [a, b] = corridors[i]
        const key = `ngl-road-${a}-${b}`
        try {
          let pts = JSON.parse(localStorage.getItem(key) || 'null')
          if (!pts) {
            const A = whById[a], B = whById[b]
            const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${A.lng},${A.lat};${B.lng},${B.lat}?overview=simplified&geometries=geojson`)
            const j = await r.json()
            pts = j.routes[0].geometry.coordinates.map(([x, y]) => [y, x])
            localStorage.setItem(key, JSON.stringify(pts))
          }
          paths[i] = buildPath(pts); lines[i].setLatLngs(pts).setStyle({ dashArray: null, opacity: 0.7 }); ok++
        } catch { /* keep straight link */ }
      }
      if (ok) setRoads(`Real road geometry loaded for ${ok}/${corridors.length} corridors`)
    }
    loadRoads()

    const tick = () => {
      fleet.forEach((t) => {
        const path = paths[t.corridor]
        const from = whById[t.dir === 1 ? t.from : t.to], to = whById[t.dir === 1 ? t.to : t.from]
        if (t.status === 'Unloading' || t.status === 'Delayed') {
          if (t.unplannedStopStartedAt) {
            checkUnplannedStopThreshold(t)
          } else if (--t.wait <= 0) {
            if (t.status === 'Delayed') {
              addLog(`${t.id} resumed after delay`, 'ok')
              if (t.activeIncidentId) onIncidentResolvedRef.current?.(t.activeIncidentId)
              t.activeIncidentId = ''
              t.delayReason = ''
            }
            else { wh[to.id].load = Math.max(0, wh[to.id].load - 40); t.dir *= -1; t.trips++; addLog(`${t.id} left ${to.name} with new load`, 'info') }
            t.status = 'In transit'
          }
        } else {
          t.progress += ((t.speed / 60) / (path.total || 1)) * (t.dir === 1 ? 1 : -1)
          if (Math.random() < 0.0008) {
            t.status = 'Delayed'; t.wait = 8
            t.delayReason = delayReasons[Math.floor(Math.random() * delayReasons.length)]
            addLog(`${t.id} delayed near ${from.name}: ${t.delayReason}`, 'warn')
            reportIncident(t, 'india', from.name)
          }
          if (t.progress >= 1 || t.progress <= 0) {
            t.progress = Math.min(1, Math.max(0, t.progress)); t.status = 'Unloading'; t.wait = 6
            wh[to.id].load = Math.min(wh[to.id].cap, wh[to.id].load + 40)
            addLog(`${t.id} reached ${to.name}, unloading ${t.cargo}`, 'info')
          }
        }
        const pos = pointAt(path, t.progress)
        t.marker.setLatLng(pos)
        const dot = t.marker.getElement()
        if (dot) {
          dot.dataset.status = t.status
          dot.querySelector('.truck-label').textContent = `${t.id.split('-')[0]}-${t.id.split('-')[2]} · ${t.status === 'In transit' ? t.speed + ' km/h' : t.status}`
        }
      })

      internationalFleet.forEach((truck) => {
        const path = internationalPaths[truck.corridor]
        const from = internationalWhById[truck.direction === 1 ? truck.from : truck.to]
        const to = internationalWhById[truck.direction === 1 ? truck.to : truck.from]
        if (truck.status === 'Unloading' || truck.status === 'Delayed') {
          if (truck.unplannedStopStartedAt) {
            checkUnplannedStopThreshold(truck)
          } else if (--truck.wait <= 0) {
            if (truck.status === 'Delayed') {
              addLog(`${truck.id} resumed near ${from.name}`, 'ok')
              if (truck.activeIncidentId) onIncidentResolvedRef.current?.(truck.activeIncidentId)
              truck.activeIncidentId = ''
              truck.delayReason = ''
            }
            else {
              internationalWh[to.id].load = Math.max(0, internationalWh[to.id].load - 25)
              truck.direction *= -1
              truck.trips++
              addLog(`${truck.id} departed ${to.name} on regional corridor`, 'info')
            }
            truck.status = 'In transit'
          }
        } else {
          truck.progress += ((truck.speed / 60) / (path.total || 1)) * truck.direction
          if (Math.random() < 0.0008) {
            truck.status = 'Delayed'
            truck.wait = 8
            truck.delayReason = delayReasons[Math.floor(Math.random() * delayReasons.length)]
            addLog(`${truck.id} delayed near ${from.name}: ${truck.delayReason}`, 'warn')
            reportIncident(truck, 'international', from.name)
          }
          if (truck.progress >= 1 || truck.progress <= 0) {
            truck.progress = Math.min(1, Math.max(0, truck.progress))
            truck.status = 'Unloading'
            truck.wait = 5
            internationalWh[to.id].load = Math.min(internationalWh[to.id].cap, internationalWh[to.id].load + 25)
            addLog(`${truck.id} reached ${to.name}, unloading ${truck.cargo}`, 'info')
          }
        }
        truck.marker.setLatLng(pointAt(path, truck.progress))
        const marker = truck.marker.getElement()
        if (marker) {
          marker.dataset.status = truck.status
          marker.querySelector('.truck-label').textContent = `${truck.id} · ${truck.status === 'In transit' ? `${truck.speed} km/h` : truck.status}`
        }
      })

      let congested = 0
      Object.values(wh).forEach((w) => {
        const u = w.load / w.cap
        const s = u > 0.9 ? 'Congested' : u > 0.75 ? 'Busy' : 'Normal'
        if (s !== w.status) { addLog(`${w.name} is now ${s} (${Math.round(u * 100)}% full)`, s === 'Congested' ? 'warn' : 'info'); w.status = s }
        if (s === 'Congested') congested++
        w.marker.getElement()?.setAttribute('data-status', s)
      })
      let internationalCongested = 0
      Object.values(internationalWh).forEach((warehouse) => {
        const utilization = warehouse.load / warehouse.cap
        warehouse.status = utilization > 0.9 ? 'Congested' : utilization > 0.75 ? 'Busy' : 'Normal'
        if (warehouse.status === 'Congested') internationalCongested++
        warehouse.marker.getElement()?.setAttribute('data-status', warehouse.status)
      })
      const regionalInternationalFleet = worldRegionRef.current
        ? internationalFleet.filter((truck) => internationalWhById[truck.from].country === worldRegionRef.current)
        : internationalFleet
      const regionalInternationalHubs = worldRegionRef.current
        ? Object.values(internationalWh).filter((warehouse) => warehouse.country === worldRegionRef.current)
        : Object.values(internationalWh)
      const regionalInternationalCongested = regionalInternationalHubs.filter((warehouse) => warehouse.status === 'Congested').length
      const activeFleet = viewModeRef.current === 'world' ? regionalInternationalFleet : fleet
      setStats({
        transit: activeFleet.filter((t) => t.status === 'In transit').length,
        delayed: activeFleet.filter((t) => t.status === 'Delayed').length,
        unloading: activeFleet.filter((t) => t.status === 'Unloading').length,
        congested: viewModeRef.current === 'world' ? (worldRegionRef.current ? regionalInternationalCongested : internationalCongested) : congested,
      })
    }

    const apply = () => {
      const z = map.getZoom()
      const nextLevel = viewModeRef.current === 'world' ? worldLevelOf(z) : levelOf(z)
      setLevel(nextLevel)
      if (viewModeRef.current === 'india' && z < 6) map.addLayer(bubbles); else map.removeLayer(bubbles)
    }
    map.on('zoomend', apply); apply()
    const timer = setInterval(tick, 1000); tick()
    sim.current = { fleet, wh, internationalFleet, internationalWh }
    return () => {
      clearInterval(timer)
      const activeVehicles = [...fleet, ...internationalFleet]
      activeVehicles.forEach((truck) => {
        if (truck.activeIncidentId) onIncidentResolvedRef.current?.(truck.activeIncidentId, 'Local map simulation stopped')
      })
      mapRef.current = null
      bubblesRef.current = null
      map.remove()
    }
  }, [])

  const setMapView = (view) => {
    const map = mapRef.current
    if (!map) return
    viewModeRef.current = view
    setViewMode(view)
    setLevel(view === 'world' ? 'World' : 'Country')
    if (view === 'world') {
      worldRegionRef.current = null
      if (bubblesRef.current && map.hasLayer(bubblesRef.current)) map.removeLayer(bubblesRef.current)
      map.flyTo([20, 0], 1, { duration: 0.8 })
    } else {
      worldRegionRef.current = null
      map.flyTo([22.6, 79.5], 5, { duration: 0.8 })
    }
  }

  const simulateStoppedVehicle = () => {
    if (!sel?.type.includes('truck')) return
    const vehicle = sim.current?.fleet.find((truck) => truck.id === sel.id)
      || sim.current?.internationalFleet.find((truck) => truck.id === sel.id)
    if (!vehicle) return
    vehicle.status = 'Delayed'
    vehicle.wait = 0
    vehicle.delayReason = 'Unplanned stop — no scheduled break reported'
    vehicle.lastDelayReason = vehicle.delayReason
    vehicle.unplannedStopStartedAt = Date.now()
    vehicle.stopThresholdReached = false
    const incidentId = `${vehicle.id}-${Date.now()}-${++alertSequence.current}`
    vehicle.activeIncidentId = incidentId
    const international = vehicle.id.startsWith('NGL-INT')
    const hub = (international ? internationalWhById : whById)[(vehicle.dir ?? vehicle.direction) === 1 ? vehicle.from : vehicle.to]
    onAlertRef.current?.({
      id: incidentId,
      truckId: vehicle.id,
      scope: international ? 'international' : 'india',
      reason: vehicle.delayReason,
      location: hub?.name || 'Current route',
      severity: 'Monitoring',
      requiresHuman: false,
      stopMonitoring: true,
      stopStartedAt: new Date(vehicle.unplannedStopStartedAt).toISOString(),
      createdAt: new Date().toISOString(),
      driver: vehicle.driver,
    })
    setRefreshedAt(now())
    setClockNow(Date.now())
  }

  const simulateOneHourStopped = () => {
    if (!sel?.type.includes('truck')) return
    const vehicle = sim.current?.fleet.find((truck) => truck.id === sel.id)
      || sim.current?.internationalFleet.find((truck) => truck.id === sel.id)
    if (!vehicle?.unplannedStopStartedAt || !vehicle.activeIncidentId) return
    vehicle.unplannedStopStartedAt = Date.now() - UNPLANNED_STOP_THRESHOLD_MS
    vehicle.stopThresholdReached = false
    setRefreshedAt(now())
    setClockNow(Date.now())
  }

  return (
    <section className="nm-wrap" aria-label="Live NGL network map">
      <div ref={el} className="nm-map" data-level={level.toLowerCase()} data-view={viewMode} />
      <div className="nm-badge"><span>Zoom level</span><b>{level}</b><em>{viewMode === 'world' ? `${globalMarkets.length} SERVICE AREAS · INDICATIVE ANCHORS` : 'India › State › Area › Road'}</em></div>
      <div className="nm-panel">
        <div className="nm-view-switch" role="group" aria-label="Map extent">
          <button type="button" aria-pressed={viewMode === 'world'} className={viewMode === 'world' ? 'active' : ''} onClick={() => setMapView('world')}>World</button>
          <button type="button" aria-pressed={viewMode === 'india'} className={viewMode === 'india' ? 'active' : ''} onClick={() => setMapView('india')}>India</button>
        </div>
        <div className="nm-stats">
          <div><b>{stats.transit}</b>In transit</div>
          <div className="warn"><b>{stats.delayed}</b>Delayed</div>
          <div><b>{stats.unloading}</b>At hub</div>
          <div className="warn"><b>{stats.congested}</b>Congested hubs</div>
        </div>
        <div className="nm-refresh">
          <label>Refresh
            <select value={refreshSeconds} onChange={(event) => setRefreshSeconds(Number(event.target.value))} aria-label="Dashboard refresh interval">
              <option value={5}>Every 5 sec</option><option value={15}>Every 15 sec</option><option value={30}>Every 30 sec</option>
            </select>
          </label>
          <span>Updated {refreshedAt}</span>
        </div>
        <section className="nm-incident-section" aria-label="Prioritized incident queue">
          <div className="nm-section-heading"><h4>Priority issue queue</h4><b>{alerts.filter((alert) => !alert.resolved).length} open</b></div>
          {alerts.some((alert) => !alert.resolved) ? <ul className="nm-alert-list">{alerts.filter((alert) => !alert.resolved).slice(0, 5).map((alert) => <li key={alert.id} className={alert.stopMonitoring && !alert.stopThresholdReached ? 'monitoring' : alert.severity.toLowerCase()}>
            <button type="button" onClick={() => {
              const international = alert.scope === 'international'
              setMapView(international ? 'world' : 'india')
              setSel({ type: international ? 'international-truck' : 'truck', id: alert.truckId })
              setPicked(international
                ? sim.current?.internationalFleet.find((truck) => truck.id === alert.truckId)
                : sim.current?.fleet.find((truck) => truck.id === alert.truckId))
            }}>
              <b>{alert.stopMonitoring && !alert.stopThresholdReached ? 'Monitoring unplanned stop' : `${alert.severity} · ${alert.truckId}`}</b><span>{alert.reason}</span><small>{alert.location} · {alert.stopMonitoring ? `${Math.min(60, Math.floor((clockNow - Date.parse(alert.stopStartedAt)) / 60000))} / 60 min` : new Date(alert.createdAt).toLocaleTimeString('en-IN', { hour12: false })}{alert.humanRequested ? ' · Human follow-up queued' : ''}</small>
            </button>
            {alert.stopMonitoring && !alert.stopThresholdReached && picked?.id === alert.truckId && sel?.type.includes('truck') ? <button className="nm-escalate" type="button" onClick={simulateOneHourStopped}>Demo: simulate 60 minutes stopped</button> : null}
            {alert.requiresHuman && !alert.humanRequested ? <button className="nm-escalate" type="button" onClick={() => onRequestHuman?.(alert.id)}>Request human</button> : null}
          </li>)}</ul> : <p className="nm-note">No active issues. Simulated stop events appear here automatically.</p>}
          <label className="nm-automation"><input type="checkbox" checked={automationEnabled} onChange={(event) => onToggleAutomation?.(event.target.checked)} /> Queue demo driver messages (critical issues immediately; stops after 60 min)</label>
          <p className="nm-note">Routine delays stay in the issue queue without messaging the driver. Critical incidents queue a safety message when enabled and an Operations task immediately; unplanned stops are monitored for 60 minutes first. Local demo only—nothing is sent externally.</p>
        </section>
        {picked ? (
          <div className="nm-sel">
            <strong>{picked.name || picked.id}</strong>
            {sel.type === 'market' ? <><span>Service coverage: {picked.country}</span><span>Map anchor: {picked.anchor} · indicative, not a confirmed hub</span></> : <><span>Status: {picked.status}</span>{sel.type === 'wh' || sel.type === 'international-wh' ? <span>Load {picked.load}/{picked.cap} units · {picked.country || picked.state}{sel.type === 'international-wh' ? ' · simulated demo hub' : ''}</span> : <span>{picked.cargo} · {picked.speed} km/h · {picked.trips} trips{sel.type === 'international-truck' ? ' · simulated' : ''}</span>}</>}
            {sel.type.includes('truck') ? <>
              {picked.delayReason ? <span className="nm-delay-reason"><b>Delay reason:</b> {picked.delayReason}</span> : picked.lastDelayReason ? <span className="nm-delay-reason"><b>Most recent delay:</b> {picked.lastDelayReason} · vehicle moving</span> : <span className="nm-note">No current delay reason recorded.</span>}
              <div className="nm-driver-card">
                <div className="nm-driver-avatar" aria-label={`Illustrated avatar for ${picked.driver.name}`}><svg viewBox="0 0 64 64" role="img" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#dceee6"/><path d="M12 57c2-12 9-18 20-18s18 6 20 18" fill="#287a68"/><circle cx="32" cy="25" r="12" fill="#c88e69"/><path d="M20 24c0-11 5-16 13-16 9 0 14 7 12 17l-4-7c-7 2-13 1-18-2z" fill="#263e37"/></svg></div>
                <div><b>{picked.driver.name}</b><small>Fictional demo driver · age {picked.driver.age}</small></div>
              </div>
              <span>Contact: {picked.driver.phone} · illustrative number; not callable</span>
              <span>Email: {picked.driver.email} · reserved demo address; not deliverable</span>
              <span>Licence: {picked.driver.license} · demo fixture</span>
              <span>Contract: {picked.driver.contract} · through {picked.driver.contractThrough}</span>
              <button type="button" className="nm-contract" onClick={() => downloadContract(picked)}>Download sample contract</button>
              <h4>Truck shipment manifest</h4>
              <p className="nm-note">Estimates use remaining route distance, current speed, and a handling buffer. Delays can change them; route and delivery data are illustrative.</p>
              <ul className="nm-manifest">{picked.manifest.map((item, index) => {
                const estimate = estimateManifestDelivery(picked, index, clockNow)
                return <li key={item.id}><b>{item.id}</b><span>{item.description} · {item.packages} packages</span><small>{item.priority} priority</small><small className="nm-eta">{estimate ? `Expected by ${formatDeliveryTime(estimate.at)} · ${estimate.destination}` : 'Calculating expected delivery…'}</small></li>
              })}</ul>
              <section className="nm-delivery-history" aria-label="Synthetic delivery history">
                <div className="nm-section-heading"><h4>Recent delivery history</h4><b>{picked.deliveryHistory.filter((delivery) => delivery.onTime).length}/{picked.deliveryHistory.length} on time</b></div>
                <strong className="nm-on-time-rate">{Math.round(100 * picked.deliveryHistory.filter((delivery) => delivery.onTime).length / picked.deliveryHistory.length)}% <span>on-time delivery rate · last {picked.deliveryHistory.length} demo deliveries</span></strong>
                <ul className="nm-manifest">{picked.deliveryHistory.map((delivery) => <li key={delivery.id} className={delivery.onTime ? 'delivered-on-time' : 'delivered-late'}>
                  <b>{delivery.id}</b>
                  <span>Expected {formatDeliveryTime(delivery.expectedAt)}</span>
                  <small>Actual {formatDeliveryTime(delivery.actualAt)} · {delivery.onTime ? 'On time' : 'Late'}</small>
                </li>)}</ul>
                <p className="nm-note">Synthetic history for demo only; replace with verified completed-shipment records in production.</p>
              </section>
              {picked.unplannedStopStartedAt ? <>
                <span className="nm-stop-watch">{picked.stopThresholdReached ? `60-minute threshold reached · driver reason request ${automationEnabled ? 'queued' : 'paused'} · human follow-up queued` : `Unplanned stop monitoring · ${Math.min(60, Math.floor((clockNow - picked.unplannedStopStartedAt) / 60000))} / 60 minutes`}</span>
                {!picked.stopThresholdReached ? <button type="button" className="nm-test-alert" onClick={simulateOneHourStopped}>Demo: simulate 60 minutes stopped</button> : null}
              </> : <button type="button" className="nm-test-alert" onClick={simulateStoppedVehicle}>Test unplanned stop monitor</button>}
            </> : null}
          </div>
        ) : <div className="nm-sel muted">Click a hub or truck to inspect it. Zoom in to move from India to state, area and road view.</div>}
        <section className="nm-notification-section" aria-label="Local notification outbox">
          <h4>Demo notification outbox</h4>
          {notifications.length ? <ul className="nm-log">{notifications.slice(0, 3).map((notification) => <li key={notification.id} className="warn"><time>{new Date(notification.createdAt).toLocaleTimeString('en-IN', { hour12: false })} · QUEUED LOCALLY</time> · {notification.channel}{notification.recipient ? ` to ${notification.recipient}` : ''} · {notification.truckId}: {notification.message || notification.reason}</li>)}</ul> : <p className="nm-note">No notifications queued yet.</p>}
        </section>
        <h4>Status log (saved on this device)</h4>
        <ul className="nm-log">{log.slice(0, 14).map((e, i) => <li key={i} className={e.kind}><time>{e.t}</time>{e.text}</li>)}</ul>
        <p className="nm-note">{viewMode === 'world' ? 'International warehouses, corridors, fleet, and movement are simulated demo data, not confirmed NGL operations.' : `${roads}. Indian fleet and hub data are illustrative.`}</p>
      </div>
    </section>
  )
}
