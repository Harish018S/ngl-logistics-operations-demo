import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { franchiseData } from '../src/data/franchises.js'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const reportDate = process.argv[2] || new Date().toISOString().slice(0, 10)
if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate) || Number.isNaN(Date.parse(`${reportDate}T00:00:00Z`))) {
  throw new Error('Pass the report date as YYYY-MM-DD.')
}

const seedRandom = (initialSeed) => {
  let seed = initialSeed >>> 0
  return () => {
    seed += 0x6D2B79F5
    let value = seed
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const rand = seedRandom(20261005)
const choose = (items) => items[Math.floor(rand() * items.length)]
const between = (min, max) => min + rand() * (max - min)
const rounded = (value, digits = 0) => Number(value.toFixed(digits))
const modes = ['Ground', 'Ground', 'Ground', 'Air Freight', 'Sea Freight']
const priorities = ['Standard', 'Standard', 'Standard', 'Today', 'Urgent']
const regions = ['North', 'South', 'East', 'West', 'Central', 'North-East']
const cargo = ['Documents', 'Consumer parcels', 'Industrial components', 'Textiles', 'Medical supplies', 'Electronics', 'Food products']

const columns = [
  'shipment_id', 'shipment_date', 'franchise_id', 'origin_city', 'destination_region',
  'service_mode', 'priority', 'package_count', 'weight_kg', 'distance_km',
  'scheduled_transit_hours', 'pickup_delay_minutes', 'route_congestion_index',
  'rainfall_mm', 'hub_backlog_percent', 'document_issue', 'vehicle_utilization_percent',
  'driver_hours_before_dispatch', 'route_deviation_km', 'scan_gap_hours',
  'is_cross_border', 'weekend_or_holiday', 'cargo_category',
  'actual_delivery_at', 'actual_delay_minutes', 'late_delivery',
]
const escapeCsv = (value) => {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function timeAt(date, hour, minute = 0) {
  return `${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`
}

function buildShipment(branch, date, index, shipmentNumber) {
  const mode = choose(modes)
  const priority = choose(priorities)
  const crossBorder = branch.country !== 'India' || rand() < 0.055
  const distance = rounded(between(65, mode === 'Sea Freight' ? 3100 : 1700))
  const scheduledHours = rounded(Math.max(3, distance / (mode === 'Air Freight' ? 560 : mode === 'Sea Freight' ? 32 : 48) + between(1.5, 12)), 1)
  const pickupDelay = rounded(Math.max(0, between(-25, 125)))
  const congestion = rounded(Math.min(1, Math.max(0, between(0.05, 0.86) + (index % 13 === 0 ? 0.17 : 0))), 2)
  const seasonalRain = new Date(`${date}T00:00:00Z`).getUTCMonth() >= 5 && new Date(`${date}T00:00:00Z`).getUTCMonth() <= 9
  const rainfall = rounded(Math.max(0, between(0, seasonalRain ? 58 : 22)), 1)
  const hubBacklog = rounded(between(25, 96))
  const documentIssue = Number(crossBorder && (mode !== 'Ground') && rand() < 0.16 || rand() < 0.035)
  const vehicleUtilization = rounded(between(52, 100))
  const driverHours = rounded(between(0, 10), 1)
  const routeDeviation = rounded(Math.max(0, between(0, 65) + (congestion > 0.8 ? 12 : 0)), 1)
  const scanGap = rounded(Math.max(0, between(0, 10) + (index % 17 === 0 ? between(2, 8) : 0)), 1)
  const weekend = Number([0, 6].includes(new Date(`${date}T00:00:00Z`).getUTCDay()))
  const packageCount = Math.floor(between(1, 32))
  const weight = rounded(between(0.2, 480), 1)
  const riskFactors = [
    { name: 'Pickup departure variance', value: `${pickupDelay} min`, contribution: pickupDelay / 105 * 0.78 },
    { name: 'Route congestion', value: `${Math.round(congestion * 100)} / 100`, contribution: congestion * 1.15 },
    { name: 'Weather exposure', value: `${rainfall} mm rainfall`, contribution: rainfall / 55 * 0.35 },
    { name: 'Hub backlog', value: `${hubBacklog}%`, contribution: hubBacklog / 100 * 0.66 },
    { name: 'Document check', value: documentIssue ? 'Issue flagged' : 'No issue', contribution: documentIssue * 0.92 },
    { name: 'Vehicle utilization', value: `${vehicleUtilization}%`, contribution: vehicleUtilization / 100 * 0.58 },
    { name: 'Driver duty hours', value: `${driverHours} hours`, contribution: driverHours / 12 * 0.48 },
    { name: 'Route deviation', value: `${routeDeviation} km`, contribution: routeDeviation / 70 * 0.6 },
    { name: 'Tracking scan gap', value: `${scanGap} hours`, contribution: scanGap / 12 * 0.48 },
    { name: 'Cross-border handoff', value: crossBorder ? 'Yes' : 'No', contribution: Number(crossBorder) * 0.38 },
    { name: 'Priority', value: priority, contribution: Number(priority === 'Urgent') * 0.13 + Number(priority === 'Today') * 0.08 },
    { name: 'Service mode', value: mode, contribution: Number(mode === 'Sea Freight') * 0.16 },
  ]
  const eta = rounded(-3 + riskFactors.reduce((sum, factor) => sum + factor.contribution, 0), 3)
  const riskProbability = 1 / (1 + Math.exp(-eta))
  const lateDelivery = Number(rand() < riskProbability)
  const delayMinutes = lateDelivery ? Math.floor(between(18, 960)) : -Math.floor(between(0, 70))
  const hour = Math.floor(between(5, 20))
  const promisedAt = new Date(Date.parse(timeAt(date, hour)) + scheduledHours * 3600000)
  const actualAt = new Date(promisedAt.getTime() + delayMinutes * 60000)
  const risk = Math.round(riskProbability * 100)
  const topFeatures = riskFactors
    .filter((factor) => factor.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((factor) => factor.name)
  const likelyCause = risk >= 70
    ? `${topFeatures[0]} and ${topFeatures[1].toLowerCase()} are reducing the shipment's schedule buffer.`
    : `${topFeatures[0]} is the main watch item; no high-risk condition is currently indicated.`
  const recommendedAction = documentIssue
    ? 'Validate the shipment documents before handoff and assign a branch owner to confirm clearance.'
    : pickupDelay > 60
      ? 'Confirm the pickup appointment and re-sequence the route before the dispatch cutoff.'
      : congestion > 0.72 || rainfall > 35
        ? 'Check the next route update and notify the receiving hub of the expected arrival window.'
        : 'Continue milestone monitoring and confirm the next scan at the scheduled checkpoint.'

  return {
    shipment_id: `AWB-${date.replaceAll('-', '')}-${String(shipmentNumber).padStart(5, '0')}`,
    shipment_date: date,
    franchise_id: branch.id,
    origin_city: branch.city,
    destination_region: choose(regions),
    service_mode: mode,
    priority,
    package_count: packageCount,
    weight_kg: weight,
    distance_km: distance,
    scheduled_transit_hours: scheduledHours,
    pickup_delay_minutes: pickupDelay,
    route_congestion_index: congestion,
    rainfall_mm: rainfall,
    hub_backlog_percent: hubBacklog,
    document_issue: documentIssue,
    vehicle_utilization_percent: vehicleUtilization,
    driver_hours_before_dispatch: driverHours,
    route_deviation_km: routeDeviation,
    scan_gap_hours: scanGap,
    is_cross_border: Number(crossBorder),
    weekend_or_holiday: weekend,
    cargo_category: choose(cargo),
    actual_delivery_at: actualAt.toISOString(),
    actual_delay_minutes: delayMinutes,
    late_delivery: lateDelivery,
    app_record: {
      id: `AWB-${date.replaceAll('-', '')}-${String(shipmentNumber).padStart(5, '0')}`,
      date,
      franchise: branch.id,
      route: `${branch.city} → ${regions[shipmentNumber % regions.length]}${crossBorder ? ' · Cross-border' : ''}`,
      mode,
      risk,
      topFeatures,
      ...(risk >= 70 ? { riskFactors: riskFactors.sort((a, b) => b.contribution - a.contribution).slice(0, 5) } : {}),
      likelyCause,
      recommendedAction,
      lateDelivery,
    },
  }
}

const reportDay = new Date(`${reportDate}T00:00:00Z`)
const historyDays = 30
const records = []
for (let dayOffset = -historyDays; dayOffset <= 0; dayOffset++) {
  const date = new Date(reportDay.getTime() + dayOffset * 86400000).toISOString().slice(0, 10)
  for (const branch of franchiseData) {
    const targetCount = branch.kpis.shipmentsToday
    const volumeFactor = dayOffset === 0 ? 1 : 0.78 + 0.34 * ((Math.sin((dayOffset + 37) * 0.71) + 1) / 2)
    const count = dayOffset === 0 ? targetCount : Math.max(1, Math.round(targetCount * volumeFactor))
    for (let index = 0; index < count; index++) {
      records.push(buildShipment(branch, date, index, records.length + 1))
    }
  }
}

const csvRows = [columns.join(',')]
for (const record of records) csvRows.push(columns.map((column) => escapeCsv(record[column])).join(','))

const csvPath = resolve(projectRoot, 'public', 'demo_training_shipments.csv')
const appPath = resolve(projectRoot, 'src', 'data', 'demo_shipments_today.json')
const todaysShipments = records.filter((record) => record.shipment_date === reportDate).map((record) => record.app_record)
await mkdir(dirname(csvPath), { recursive: true })
await Promise.all([
  writeFile(csvPath, `${csvRows.join('\n')}\n`, 'utf8'),
  writeFile(appPath, `${JSON.stringify({ reportDate, source: 'synthetic-demo-fixture', shipments: todaysShipments }, null, 2)}\n`, 'utf8'),
])
console.log(`Generated ${records.length} labeled shipment rows (${todaysShipments.length} on report day ${reportDate}).`)
console.log(`CSV: ${csvPath}`)
console.log(`Dashboard JSON: ${appPath}`)
