# GE-Bot-1 Crop Recommendation ML

## Overview
Tier 1 ML: RandomForestClassifier trained on soil N/P/K/temperature/humidity/pH/rainfall
to predict optimal crops. Achieves >97% accuracy on Kaggle Crop Recommendation Dataset.

## Setup

```bash
pip install scikit-learn pandas joblib fastapi uvicorn
```

## Dataset

Download [Crop_recommendation.csv](https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset)
and place it in this directory.

## Training

```bash
python train.py
```

Outputs: `model.pkl`, `label_encoder.pkl`, `feature_names.json`, `predictions_fallback.json`

## Inference Microservice

```bash
python serve.py
# Runs on http://localhost:8001
```

Test:
```bash
curl -X POST http://localhost:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"N":100,"P":30,"K":40,"temperature":28,"humidity":70,"ph":6.5,"rainfall":120}'
```

## Integration

The Node backend at `GET /api/farm/crop-recommendation` will:
1. Try `POST http://localhost:8001/predict` with real soil averages
2. On success: annotate recommendations with `ml_powered: true`
3. On failure: fall back to `predictions_fallback.json` lookup
