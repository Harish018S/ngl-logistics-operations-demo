// India-first logistics dataset for the NGL Next demo.
// The goal is to mimic a real operating network without relying on external
// services or Kaggle downloads during screening.

export const indiaStates = [
  { id: 'delhi', name: 'Delhi', region: 'North', lat: 28.6139, lng: 77.2090 },
  { id: 'chandigarh', name: 'Chandigarh', region: 'North', lat: 30.7333, lng: 76.7794 },
  { id: 'punjab', name: 'Punjab', region: 'North', lat: 31.1471, lng: 75.3412 },
  { id: 'haryana', name: 'Haryana', region: 'North', lat: 29.0588, lng: 76.0856 },
  { id: 'uttarakhand', name: 'Uttarakhand', region: 'North', lat: 30.3165, lng: 78.0322 },
  { id: 'rajasthan', name: 'Rajasthan', region: 'North-West', lat: 27.0238, lng: 74.2179 },
  { id: 'gujarat', name: 'Gujarat', region: 'West', lat: 22.2587, lng: 71.1924 },
  { id: 'maharashtra', name: 'Maharashtra', region: 'West', lat: 19.7515, lng: 75.7139 },
  { id: 'goa', name: 'Goa', region: 'West', lat: 15.2993, lng: 74.1240 },
  { id: 'madhya-pradesh', name: 'Madhya Pradesh', region: 'Central', lat: 22.9734, lng: 78.6569 },
  { id: 'chhattisgarh', name: 'Chhattisgarh', region: 'Central', lat: 21.2787, lng: 81.8661 },
  { id: 'uttar-pradesh', name: 'Uttar Pradesh', region: 'North', lat: 26.8467, lng: 80.9462 },
  { id: 'bihar', name: 'Bihar', region: 'East', lat: 25.0961, lng: 85.3131 },
  { id: 'jharkhand', name: 'Jharkhand', region: 'East', lat: 23.6102, lng: 85.2799 },
  { id: 'west-bengal', name: 'West Bengal', region: 'East', lat: 22.9868, lng: 87.8550 },
  { id: 'odisha', name: 'Odisha', region: 'East', lat: 20.9517, lng: 85.0985 },
  { id: 'assam', name: 'Assam', region: 'North-East', lat: 26.2006, lng: 92.9376 },
  { id: 'tripura', name: 'Tripura', region: 'North-East', lat: 23.9408, lng: 91.9882 },
  { id: 'meghalaya', name: 'Meghalaya', region: 'North-East', lat: 25.4670, lng: 91.3662 },
  { id: 'nagaland', name: 'Nagaland', region: 'North-East', lat: 26.1584, lng: 94.5624 },
  { id: 'arunachal-pradesh', name: 'Arunachal Pradesh', region: 'North-East', lat: 28.2180, lng: 94.7278 },
  { id: 'telangana', name: 'Telangana', region: 'South', lat: 18.1124, lng: 79.0193 },
  { id: 'andhra-pradesh', name: 'Andhra Pradesh', region: 'South', lat: 15.9129, lng: 79.7400 },
  { id: 'karnataka', name: 'Karnataka', region: 'South', lat: 15.3173, lng: 75.7139 },
  { id: 'kerala', name: 'Kerala', region: 'South', lat: 10.8505, lng: 76.2711 },
  { id: 'tamil-nadu', name: 'Tamil Nadu', region: 'South', lat: 11.1271, lng: 78.6569 },
  { id: 'andaman-nicobar', name: 'Andaman & Nicobar', region: 'Coastal', lat: 11.7401, lng: 92.6586 },
  { id: 'jammu-kashmir', name: 'Jammu & Kashmir', region: 'North', lat: 33.7782, lng: 76.5762 },
  { id: 'ladakh', name: 'Ladakh', region: 'North', lat: 34.1526, lng: 77.5770 },
  { id: 'sikkim', name: 'Sikkim', region: 'North-East', lat: 27.5330, lng: 88.5122 },
  { id: 'himachal-pradesh', name: 'Himachal Pradesh', region: 'North', lat: 31.1048, lng: 77.1734 },
  { id: 'guwahati', name: 'Guwahati', region: 'North-East', lat: 26.1445, lng: 91.7362 },
  { id: 'bhubaneswar', name: 'Bhubaneswar', region: 'East', lat: 20.2961, lng: 85.8245 },
]

export const warehouses = [
  { id: 'IXC', name: 'Chandigarh Hub', state: 'Chandigarh', region: 'North', lat: 30.7333, lng: 76.7794, cap: 420 },
  { id: 'JAI', name: 'Jaipur Hub', state: 'Rajasthan', region: 'North-West', lat: 26.9124, lng: 75.7873, cap: 500 },
  { id: 'DEL', name: 'Delhi NCR Hub', state: 'Delhi', region: 'North', lat: 28.6139, lng: 77.2090, cap: 950 },
  { id: 'LKO', name: 'Lucknow Hub', state: 'Uttar Pradesh', region: 'North', lat: 26.8467, lng: 80.9462, cap: 520 },
  { id: 'AMD', name: 'Ahmedabad Hub', state: 'Gujarat', region: 'West', lat: 23.0225, lng: 72.5714, cap: 700 },
  { id: 'SUR', name: 'Surat Hub', state: 'Gujarat', region: 'West', lat: 21.1702, lng: 72.8311, cap: 460 },
  { id: 'BOM', name: 'Mumbai Hub', state: 'Maharashtra', region: 'West', lat: 19.0760, lng: 72.8777, cap: 1080 },
  { id: 'PNQ', name: 'Pune Hub', state: 'Maharashtra', region: 'West', lat: 18.5204, lng: 73.8567, cap: 640 },
  { id: 'NAG', name: 'Nagpur Hub', state: 'Maharashtra', region: 'Central', lat: 21.1458, lng: 79.0882, cap: 580 },
  { id: 'IDR', name: 'Indore Hub', state: 'Madhya Pradesh', region: 'Central', lat: 22.7196, lng: 75.8577, cap: 470 },
  { id: 'HYD', name: 'Hyderabad Hub', state: 'Telangana', region: 'South', lat: 17.3850, lng: 78.4867, cap: 820 },
  { id: 'VTZ', name: 'Visakhapatnam Hub', state: 'Andhra Pradesh', region: 'South', lat: 17.6868, lng: 83.2185, cap: 470 },
  { id: 'BLR', name: 'Bengaluru Hub', state: 'Karnataka', region: 'South', lat: 12.9716, lng: 77.5946, cap: 860 },
  { id: 'MYS', name: 'Mysuru Hub', state: 'Karnataka', region: 'South', lat: 12.2958, lng: 76.6394, cap: 360 },
  { id: 'CBE', name: 'Coimbatore Hub', state: 'Tamil Nadu', region: 'South', lat: 11.0168, lng: 76.9558, cap: 430 },
  { id: 'MAA', name: 'Chennai Hub', state: 'Tamil Nadu', region: 'South', lat: 13.0827, lng: 80.2707, cap: 920 },
  { id: 'AMB', name: 'Ambur Hub', state: 'Tamil Nadu', region: 'South', lat: 12.7917, lng: 78.7160, cap: 410 },
  { id: 'COK', name: 'Kochi Hub', state: 'Kerala', region: 'South', lat: 9.9312, lng: 76.2673, cap: 450 },
  { id: 'CCU', name: 'Kolkata Hub', state: 'West Bengal', region: 'East', lat: 22.5726, lng: 88.3639, cap: 820 },
  { id: 'BBI', name: 'Bhubaneswar Hub', state: 'Odisha', region: 'East', lat: 20.2961, lng: 85.8245, cap: 360 },
  { id: 'GHY', name: 'Guwahati Hub', state: 'Assam', region: 'North-East', lat: 26.1445, lng: 91.7362, cap: 370 },
  { id: 'PAT', name: 'Patna Hub', state: 'Bihar', region: 'East', lat: 25.5941, lng: 85.1376, cap: 430 },
  { id: 'RPR', name: 'Raipur Hub', state: 'Chhattisgarh', region: 'Central', lat: 21.2514, lng: 81.6296, cap: 420 },
  { id: 'SHM', name: 'Shillong Hub', state: 'Meghalaya', region: 'North-East', lat: 25.5788, lng: 91.8933, cap: 260 },
]

// User-reported service areas. Coordinates are representative map anchors,
// not confirmed NGL offices, warehouses, or customer locations.
export const globalMarkets = [
  { id: 'SGP', name: 'Singapore', anchor: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { id: 'AUS', name: 'Australia', anchor: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { id: 'EUR', name: 'Europe', anchor: 'Frankfurt', country: 'Europe', lat: 50.1109, lng: 8.6821 },
  { id: 'MYS', name: 'Malaysia', anchor: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
  { id: 'LKA', name: 'Sri Lanka', anchor: 'Colombo', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612 },
  { id: 'ARE', name: 'United Arab Emirates', anchor: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
  { id: 'GBR', name: 'United Kingdom', anchor: 'London', country: 'UK', lat: 51.5072, lng: -0.1276 },
  { id: 'USA', name: 'United States', anchor: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
]

// Simulated partner-operated hubs used to demonstrate international operations.
// Replace these with verified NGL operating locations before presenting live data.
export const internationalWarehouses = [
  { id: 'SIN-CHG', name: 'Changi Gateway', country: 'Singapore', lat: 1.3644, lng: 103.9915, cap: 340 },
  { id: 'SIN-JUR', name: 'Jurong Logistics Hub', country: 'Singapore', lat: 1.3320, lng: 103.7430, cap: 260 },
  { id: 'SIN-TUA', name: 'Tuas Freight Centre', country: 'Singapore', lat: 1.3290, lng: 103.6480, cap: 220 },
  { id: 'AUS-SYD', name: 'Sydney Gateway', country: 'Australia', lat: -33.8688, lng: 151.2093, cap: 420 },
  { id: 'AUS-MEL', name: 'Melbourne Hub', country: 'Australia', lat: -37.8136, lng: 144.9631, cap: 380 },
  { id: 'AUS-BNE', name: 'Brisbane Hub', country: 'Australia', lat: -27.4698, lng: 153.0251, cap: 300 },
  { id: 'EUR-RTM', name: 'Rotterdam Gateway', country: 'Europe', lat: 51.9244, lng: 4.4777, cap: 460 },
  { id: 'EUR-FRA', name: 'Frankfurt Hub', country: 'Europe', lat: 50.1109, lng: 8.6821, cap: 520 },
  { id: 'EUR-CDG', name: 'Paris Hub', country: 'Europe', lat: 48.8566, lng: 2.3522, cap: 390 },
  { id: 'MYS-KUL', name: 'Kuala Lumpur Hub', country: 'Malaysia', lat: 3.1390, lng: 101.6869, cap: 420 },
  { id: 'MYS-PEN', name: 'Penang Hub', country: 'Malaysia', lat: 5.4141, lng: 100.3288, cap: 240 },
  { id: 'MYS-JHB', name: 'Johor Bahru Hub', country: 'Malaysia', lat: 1.4927, lng: 103.7414, cap: 260 },
  { id: 'LKA-CMB', name: 'Colombo Gateway', country: 'Sri Lanka', lat: 6.9271, lng: 79.8612, cap: 320 },
  { id: 'LKA-KDY', name: 'Kandy Hub', country: 'Sri Lanka', lat: 7.2906, lng: 80.6337, cap: 180 },
  { id: 'ARE-DXB', name: 'Dubai Gateway', country: 'UAE', lat: 25.2048, lng: 55.2708, cap: 440 },
  { id: 'ARE-AUH', name: 'Abu Dhabi Hub', country: 'UAE', lat: 24.4539, lng: 54.3773, cap: 280 },
  { id: 'GBR-LON', name: 'London Gateway', country: 'UK', lat: 51.5072, lng: -0.1276, cap: 420 },
  { id: 'GBR-MAN', name: 'Manchester Hub', country: 'UK', lat: 53.4808, lng: -2.2426, cap: 300 },
  { id: 'USA-CHI', name: 'Chicago Hub', country: 'USA', lat: 41.8781, lng: -87.6298, cap: 480 },
  { id: 'USA-NYC', name: 'New York Gateway', country: 'USA', lat: 40.7128, lng: -74.0060, cap: 520 },
  { id: 'USA-DAL', name: 'Dallas Hub', country: 'USA', lat: 32.7767, lng: -96.7970, cap: 380 },
  { id: 'USA-LAX', name: 'Los Angeles Gateway', country: 'USA', lat: 34.0522, lng: -118.2437, cap: 460 },
  { id: 'USA-HOU', name: 'Houston Hub', country: 'USA', lat: 29.7604, lng: -95.3698, cap: 340 },
]

// Regional ground corridors only. No road links cross an ocean.
export const internationalCorridors = [
  ['SIN-CHG', 'SIN-JUR'], ['SIN-JUR', 'SIN-TUA'],
  ['AUS-SYD', 'AUS-MEL'], ['AUS-SYD', 'AUS-BNE'], ['AUS-MEL', 'AUS-BNE'],
  ['EUR-RTM', 'EUR-FRA'], ['EUR-FRA', 'EUR-CDG'], ['EUR-RTM', 'EUR-CDG'],
  ['MYS-KUL', 'MYS-PEN'], ['MYS-KUL', 'MYS-JHB'],
  ['LKA-CMB', 'LKA-KDY'], ['ARE-DXB', 'ARE-AUH'], ['GBR-LON', 'GBR-MAN'],
  ['USA-CHI', 'USA-NYC'], ['USA-CHI', 'USA-DAL'], ['USA-DAL', 'USA-HOU'], ['USA-LAX', 'USA-DAL'],
]

export const corridors = [
  ['DEL', 'JAI'], ['JAI', 'AMD'], ['AMD', 'SUR'], ['SUR', 'BOM'], ['BOM', 'PNQ'],
  ['PNQ', 'BLR'], ['BLR', 'MAA'], ['MAA', 'HYD'], ['HYD', 'VTZ'], ['VTZ', 'CCU'],
  ['CCU', 'BBI'], ['DEL', 'LKO'], ['LKO', 'PAT'], ['PAT', 'CCU'], ['NAG', 'DEL'],
  ['IDR', 'BOM'], ['AMD', 'IDR'], ['HYD', 'BLR'], ['BLR', 'MYS'], ['CBE', 'MAA'],
  ['CBE', 'COK'], ['MAA', 'AMB'], ['RPR', 'NAG'], ['GHY', 'CCU'], ['GHY', 'PAT'],
  ['IXC', 'DEL'], ['BOM', 'SUR'], ['BOM', 'RPR'], ['BLR', 'VTZ'],
]

const cargo = ['Export cargo', 'Courier bags', 'Import consignment', 'Air freight feeder', 'Sea freight container', 'Cold chain']

export const demoDrivers = [
  { id: 'DRV-01', name: 'Aarav Mehta', age: 34, phone: '+91 90000 00001', email: 'aarav.mehta@example.invalid', license: 'DEMO-DL-26-0001', contract: 'DEMO-CONTRACT-001', contractThrough: '2027-03-31', initials: 'AM' },
  { id: 'DRV-02', name: 'Priya Nair', age: 39, phone: '+91 90000 00002', email: 'priya.nair@example.invalid', license: 'DEMO-DL-26-0002', contract: 'DEMO-CONTRACT-002', contractThrough: '2027-06-30', initials: 'PN' },
  { id: 'DRV-03', name: 'Kabir Singh', age: 31, phone: '+91 90000 00003', email: 'kabir.singh@example.invalid', license: 'DEMO-DL-26-0003', contract: 'DEMO-CONTRACT-003', contractThrough: '2027-09-30', initials: 'KS' },
  { id: 'DRV-04', name: 'Ananya Rao', age: 36, phone: '+91 90000 00004', email: 'ananya.rao@example.invalid', license: 'DEMO-DL-26-0004', contract: 'DEMO-CONTRACT-004', contractThrough: '2027-12-31', initials: 'AR' },
  { id: 'DRV-05', name: 'Dev Patel', age: 42, phone: '+91 90000 00005', email: 'dev.patel@example.invalid', license: 'DEMO-DL-26-0005', contract: 'DEMO-CONTRACT-005', contractThrough: '2028-02-29', initials: 'DP' },
  { id: 'DRV-06', name: 'Ishita Das', age: 29, phone: '+91 90000 00006', email: 'ishita.das@example.invalid', license: 'DEMO-DL-26-0006', contract: 'DEMO-CONTRACT-006', contractThrough: '2027-11-30', initials: 'ID' },
]

const manifestItems = [
  { description: 'Priority documents pouch', packages: 8, priority: 'Urgent' },
  { description: 'Business parcel cartons', packages: 14, priority: 'Today' },
  { description: 'Temperature-controlled samples', packages: 4, priority: 'Urgent' },
  { description: 'E-commerce courier bags', packages: 23, priority: 'Standard' },
  { description: 'Air freight transfer boxes', packages: 6, priority: 'Today' },
  { description: 'Sealed import consignments', packages: 11, priority: 'Standard' },
]

function makeDeliveryHistory(vehicleId) {
  const seedValue = [...vehicleId].reduce((value, character) => value + character.charCodeAt(0), 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 5 }, (_, index) => {
    const expectedAt = new Date(today)
    expectedAt.setDate(today.getDate() - index - 1)
    expectedAt.setHours(9 + ((seedValue + index * 3) % 9), (seedValue + index * 17) % 60, 0, 0)
    const late = (seedValue + index * 3) % 4 === 0
    const differenceMinutes = late ? 15 + ((seedValue + index * 13) % 81) : -5 - ((seedValue + index * 7) % 26)
    const actualAt = new Date(expectedAt.getTime() + differenceMinutes * 60 * 1000)
    return {
      id: `${vehicleId}-HIST-${String(index + 1).padStart(2, '0')}`,
      expectedAt: expectedAt.toISOString(),
      actualAt: actualAt.toISOString(),
      onTime: actualAt <= expectedAt,
    }
  })
}

let seed = 17
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

export const trucks = Array.from({ length: 34 }, (_, i) => {
  const c = corridors[i % corridors.length]
  const id = `NGL-TN${String(10 + i).padStart(2, '0')}-${1000 + Math.floor(rnd() * 8999)}`
  return {
    id,
    corridor: i % corridors.length,
    progress: rnd(),
    dir: rnd() > 0.5 ? 1 : -1,
    speed: 38 + Math.floor(rnd() * 26),
    cargo: cargo[i % cargo.length],
    driver: demoDrivers[i % demoDrivers.length],
    deliveryHistory: makeDeliveryHistory(id),
    manifest: [0, 1, 2].map((offset) => {
      const item = manifestItems[(i + offset) % manifestItems.length]
      return { ...item, id: `${id}-SHP-${String(offset + 1).padStart(2, '0')}` }
    }),
    from: c[0],
    to: c[1],
  }
})

let internationalSeed = 31
const internationalRnd = () => (internationalSeed = (internationalSeed * 16807) % 2147483647) / 2147483647

export const internationalTrucks = Array.from({ length: 34 }, (_, index) => {
  const corridor = internationalCorridors[index % internationalCorridors.length]
  return {
    id: `NGL-INT-${String(index + 1).padStart(3, '0')}`,
    corridor: index % internationalCorridors.length,
    progress: internationalRnd(),
    direction: internationalRnd() > 0.5 ? 1 : -1,
    speed: 35 + Math.floor(internationalRnd() * 28),
    cargo: cargo[index % cargo.length],
    driver: demoDrivers[index % demoDrivers.length],
    deliveryHistory: makeDeliveryHistory(`NGL-INT-${String(index + 1).padStart(3, '0')}`),
    manifest: [0, 1].map((offset) => {
      const item = manifestItems[(index + offset + 2) % manifestItems.length]
      return { ...item, id: `NGL-INT-${String(index + 1).padStart(3, '0')}-SHP-${String(offset + 1).padStart(2, '0')}` }
    }),
    from: corridor[0],
    to: corridor[1],
  }
})

export const delayReasons = ['Heavy traffic', 'Toll plaza queue', 'Tyre puncture', 'Customs document hold', 'Weather slowdown', 'Partial road blockage']
