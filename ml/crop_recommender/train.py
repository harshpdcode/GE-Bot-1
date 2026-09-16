"""
GE-Bot-1 Crop Recommendation ML Model — Training Script
========================================================
Dataset: Kaggle "Crop Recommendation Dataset"
  - Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
  - Place the CSV at: ml/crop_recommender/Crop_recommendation.csv

Usage:
    pip install scikit-learn pandas joblib
    python train.py
"""

import json, sys, os, warnings
warnings.filterwarnings('ignore')

try:
    import pandas as pd
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score
    from sklearn.preprocessing import LabelEncoder
    import joblib, numpy as np
except ImportError as e:
    print(f"Missing dependency: {e}\nRun: pip install scikit-learn pandas joblib"); sys.exit(1)

DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Crop_recommendation.csv')
if not os.path.exists(DATA_PATH):
    print(f"ERROR: Dataset not found at {DATA_PATH}")
    print("Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset"); sys.exit(1)

df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows, {df['label'].nunique()} classes")

FEATURES = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
X, y = df[FEATURES], df['label']
le = LabelEncoder(); y_enc = le.fit_transform(y)

model = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)
model.fit(X, y_enc)
scores = cross_val_score(model, X, y_enc, cv=5, scoring='accuracy')
print(f"5-Fold CV Accuracy: {scores.mean():.4f} +/- {scores.std():.4f}")

out = os.path.dirname(os.path.abspath(__file__))
joblib.dump(model, os.path.join(out, 'model.pkl'))
joblib.dump(le, os.path.join(out, 'label_encoder.pkl'))
with open(os.path.join(out, 'feature_names.json'), 'w') as f: json.dump(FEATURES, f)

# Build fallback JSON lookup
np.random.seed(42)
BINS = {'N':[50,100,150,200,250],'P':[10,20,30,40,50],'K':[50,100,150,200,250],
        'temperature':[15,20,25,30,35],'humidity':[40,55,70,80],'ph':[5.5,6.0,6.5,7.0,7.5],'rainfall':[50,100,150,200]}
samples = []
for _ in range(500):
    s = {k: float(np.random.choice(v)) for k,v in BINS.items()}
    proba = model.predict_proba([[s[f] for f in FEATURES]])[0]
    top3 = [{'crop': le.classes_[i], 'confidence': round(float(proba[i]),3)} for i in np.argsort(proba)[-3:][::-1]]
    samples.append({'key': f"{s['N']}-{s['P']}-{s['K']}-{s['ph']}", 'input': s, 'top3': top3})
with open(os.path.join(out, 'predictions_fallback.json'), 'w') as f: json.dump(samples, f, indent=2)
print(f"Done. Saved model.pkl, label_encoder.pkl, feature_names.json, predictions_fallback.json")
