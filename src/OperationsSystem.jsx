import { useEffect, useMemo, useState } from 'react'
import demoDay from './data/demo_shipments_today.json'
import { franchiseData } from './data/franchises'
import { internationalTrucks, internationalWarehouses } from './data/network'
import NetworkMap from './NetworkMap.jsx'
import './OperationsSystem.css'

const predictions = demoDay.shipments
const reportDayLabel = new Date(`${demoDay.reportDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const modules = [
  { id: 'overview', icon: '⌂', label: 'Command center' },
  { id: 'shipments', icon: '▤', label: 'Shipments', count: predictions.filter((item) => item.risk >= 70).length },
  { id: 'network', icon: '⌖', label: 'Global network' },
  { id: 'franchises', icon: '▦', label: 'Franchises' },
  { id: 'ai', icon: '✳', label: 'AI decision desk' },
]

const money = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`
const riskClass = (risk) => risk >= 70 ? 'critical' : risk >= 40 ? 'watch' : 'stable'

function readActions() {
  try { return JSON.parse(localStorage.getItem('ngl-ops-actions') || '{}') } catch { return {} }
}

function readLocalList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function readNotifications() {
  const notifications = readLocalList('ngl-notification-outbox')
  const current = notifications.filter((notification) =>
    !notification.message?.startsWith('NGL demo alert:')
    && !notification.message?.startsWith('Incident ')
  )
  if (current.length !== notifications.length) saveLocal('ngl-notification-outbox', current)
  return current
}

function readTruckAlerts() {
  const alerts = readLocalList('ngl-truck-alerts')
  const next = alerts.map((alert) => alert.resolved ? alert : {
    ...alert,
    resolved: true,
    resolvedAt: new Date().toISOString(),
    resolution: 'Previous local simulation ended',
  })
  if (next.some((alert, index) => alert !== alerts[index])) saveLocal('ngl-truck-alerts', next)
  return next
}

function saveLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* local persistence is optional */ }
}

function makeRecommendations() {
  const highRisk = predictions.filter((shipment) => shipment.risk >= 70).sort((a, b) => b.risk - a.risk).slice(0, 3).map((shipment) => ({
    id: `shipment-${shipment.id}`,
    priority: shipment.risk >= 80 ? 'Urgent' : 'Today',
    title: `Protect shipment ${shipment.id}`,
    detail: shipment.recommendedAction,
    evidence: `${shipment.risk}% delay risk · ${shipment.topFeatures.slice(0, 2).join(' + ')}`,
    owner: franchiseData.find((franchise) => franchise.id === shipment.franchise)?.city || 'Network team',
    type: 'Shipment risk',
    shipmentId: shipment.id,
  }))
  const chennai = franchiseData.find((franchise) => franchise.id === 'chennai')
  const mysore = franchiseData.find((franchise) => franchise.id === 'mysore')
  const costGap = Math.round((chennai.benchmarkCost / mysore.benchmarkCost - 1) * 100)
  return [...highRisk, {
    id: 'practice-pickup-windows',
    priority: 'Opportunity',
    title: 'Test Mysore pickup windows in Chennai',
    detail: 'Run a 14-day zone-based pickup pilot, then compare cost per shipment and on-time handoffs against the prior period.',
    evidence: `Chennai cost is ${costGap}% above Mysore · ${money(chennai.benchmarkCost)} vs ${money(mysore.benchmarkCost)} per shipment`,
    owner: 'Chennai · Network learning',
    type: 'Network learning',
  }]
}

const recommendations = makeRecommendations()

function AppSidebar({ activeModule, setActiveModule, points }) {
  return (
    <aside className="ops-sidebar">
      <a className="ops-brand" href="#workspace" aria-label="NGL operations workspace">
        <span className="ops-brand-mark">N</span><span><b>NGL</b><small>OPERATIONS OS</small></span>
      </a>
      <div className="sidebar-caption">WORKSPACE</div>
      <nav className="ops-nav" aria-label="Main navigation">
        {modules.map((item) => <button key={item.id} type="button" className={activeModule === item.id ? 'active' : ''} onClick={() => setActiveModule(item.id)}>
          <span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.count ? <b className="nav-count">{item.count}</b> : null}
        </button>)}
      </nav>
      <div className="sidebar-spacer" />
      <section className="shift-card" aria-label="Team shift progress">
        <div className="shift-card-heading"><span>SHIFT CHALLENGE</span><b>+{points} XP</b></div>
        <strong>Close the risk queue</strong>
        <p>Assign an owner to every high-risk shipment.</p>
        <div className="shift-progress"><i style={{ width: `${Math.min(100, Math.round(predictions.filter((item) => item.risk >= 70).filter((item) => readActions()[item.id] === 'assigned').length / Math.max(1, predictions.filter((item) => item.risk >= 70).length) * 100))}%` }} /></div>
        <small>{predictions.filter((item) => item.risk >= 70 && readActions()[item.id] === 'assigned').length} / {predictions.filter((item) => item.risk >= 70).length} assigned</small>
      </section>
      <div className="sidebar-user"><span className="user-avatar">OP</span><span><b>Operations team</b><small>India network</small></span><span className="user-more">•••</span></div>
    </aside>
  )
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function Metric({ label, value, sub, tone = 'green', onClick }) {
  return <button type="button" className={`metric-card ${tone}`} onClick={onClick}><span>{label}</span><strong>{value}</strong><small>{sub}</small></button>
}

function RecommendationList({ recommendations, actions, actOnRecommendation }) {
  return <section className="workspace-panel recommendation-panel">
    <div className="panel-heading"><div><span className="eyebrow">AI DECISION SUPPORT</span><h2>Recommended next actions</h2></div><span className="source-tag">RULE-BASED · DEMO DATA</span></div>
    <div className="recommendation-list">{recommendations.map((item) => {
      const done = actions[item.id] === 'done'
      return <article className={`recommendation-item ${done ? 'is-done' : ''}`} key={item.id}>
        <div className={`priority-mark ${item.priority.toLowerCase()}`} aria-hidden="true">{item.priority === 'Urgent' ? '!' : item.priority === 'Today' ? '•' : '↗'}</div>
        <div className="recommendation-copy"><div className="recommendation-meta"><span>{item.type}</span><b>{item.priority}</b></div><h3>{item.title}</h3><p>{item.detail}</p><small>{item.evidence}</small><div className="recommendation-owner">OWNER <b>{item.owner}</b></div></div>
        <button type="button" className={done ? 'action-done' : 'action-button'} onClick={() => actOnRecommendation(item)}>{done ? 'Completed ✓' : item.shipmentId && actions[item.shipmentId] === 'assigned' ? 'Resolve' : 'Assign action'}</button>
      </article>
    })}</div>
    <div className="human-review-note"><span>i</span> Recommendations explain their evidence. A manager reviews and assigns every action.</div>
  </section>
}

function ShipmentTable({ shipments, actions, selectShipment, actOnShipment }) {
  return <div className="table-scroll"><table className="operations-table"><thead><tr><th>SHIPMENT / ROUTE</th><th>MODE</th><th>FRANCHISE</th><th>SYNTHETIC RISK SCORE</th><th>STATUS</th><th /></tr></thead><tbody>
    {shipments.map((shipment) => {
      const franchise = franchiseData.find((item) => item.id === shipment.franchise)
      const state = actions[shipment.id] || (shipment.risk >= 70 ? 'needs review' : 'monitoring')
      return <tr key={shipment.id}>
        <td><button className="table-link" type="button" onClick={() => selectShipment(shipment.id)}>{shipment.id}</button><small>{shipment.route}</small><small className="shipment-cause" title={shipment.likelyCause}><b>Why:</b> {shipment.likelyCause}</small></td>
        <td>{shipment.mode}</td><td>{franchise?.city || 'Network'}</td>
        <td><span className={`risk-pill ${riskClass(shipment.risk)}`}>{shipment.risk}%</span></td>
        <td><span className={`status-text ${state === 'assigned' ? 'assigned' : state === 'done' ? 'resolved' : ''}`}><i />{state}</span></td>
        <td><button type="button" className="table-action" onClick={() => actOnShipment(shipment)}>{state === 'assigned' ? 'Resolve' : state === 'done' ? 'Reopen' : 'Assign'}</button></td>
      </tr>
    })}
    {!shipments.length ? <tr><td colSpan="6" className="empty-state">No shipments match this filter.</td></tr> : null}
  </tbody></table></div>
}

function RiskMethod() {
  return <details className="risk-method">
    <summary>Understand the demo risk score</summary>
    <p><b>In plain language:</b> the demo starts at a baseline, adds points for conditions that may put a shipment behind schedule, then converts the total to a 0–100 score. More or stronger risk signals raise the score; no signal guarantees a late delivery.</p>
    <ol className="risk-steps">
      <li><b>Check the shipment signals:</b> pickup delay, congestion, rain, hub backlog, document issues, vehicle use, driver hours, route deviation, tracking gaps, cross-border handoffs, priority, and service mode.</li>
      <li><b>Add their weighted contributions:</b> stronger delay-related signals add more; some signals add nothing when absent. This creates an internal total called <code>z</code>.</li>
      <li><b>Convert the total to a score:</b> a conversion keeps the display between 0 and 100. The dashboard puts scores of <b>70 or higher</b> in the High risk group for review.</li>
    </ol>
    <div className="risk-example"><b>Worked example (illustrative values, not a real shipment)</b><p>Suppose pickup is 85 minutes late, congestion is 0.80, rainfall is 40 mm, the hub is 85% backlogged, a document issue is flagged, and other signals are elevated. The weighted total is about <b>z = 2.55</b>; converting that gives about <b>93/100</b>, so it appears in High risk.</p></div>
    <p className="risk-score-caveat"><b>Important:</b> 93 is a demo priority score—not a verified “93% chance of being late.” The weights and 70-point cutoff are hand-authored for this synthetic dataset, not learned or validated using NGL operating history.</p>
    <details className="risk-formula"><summary>Show the exact demo formula</summary><p><code>z = -3 + 0.78×pickup_delay/105 + 1.15×congestion + 0.35×rainfall/55 + 0.66×hub_backlog/100 + 0.92×document_issue + 0.58×vehicle_utilization/100 + 0.48×driver_hours/12 + 0.60×route_deviation/70 + 0.48×scan_gap/12 + 0.38×cross_border + 0.13×urgent + 0.08×today + 0.16×sea_freight</code></p><p><code>score = round(100 / (1 + exp(-z)))</code></p></details>
  </details>
}

function App() {
  const [activeModule, setActiveModule] = useState('overview')
  const [liveTime, setLiveTime] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedShipment, setSelectedShipment] = useState(null)
  const [actions, setActions] = useState(readActions)
  const [alerts, setAlerts] = useState(readTruckAlerts)
  const [notifications, setNotifications] = useState(readNotifications)
  const [automationEnabled, setAutomationEnabled] = useState(() => {
    try { return localStorage.getItem('ngl-auto-alerts') !== 'false' } catch { return true }
  })
  const [toast, setToast] = useState('')
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const highRisk = predictions.filter((item) => item.risk >= 70).sort((a, b) => b.risk - a.risk)
  const shipments = useMemo(() => predictions.filter((shipment) => {
    const text = `${shipment.id} ${shipment.route} ${shipment.mode} ${franchiseData.find((item) => item.id === shipment.franchise)?.city || ''}`.toLowerCase()
    const matchesQuery = text.includes(query.toLowerCase())
    const matchesRisk = riskFilter === 'all' || (riskFilter === 'high' ? shipment.risk >= 70 : shipment.risk < 70)
    return matchesQuery && matchesRisk
  }).sort((a, b) => b.risk - a.risk), [query, riskFilter])
  const prioritizedAlerts = [...alerts].sort((a, b) => {
    const severity = { Critical: 0, High: 1 }
    return (severity[a.severity] ?? 2) - (severity[b.severity] ?? 2) || b.createdAt.localeCompare(a.createdAt)
  })
  const points = Object.values(actions).filter((status) => status === 'done').length * 25 + Object.values(actions).filter((status) => status === 'assigned').length * 10
  const doneCount = Object.values(actions).filter((status) => status === 'done').length
  const averageOnTime = (100 * predictions.filter((shipment) => !shipment.lateDelivery).length / predictions.length).toFixed(1)
  const selectedShipmentRecord = predictions.find((item) => item.id === selectedShipment)

  const updateAction = (id, status) => {
    setActions((current) => {
      const next = { ...current, [id]: status }
      try { localStorage.setItem('ngl-ops-actions', JSON.stringify(next)) } catch { /* local persistence is optional */ }
      return next
    })
  }

  const handleTruckAlert = (incident) => {
    const recordedIncident = { ...incident, humanRequested: incident.requiresHuman }
    setAlerts((current) => {
      if (current.some((alert) => alert.id === incident.id)) return current
      const next = [recordedIncident, ...current].slice(0, 50)
      saveLocal('ngl-truck-alerts', next)
      return next
    })
    if (incident.stopMonitoring) {
      setToast(`Unplanned stop detected for ${incident.truckId}; monitoring for 60 minutes before escalation`)
      return
    }
    const queuedAt = new Date().toISOString()
    const queuedMessages = incident.requiresHuman ? [
      ...(automationEnabled ? [
        {
          id: `${incident.id}-sms`,
          channel: 'SMS',
          recipient: incident.driver.phone,
          truckId: incident.truckId,
          reason: incident.reason,
          message: `We received a report of ${incident.reason.toLowerCase()} near ${incident.location}. Please reply to confirm you are safe and tell us whether you need assistance. If you are in immediate danger, contact local emergency services.`,
          createdAt: queuedAt,
        },
        {
          id: `${incident.id}-email`,
          channel: 'Email',
          recipient: incident.driver.email,
          truckId: incident.truckId,
          reason: incident.reason,
          message: `Subject: Please confirm your safety and vehicle status\n\nWe received a report of ${incident.reason.toLowerCase()} near ${incident.location}. Please reply to confirm you are safe and let us know whether you need assistance. If you are in immediate danger, contact local emergency services.`,
          createdAt: queuedAt,
        },
      ] : []),
      { id: `${incident.id}-human`, channel: 'Human review', recipient: 'Operations team', truckId: incident.truckId, reason: incident.reason, message: `Contact the driver promptly to confirm safety and determine whether assistance is needed (${incident.reason}, near ${incident.location}).`, createdAt: queuedAt },
    ] : []
    if (queuedMessages.length) {
      setNotifications((current) => {
        const next = [...queuedMessages, ...current].slice(0, 100)
        saveLocal('ngl-notification-outbox', next)
        return next
      })
    }
    setToast(incident.requiresHuman
      ? `${incident.severity} alert for ${incident.truckId}; safety message ${automationEnabled ? 'queued' : 'paused'} and Operations follow-up queued`
      : `${incident.severity} delay alert for ${incident.truckId}; shown in the issue queue, no driver message queued`)
  }

  const escalateTruckStop = (incidentId) => {
    const incident = alerts.find((alert) => alert.id === incidentId)
    if (!incident || incident.resolved || incident.stopThresholdReached) return
    setAlerts((current) => {
      const next = current.map((alert) => alert.id === incidentId
        ? { ...alert, severity: 'Critical', stopThresholdReached: true, humanRequested: true, requiresHuman: true, escalatedAt: new Date().toISOString() }
        : alert)
      saveLocal('ngl-truck-alerts', next)
      return next
    })

    const queuedAt = new Date().toISOString()
    const messages = [
      ...(automationEnabled ? [
        {
          id: `${incidentId}-stop-sms`,
          channel: 'SMS',
          recipient: incident.driver.phone,
          truckId: incident.truckId,
          reason: incident.reason,
          message: `Our vehicle tracking shows your truck has been stationary for about 60 minutes near ${incident.location}. Please reply to confirm you are safe, tell us the reason for the stop, and let us know whether you need assistance. If you are in immediate danger, contact local emergency services.`,
          createdAt: queuedAt,
        },
        {
          id: `${incidentId}-stop-email`,
          channel: 'Email',
          recipient: incident.driver.email,
          truckId: incident.truckId,
          reason: incident.reason,
          message: `Subject: Please confirm your safety and truck status\n\nOur vehicle tracking shows your truck has been stationary for about 60 minutes near ${incident.location}. Please reply to confirm you are safe, share the reason for the stop, and tell us whether you need assistance. If you are in immediate danger, contact local emergency services.`,
          createdAt: queuedAt,
        },
      ] : []),
      {
        id: `${incidentId}-human-review`,
        channel: 'Human review',
        recipient: 'Operations team',
        truckId: incident.truckId,
        reason: incident.reason,
        message: `Contact the driver to check safety and ask for the reason for the 60-minute unplanned stop near ${incident.location}.`,
        createdAt: queuedAt,
      },
    ]
    setNotifications((current) => {
      const next = [...messages, ...current].slice(0, 100)
      saveLocal('ngl-notification-outbox', next)
      return next
    })
    setToast(`60-minute stop threshold reached for ${incident.truckId}; driver reason request and human follow-up queued${automationEnabled ? '' : ' (SMS/email paused)'}`)
  }

  const requestHuman = (incidentId) => {
    setAlerts((current) => {
      const next = current.map((alert) => alert.id === incidentId ? { ...alert, humanRequested: true, requestedAt: new Date().toISOString() } : alert)
      saveLocal('ngl-truck-alerts', next)
      return next
    })
    setToast('Human assistance requested for this issue; no external message was sent')
  }

  const resolveTruckAlert = (incidentId, resolution = 'Vehicle resumed movement') => {
    const resolvedAlert = alerts.find((alert) => alert.id === incidentId)
    if (!resolvedAlert || resolvedAlert.resolved) return
    setAlerts((current) => {
      const next = current.map((alert) => alert.id === incidentId ? { ...alert, resolved: true, resolvedAt: new Date().toISOString() } : alert)
      saveLocal('ngl-truck-alerts', next)
      return next
    })
    const message = `${resolution} near ${resolvedAlert.location}; incident status updated`
    setNotifications((current) => {
      const next = [{ id: `${incidentId}-resolved`, channel: 'System', truckId: resolvedAlert.truckId, reason: resolvedAlert.reason, message, createdAt: new Date().toISOString() }, ...current].slice(0, 100)
      saveLocal('ngl-notification-outbox', next)
      return next
    })
  }

  const toggleAutomation = (enabled) => {
    setAutomationEnabled(enabled)
    try { localStorage.setItem('ngl-auto-alerts', String(enabled)) } catch { /* local preference is optional */ }
  }

  const actOnShipment = (shipment) => {
    const status = actions[shipment.id]
    const next = status === 'assigned' ? 'done' : status === 'done' ? 'needs review' : 'assigned'
    updateAction(shipment.id, next)
    setToast(next === 'assigned' ? `${shipment.id} assigned to ${franchiseData.find((item) => item.id === shipment.franchise)?.city || 'network team'}` : next === 'done' ? `${shipment.id} action marked complete` : `${shipment.id} returned to review`)
  }

  const actOnRecommendation = (item) => {
    if (item.shipmentId) {
      const status = actions[item.shipmentId]
      updateAction(item.shipmentId, status === 'assigned' ? 'done' : 'assigned')
      setToast(status === 'assigned' ? `${item.shipmentId} action resolved` : `${item.shipmentId} assigned for review`)
    } else {
      updateAction(item.id, actions[item.id] === 'done' ? 'open' : 'done')
      setToast(actions[item.id] === 'done' ? 'Recommendation reopened' : 'Pilot recommendation added to the team challenge')
    }
  }

  const exportCsv = () => {
    const rows = [['Shipment', 'Route', 'Mode', 'Risk', 'Franchise', 'Action status'], ...shipments.map((item) => [item.id, item.route, item.mode, item.risk, franchiseData.find((branch) => branch.id === item.franchise)?.city || '', actions[item.id] || 'needs review'])]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'ngl-operations-shipments.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const title = modules.find((item) => item.id === activeModule)?.label || 'Command center'

  return <div className="operations-app" id="workspace">
    <AppSidebar activeModule={activeModule} setActiveModule={setActiveModule} points={points} />
    <div className="ops-main">
      <header className="ops-topbar"><div className="breadcrumbs">NGL OPERATIONS <span>/</span> <b>{title.toUpperCase()}</b></div><label className="workspace-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shipments, routes, branches" aria-label="Search operations" /><kbd>⌘ K</kbd></label><time className="live-clock" dateTime={liveTime.toISOString()} aria-label={`Local time ${liveTime.toLocaleTimeString()} on ${liveTime.toLocaleDateString()}`}><span>LOCAL TIME</span><b>{liveTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b></time><span className="demo-data-status"><i /> DEMO DATA</span><button type="button" className="profile-button" aria-label="Operations profile">OP</button></header>
      <main className="ops-content-area">
        {activeModule === 'overview' ? <>
          <PageHeading eyebrow={`${reportDayLabel.toUpperCase()} · SYNTHETIC DEMO REPORT`} title="Command center" description="Shipment examples and franchise volumes are generated from one shared demo-day dataset." action={<button type="button" className="secondary-button" onClick={() => setActiveModule('shipments')}>Open shipment queue <span>→</span></button>} />
          <section className="metric-grid" aria-label="Network performance">
            <Metric label="Shipments on report day" value={predictions.length} sub={`All branches · ${reportDayLabel}`} tone="teal" onClick={() => { setRiskFilter('all'); setActiveModule('shipments') }} />
            <Metric label="High-risk shipments" value={highRisk.length} sub="70%+ synthetic rule score" tone="red" onClick={() => { setRiskFilter('high'); setActiveModule('shipments') }} />
            <Metric label="On-time in demo data" value={`${averageOnTime}%`} sub={`Labeled outcome · ${reportDayLabel}`} tone="blue" onClick={() => setActiveModule('franchises')} />
            <Metric label="Actions completed" value={doneCount} sub={`${points} team XP earned in this demo`} tone="gold" onClick={() => setActiveModule('ai')} />
          </section>
          <div className="overview-grid">
            <section className="workspace-panel queue-panel"><div className="panel-heading"><div><span className="eyebrow">PRIORITY WORK</span><h2>Shipment action queue</h2></div><button className="plain-link" type="button" onClick={() => { setRiskFilter('high'); setActiveModule('shipments') }}>View all {highRisk.length} risks →</button></div><ShipmentTable shipments={highRisk.slice(0, 5)} actions={actions} selectShipment={(id) => { setSelectedShipment(id); setActiveModule('shipments') }} actOnShipment={actOnShipment} /></section>
            <section className="workspace-panel branch-panel"><div className="panel-heading"><div><span className="eyebrow">NETWORK HEALTH</span><h2>Branch pulse</h2></div><button className="plain-link" type="button" onClick={() => setActiveModule('franchises')}>All branches →</button></div><div className="branch-list">{franchiseData.slice(0, 5).map((branch) => { const branchCount = predictions.filter((item) => item.franchise === branch.id).length; return <button type="button" className="branch-row" key={branch.id} onClick={() => setActiveModule('franchises')}><span className={`branch-indicator ${branch.scoreLabel === 'Watchlist' ? 'watch' : 'good'}`} /><span className="branch-name"><b>{branch.city}</b><small>{branch.status} · {branchCount} shipments</small></span><span className="branch-score">{Math.round(Object.values(branch.health).reduce((sum, value) => sum + value, 0) / Object.values(branch.health).length)}<small>score</small></span></button> })}</div><div className="branch-footnote">Branch shipment counts come from the shared demo-day records.</div></section>
          </div>
          <RiskMethod />
          <RecommendationList recommendations={recommendations.slice(0, 3)} actions={actions} actOnRecommendation={actOnRecommendation} />
        </> : null}

        {activeModule === 'shipments' ? <>
          <PageHeading eyebrow="OPERATIONS / EXECUTION" title="Shipment control" description={`Review rule-based delay exposure for ${reportDayLabel}. The separate labeled training file covers the prior 30 days plus this report day.`} action={<div className="heading-actions"><a className="secondary-button" href="/demo_training_shipments.csv" download>↓ Training dataset</a><button type="button" className="secondary-button" onClick={exportCsv}>↓ Export queue</button></div>} />
          <RiskMethod />
          <div className="filter-toolbar"><div className="filter-segment" aria-label="Risk filter"><button type="button" className={riskFilter === 'all' ? 'selected' : ''} onClick={() => setRiskFilter('all')}>All shipments <b>{predictions.length}</b></button><button type="button" className={riskFilter === 'high' ? 'selected' : ''} onClick={() => setRiskFilter('high')}>High risk <b>{highRisk.length}</b></button><button type="button" className={riskFilter === 'normal' ? 'selected' : ''} onClick={() => setRiskFilter('normal')}>Monitor <b>{predictions.length - highRisk.length}</b></button></div><span className="filter-result">Showing {shipments.length} records</span></div>
          <section className="workspace-panel full-table-panel"><ShipmentTable shipments={shipments} actions={actions} selectShipment={setSelectedShipment} actOnShipment={actOnShipment} />{selectedShipmentRecord ? <div className="shipment-inspector"><button type="button" aria-label="Close shipment details" onClick={() => setSelectedShipment(null)}>×</button><span className="eyebrow">SHIPMENT DETAIL</span><h2>{selectedShipmentRecord.id} · {selectedShipmentRecord.risk}/100 demo score</h2><p><b>Main reason:</b> {selectedShipmentRecord.likelyCause}</p><b>Signals adding to its score</b><ul className="shipment-risk-factors">{selectedShipmentRecord.riskFactors?.length ? selectedShipmentRecord.riskFactors.map((factor) => <li key={factor.name}><span>{factor.name}</span><b>{factor.value}</b><small>+{factor.contribution.toFixed(2)} added before conversion to 0–100</small></li>) : selectedShipmentRecord.topFeatures.map((factor) => <li key={factor}><span>{factor}</span><b>Watch signal</b></li>)}</ul><p className="risk-score-caveat">70+ means review first in this demo. The score is not a verified chance of late delivery.</p><b>Suggested next step</b><p>{selectedShipmentRecord.recommendedAction}</p></div> : null}</section>
        </> : null}

        {activeModule === 'network' ? <><PageHeading eyebrow="OPERATIONS / GEOGRAPHY" title="Global service network" description="Inspect India operations and simulated partner hubs, regional routes, and moving vehicles across reported service areas." action={<span className="source-tag">SIMULATION · {internationalTrucks.length} VEHICLES · {internationalWarehouses.length} HUBS</span>} /><div className="system-map"><NetworkMap onSelectHub={(id) => setToast(`Selected network hub ${id}`)} alerts={prioritizedAlerts} notifications={notifications} automationEnabled={automationEnabled} onAlert={handleTruckAlert} onStopThreshold={escalateTruckStop} onIncidentResolved={resolveTruckAlert} onToggleAutomation={toggleAutomation} onRequestHuman={requestHuman} /></div></> : null}

        {activeModule === 'franchises' ? <><PageHeading eyebrow={`NETWORK / BRANCH MANAGEMENT · ${reportDayLabel.toUpperCase()}`} title="Franchise performance" description="Shipment counts and labeled on-time outcomes are aggregated from the same demo-day records shown on the command center." /><section className="workspace-panel franchise-table-panel"><div className="table-scroll"><table className="operations-table"><thead><tr><th>BRANCH</th><th>STATUS</th><th>SHIPMENTS · REPORT DAY</th><th>ON-TIME · DEMO DATA</th><th>SOP · ILLUSTRATIVE</th><th>UNIT COST · ILLUSTRATIVE</th><th>HEALTH</th></tr></thead><tbody>{franchiseData.map((branch) => { const score = Math.round(Object.values(branch.health).reduce((sum, value) => sum + value, 0) / Object.values(branch.health).length); const branchShipments = predictions.filter((item) => item.franchise === branch.id); const onTime = branchShipments.length ? (100 * branchShipments.filter((item) => !item.lateDelivery).length / branchShipments.length).toFixed(1) : '—'; return <tr key={branch.id}><td><b>{branch.city}</b><small>{branch.country} · {branch.name}</small></td><td><span className="status-text"><i />{branch.status}</span></td><td>{branchShipments.length}</td><td>{onTime}{branchShipments.length ? '%' : ''}</td><td>{branch.kpis.sopCompliance}%</td><td>{money(branch.kpis.costPerShipment)}</td><td><span className={`health-score ${score < 85 ? 'needs-work' : ''}`}>{score}</span></td></tr> })}</tbody></table></div></section><div className="system-footnote">Shipment count and on-time rate are derived from the shared synthetic demo dataset; SOP, unit cost, and health remain illustrative franchise fixtures.</div></> : null}

        {activeModule === 'ai' ? <><PageHeading eyebrow="DECISION SUPPORT / HUMAN REVIEW" title="AI decision desk" description="Prioritized, evidence-linked actions generated from the local demo dataset. Managers stay in control." action={<span className="source-tag">NO EXTERNAL AI SERVICE</span>} /><div className="ai-explainer"><span>✳</span><div><b>How these recommendations work</b><p>Risk thresholds and franchise benchmarks create auditable suggestions. They are not a trained production model and do not make decisions automatically.</p></div></div><RiskMethod /><RecommendationList recommendations={recommendations} actions={actions} actOnRecommendation={actOnRecommendation} /></> : null}

        <footer className="ops-footer"><span><i /> SYSTEM READY</span><span>LOCAL DEMO DATA · ACTIONS SAVED ON THIS DEVICE</span><span>NGL OPERATIONS WORKSPACE</span></footer>
      </main>
    </div>
    {toast ? <div className="ops-toast" role="status">{toast}<button type="button" aria-label="Dismiss message" onClick={() => setToast('')}>×</button></div> : null}
  </div>
}

export default App