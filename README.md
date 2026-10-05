# NGL NEXT · Operations Workspace

This is an offline-capable operations-system prototype for the Nova Global Logistics (NGL) business case. It brings shipment intervention, India network visibility, franchise performance, and explainable decision support into one workspace. It is a frontend demo, not yet connected to NGL production systems or a shared company database.

## Why this is different from NGL's existing model

This prototype is not meant to replace NGL's current tracking or operations systems. It is designed to sit above them as an internal Franchise Intelligence & Decision System.

NGL already has the building blocks: franchise operations, SOPs, tracking data, pricing, and local experience. The missing capability is a learning loop that helps the network learn from itself.

The prototype focuses on this idea:

- Existing NGL model: Data → Monitoring
- NGL NEXT: Data → Insight → Decision → Experiment → Learning → Replication

In practical terms, the app helps central management and franchise managers answer the questions that existing operational dashboards do not:

- Why is a franchise underperforming?
- Which comparable franchise is doing better?
- What practice can be validated through a pilot?
- What should be replicated across the network?

The most important differentiator is Network Learning. A franchise does not just report performance; it identifies a better practice from another branch, tests it locally, and turns it into a repeatable best-practice playbook for the network.

Tagline: "NGL has already built the network. NGL NEXT makes the network learn."

## What is included

- Operations workspace with command center, shipment control, franchise performance, India network, and AI decision desk
- Shipment risk queue with filters, detail inspection, action assignment, completion, and CSV export
- Shared synthetic report-day shipment records driving the dashboard totals, branch counts, shipment queue, and on-time outcome view
- Downloadable 30-day synthetic labeled shipment CSV for demonstrating a model-training workflow
- Local action persistence and a small team XP loop to make review/closure progress visible during demos
- Explainable rule-based recommendations using risk features and shared franchise benchmarks
- India hub, corridor, and vehicle simulation plus simulated international hubs, regional corridors, and vehicles in `src/data/network.js`
- Truck inspection with a fictional driver profile, sample contract download, per-truck shipment manifest, and delay reason
- Prioritized vehicle incident queue, critical-incident human-review escalation, and a local-only SMS/email demo outbox
- Configurable 5/15/30-second network-panel refresh timestamp; vehicle simulation continues to advance every second
- Shared franchise attributes in `src/data/franchises.js` and shipment records in `src/data/demo_shipments_today.json`

## Project structure

```text
ngl-next/
  model/
    train_risk_model.py
  public/
    demo_training_shipments.csv
  src/
    App.jsx
    App.css
    index.css
    data/
      franchises.js
      demo_shipments_today.json
  scripts/
    generate_demo_dataset.js
  README.md
  package.json
  requirements.txt
```

## Run the app locally

1. Install dependencies:

```bash
npm install
```

2. Start the prototype:

```bash
npm run dev
```

3. Open the local Vite URL printed in the terminal. If `5173` is already in use, Vite will automatically move to the next free port (for example `5174` or `4173`). The app runs offline and does not require a backend.

## Demo training dataset and optional model workflow

`public/demo_training_shipments.csv` is a deterministic, fictional 31-day shipment fixture: 30 historical dates plus the latest report date. The latest date contains exactly the per-franchise shipment counts used by the franchise table (for example, Chennai has 184), and those same rows drive the command-center total and shipment queue. Regenerate it together with the app report-day JSON using:

```bash
npm run data:generate
```

An optional ISO report date can be supplied for repeatable demos:

```bash
npm run data:generate -- 2026-10-05
```

The downloadable CSV contains one row per shipment. `late_delivery` is the binary training label; timestamps and `actual_delay_minutes` are outcomes and must not be used as model features. Pre-delivery fields include service mode, priority, route distance, pickup delay, congestion, weather, hub backlog, document exceptions, vehicle utilization, driver duty hours, route deviation, scan gaps, and cross-border status. The fictional records intentionally include both routine and disrupted operations. No real driver/customer personal data is present.

The dashboard's per-shipment risk score is a synthetic logistic rule score: add the documented weighted pre-delivery feature contributions to `z`, then compute `round(100 / (1 + exp(-z)))`. A score of 70 or above is classified as high risk. The shipment detail view lists the actual top contributing factors and their values. The coefficients are illustrative hand-authored weights, not weights fitted to NGL data; the score is not a calibrated probability and is not suitable for real dispatch decisions.

To run the optional model workflow:

1. Install the Python dependencies:

```bash
python -m pip install -r requirements.txt
```

2. Train and evaluate the example models:

```bash
python model/train_risk_model.py
```

The script compares logistic regression and random forest using a chronological holdout, excludes shipment IDs and post-delivery outcome fields from predictors, saves the selected demo model to `model/delay_risk_model.joblib`, and exports scored latest-day examples to `public/predictions.json`.

**Important:** this dataset is synthetic and generated from hand-authored rules. It is useful for demos, checking data pipelines, and exercising model code; it is not real NGL history, a statistically representative sample, or evidence of production accuracy. Synthetic test metrics are not a substitute for validation on permissioned, representative historical data.

## Recommendation and data assumptions

The AI decision desk is currently deterministic decision support, not a trained AI model or a call to an external AI provider. It ranks the shared report-day shipments using a transparent synthetic rule score, surfaces the recommended action, and compares illustrative branch unit costs. It does not automatically assign work or claim verified prediction accuracy. The demo can run without Kaggle, a Python model, network access, or API credentials.

The international coverage list reflects the user's report of services in Singapore, Australia, Europe, Malaysia, Sri Lanka, UAE, UK, and USA. Each map point uses a representative city only as a geographic anchor; it does not imply an NGL office, warehouse, exact coverage boundary, or verified transport route. Replace the anchors with approved NGL location/coverage data when available.

The international warehouse names, regional ground corridors, capacities, and 34 moving vehicles are also simulated interface data. They are there to demonstrate the global operations workflow and must not be represented as confirmed NGL facilities, routes, or fleet. Trucks move only on regional demo corridors; no truck route is drawn across oceans.

Driver records, phone numbers, email addresses, licence references, contracts, and shipment manifests are fictional fixtures (email uses the reserved `.invalid` domain). The driver illustration is not a real person's photograph, and the downloaded contract is a plain-text sample that is not legally valid. Do not add real driver identity documents, contact details, or photos to this demo. In production, these would require verified data, access controls, and an approved document store.

Vehicle incidents create a locally persisted prioritized issue. Routine delays (such as traffic or a toll queue) stay in the issue queue and do not message the driver. The simulated safety-critical causes (tyre puncture and partial road blockage) immediately queue a driver-directed safety message when automation is enabled and an Operations follow-up task. An unplanned stop starts a 60-minute monitor; only after the threshold does the demo queue a driver-directed request for safety confirmation and the stop reason, plus a human-review task asking Operations to contact them. Use **Demo: simulate 60 minutes stopped** to exercise the threshold immediately. This fast-forward is simulation-only. The outbox is a local preview: no phone call, SMS, email, or human dispatch is actually sent or performed, and no real GPS stop is detected. A production integration would need a secured backend, GPS/telematics with freshness checks, an agreed break/geofence policy, approved contact channels, delivery/error handling, consent, and audit controls. The map panel's 5/15/30-second setting updates its displayed refresh time; it does not fetch live fleet data. Vehicle movement is a local simulation.

Selecting a simulated truck shows estimated delivery times for its manifest, recalculated from remaining straight-line route distance, current simulated speed, and a small handling buffer. Its recent-delivery panel shows five generated sample records with expected and actual times and an on-time percentage (actual time at or before expected time). These estimates and history are fictional demo data, not operational ETAs or verified delivery performance. Replace them with approved shipment schedules, live telemetry, and completed-shipment timestamps before using real-world performance figures.

The synthetic shipment CSV is for interface and training-pipeline demos only. It cannot validate NGL's branches, service commitments, routes, or operating policies. For a company-specific model, request an approved export containing shipment ID, branch, origin/destination, service mode, pre-delivery event timestamps, promised and actual delivery times, exception codes, handoff events, and final outcome. Costs, customer identifiers, and personal information should be excluded or appropriately aggregated. Confirm data ownership and permission before training.

## How to swap in approved real data

- Replace the generated report-day and training fixtures with a validated feed from approved NGL systems. Keep shipment IDs, timestamps, branch IDs, target labels, and feature definitions consistent across app views and model training.
- Derive shipment counts and service rates from the same canonical shipment records; do not mix row counts with unrelated KPI aggregates.
- Use a secured backend for production ingestion and keep private driver documents and contact details out of static frontend assets.
- Obtain data-owner approval, minimize personal information, document label meaning and missing-data handling, and validate on a time-separated holdout before claiming model quality.
- Update every synthetic/illustrative label when approved live data becomes available.

## Demo workflow

1. Start at Command center and review the high-risk queue and branch pulse.
2. Open a shipment, assign its intervention, then mark the action complete from the AI decision desk.
3. Inspect the network map, zoom to a vehicle, and select it to view its illustrative driver details and shipment manifest. Use **Test stopped-vehicle alert** to exercise local SMS/email queuing and critical human-review escalation.
4. Inspect franchise performance and open the pickup-window playbook to review its related recommendation.

Action assignment and completion are stored in the current browser to make the demo interactive. This is not a shared task system yet.

## Notes
