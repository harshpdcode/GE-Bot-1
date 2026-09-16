"""
GE-Bot-1 Crop Recommendation — FastAPI Inference Microservice
=============================================================
Runs on http://localhost:8001
POST /predict  { N, P, K, temperature, humidity, ph, rainfall }
              -> { crop, confidence, top3 }

Usage:
    pip install fastapi uvicorn joblib scikit-learn
    python serve.py
"""
import os, json
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn, joblib, numpy as np

OUT = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(OUT, 'model.pkl')
LE_PATH = os.path.join(OUT, 'label_encoder.pkl')
FEATURES_PATH = os.path.join(OUT, 'feature_names.json')

app = FastAPI(title="GE-Bot-1 Crop Recommender", version="1.0")

model = le = feature_names = None

@app.on_event("startup")
def load_model():
    global model, le, feature_names
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}. Run train.py first.")
        return
    model = joblib.load(MODEL_PATH)
    le = joblib.load(LE_PATH)
    with open(FEATURES_PATH) as f: feature_names = json.load(f)
    print(f"Model loaded. Classes: {list(le.classes_)}")

class SoilInput(BaseModel):
    N: float = 100
    P: float = 30
    K: float = 40
    temperature: float = 27
    humidity: float = 65
    ph: float = 6.5
    rainfall: float = 120

@app.post("/predict")
def predict(data: SoilInput):
    if model is None:
        return {"error": "Model not loaded. Run train.py first."}
    X = [[getattr(data, f) for f in feature_names]]
    proba = model.predict_proba(X)[0]
    top3_idx = np.argsort(proba)[-3:][::-1]
    top3 = [{"crop": le.classes_[i], "confidence": round(float(proba[i]), 3)} for i in top3_idx]
    return {"crop": top3[0]["crop"], "confidence": top3[0]["confidence"], "top3": top3}

@app.get("/health")
def health(): return {"status": "ok", "model_loaded": model is not None}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
