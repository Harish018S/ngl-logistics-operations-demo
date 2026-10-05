const demoScript = {
  durationMs: 30000,
  steps: [
    { title: 'One network, live', caption: 'Every franchise and moving consignment is visible in one operating map. Select any node to inspect its health.', franchise: 'chennai' },
    { title: 'Find the operational signal', caption: 'Chennai is selected. Its shipment watchlist highlights delay exposure and connects each risk to a shipment timeline.', franchise: 'chennai', shipment: 'AWB-20418' },
    { title: 'Assign the intervention', caption: 'The risk panel shows the likely cause and recommended action. The model flags; the franchise manager decides.', franchise: 'chennai', shipment: 'AWB-20418', assign: true },
    { title: 'Stress-test the unit economics', caption: 'A fuel-cost spike flows into cost per shipment, monthly profit, the 24-month curve, and the route alert on the map.', franchise: 'chennai', panel: 'cost', fuelSpike: true },
    { title: 'Replicate into a new market', caption: 'Malaysia’s expansion checklist uses the proven network as its reference and locates the regional pilot node.', franchise: 'malaysia-pilot', panel: 'expansion', market: 'Malaysia' },
  ],
}

export default demoScript