"""Train and evaluate a demo shipment delay model using a chronological holdout.

The checked-in fixture is synthetic and is only suitable for exercising the
training workflow. It does not establish real-world model performance.
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

PROJECT_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_DIR / 'public' / 'demo_training_shipments.csv'
MODEL_DIR = PROJECT_DIR / 'model'
MODEL_PATH = MODEL_DIR / 'delay_risk_model.joblib'
OUTPUT_PATH = PROJECT_DIR / 'public' / 'predictions.json'
TARGET_COLUMN = 'late_delivery'

# This allowlist deliberately excludes IDs, shipment/arrival timestamps, and
# actual_delay_minutes so the model only sees information available before delivery.
CATEGORICAL_FEATURES = [
    'franchise_id',
    'origin_city',
    'destination_region',
    'service_mode',
    'priority',
    'cargo_category',
]
NUMERIC_FEATURES = [
    'package_count',
    'weight_kg',
    'distance_km',
    'scheduled_transit_hours',
    'pickup_delay_minutes',
    'route_congestion_index',
    'rainfall_mm',
    'hub_backlog_percent',
    'document_issue',
    'vehicle_utilization_percent',
    'driver_hours_before_dispatch',
    'route_deviation_km',
    'scan_gap_hours',
    'is_cross_border',
    'weekend_or_holiday',
]
FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERIC_FEATURES
REQUIRED_COLUMNS = {'shipment_id', 'shipment_date', TARGET_COLUMN, *FEATURE_COLUMNS}


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f'{DATA_PATH} was not found. Run "npm run data:generate" to create the demo fixture.'
        )
    frame = pd.read_csv(DATA_PATH)
    missing = sorted(REQUIRED_COLUMNS - set(frame.columns))
    if missing:
        raise ValueError(f'Training CSV is missing required columns: {", ".join(missing)}')
    print(f'Loaded {len(frame):,} shipment records from {DATA_PATH.name}.')
    return frame


def clean_data(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.drop_duplicates(subset=['shipment_id']).copy()
    cleaned[TARGET_COLUMN] = pd.to_numeric(cleaned[TARGET_COLUMN], errors='coerce')
    cleaned = cleaned.dropna(subset=[TARGET_COLUMN, 'shipment_date'])
    cleaned[TARGET_COLUMN] = cleaned[TARGET_COLUMN].astype(int)
    cleaned = cleaned[cleaned[TARGET_COLUMN].isin([0, 1])]
    cleaned['shipment_date'] = pd.to_datetime(cleaned['shipment_date'], errors='coerce')
    cleaned = cleaned.dropna(subset=['shipment_date']).sort_values('shipment_date').reset_index(drop=True)
    if cleaned[TARGET_COLUMN].nunique() != 2:
        raise ValueError('Training data must contain both on-time and late-delivery examples.')
    return cleaned


def prepare_features(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    return frame[FEATURE_COLUMNS].copy(), frame[TARGET_COLUMN].copy()


def make_pipeline(classifier) -> Pipeline:
    numeric_preprocessor = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scale', StandardScaler()),
    ])
    categorical_preprocessor = Pipeline([
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('one_hot', OneHotEncoder(handle_unknown='ignore')),
    ])
    preprocessor = ColumnTransformer([
        ('numeric', numeric_preprocessor, NUMERIC_FEATURES),
        ('categorical', categorical_preprocessor, CATEGORICAL_FEATURES),
    ])
    return Pipeline([('preprocess', preprocessor), ('classifier', classifier)])


def chronological_split(frame: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    unique_dates = frame['shipment_date'].drop_duplicates().sort_values().to_list()
    if len(unique_dates) < 5:
        raise ValueError('At least five distinct shipment dates are required for a time-based holdout.')
    cutoff_index = max(1, int(len(unique_dates) * 0.8))
    cutoff_date = unique_dates[cutoff_index]
    training = frame[frame['shipment_date'] < cutoff_date]
    testing = frame[frame['shipment_date'] >= cutoff_date]
    if training.empty or testing.empty or testing[TARGET_COLUMN].nunique() != 2:
        raise ValueError('Chronological holdout must contain both classes in its test window.')
    return training, testing


def evaluate_model(model_name: str, model, x_train, x_test, y_train, y_test) -> dict:
    model.fit(x_train, y_train)
    prediction = model.predict(x_test)
    probability = model.predict_proba(x_test)[:, 1]
    return {
        'model': model_name,
        'accuracy': accuracy_score(y_test, prediction),
        'precision': precision_score(y_test, prediction, zero_division=0),
        'recall': recall_score(y_test, prediction, zero_division=0),
        'roc_auc': roc_auc_score(y_test, probability),
    }


def explain_row(row: pd.Series) -> tuple[list[str], str, str]:
    drivers = []
    if row['document_issue']:
        drivers.append(('Document exception', 1.0))
    if row['pickup_delay_minutes'] >= 45:
        drivers.append(('Late pickup', row['pickup_delay_minutes'] / 100))
    if row['route_congestion_index'] >= 0.65:
        drivers.append(('Route congestion', row['route_congestion_index']))
    if row['rainfall_mm'] >= 25:
        drivers.append(('Weather exposure', row['rainfall_mm'] / 50))
    if row['hub_backlog_percent'] >= 75:
        drivers.append(('Hub backlog', row['hub_backlog_percent'] / 100))
    if row['driver_hours_before_dispatch'] >= 7:
        drivers.append(('Driver duty hours', row['driver_hours_before_dispatch'] / 10))
    if row['route_deviation_km'] >= 25:
        drivers.append(('Route deviation', row['route_deviation_km'] / 60))
    if row['scan_gap_hours'] >= 4:
        drivers.append(('Tracking scan gap', row['scan_gap_hours'] / 8))
    if row['is_cross_border']:
        drivers.append(('Cross-border handoff', 0.5))
    if not drivers:
        drivers.append(('Schedule buffer', 0.2))
    drivers.sort(key=lambda item: item[1], reverse=True)
    names = [name for name, _ in drivers[:3]]
    cause = f'{names[0]} is the strongest observed pre-delivery risk signal.'
    if len(names) > 1:
        cause = f'{names[0]} and {names[1].lower()} may reduce the available delivery buffer.'
    if row['document_issue']:
        action = 'Validate the shipment documents and assign a branch owner to confirm clearance.'
    elif row['pickup_delay_minutes'] >= 45:
        action = 'Confirm the pickup appointment and re-sequence the route before dispatch cutoff.'
    elif row['route_congestion_index'] >= 0.65 or row['rainfall_mm'] >= 25:
        action = 'Check the next route update and notify the receiving hub of the expected arrival window.'
    else:
        action = 'Continue milestone monitoring and confirm the next scan at the scheduled checkpoint.'
    return names, cause, action


def build_predictions(frame: pd.DataFrame, model) -> list[dict]:
    report_date = frame['shipment_date'].max()
    sample = frame[frame['shipment_date'] == report_date].copy()
    probabilities = model.predict_proba(sample[FEATURE_COLUMNS])[:, 1]
    sample['risk_probability'] = probabilities
    sample = sample.sort_values('risk_probability', ascending=False).head(20)
    results = []
    for _, row in sample.iterrows():
        top_features, likely_cause, recommended_action = explain_row(row)
        results.append({
            'id': str(row['shipment_id']),
            'franchise': str(row['franchise_id']),
            'route': f"{row['origin_city']} → {row['destination_region']}",
            'mode': str(row['service_mode']),
            'risk': round(float(row['risk_probability']) * 100),
            'topFeatures': top_features,
            'likelyCause': likely_cause,
            'recommendedAction': recommended_action,
        })
    return results


def main() -> None:
    frame = clean_data(load_dataset())
    training, testing = chronological_split(frame)
    x_train, y_train = prepare_features(training)
    x_test, y_test = prepare_features(testing)

    candidates = {
        'logistic_regression': make_pipeline(
            LogisticRegression(max_iter=1000, class_weight='balanced')
        ),
        'random_forest': make_pipeline(
            RandomForestClassifier(
                n_estimators=120,
                random_state=42,
                class_weight='balanced_subsample',
                min_samples_leaf=4,
                n_jobs=-1,
            )
        ),
    }
    metrics = [
        evaluate_model(name, model, x_train, x_test, y_train, y_test)
        for name, model in candidates.items()
    ]
    best_model_name = max(metrics, key=lambda item: item['roc_auc'])['model']
    best_model = candidates[best_model_name]
    best_model.fit(x_train, y_train)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(best_model, MODEL_PATH)
    OUTPUT_PATH.write_text(
        json.dumps(build_predictions(frame, best_model), indent=2),
        encoding='utf-8',
    )

    print(f'Train rows: {len(training):,} · chronological test rows: {len(testing):,}')
    print(f'Test window: {testing["shipment_date"].min().date()} to {testing["shipment_date"].max().date()}')
    print(f'Late-delivery rate in full fixture: {frame[TARGET_COLUMN].mean():.1%}')
    for item in metrics:
        print(item)
    print(f'Best model by chronological ROC-AUC: {best_model_name}')
    print(f'Saved demo model to {MODEL_PATH}')
    print(f'Exported latest-day scored examples to {OUTPUT_PATH}')
    print('Synthetic data metrics are workflow checks, not evidence of real-world accuracy.')


if __name__ == '__main__':
    main()
