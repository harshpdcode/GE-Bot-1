# GE-Bot-1: Real PlantVillage MobileNetV2 Leaf-Disease Classifier

This directory contains the training pipeline, Google Colab notebook, and deployment specifications for the **PlantVillage MobileNetV2** deep learning model utilized in the GE-Bot-1 autonomous agro-robot system.

---

## 1. Dataset Overview

- **Dataset**: [PlantVillage Dataset](https://www.kaggle.com/datasets/emmarex/plantdisease)
- **Samples**: ~54,305 curated leaf images across 38 distinct classes.
- **Crop Coverage (14 Species)**:
  - Tomato (*Solanum lycopersicum*)
  - Potato (*Solanum tuberosum*)
  - Corn / Maize (*Zea mays*)
  - Bell Pepper (*Capsicum annuum*)
  - Grape (*Vitis vinifera*)
  - Apple (*Malus domestica*)
  - Strawberry (*Fragaria × ananassa*)
  - Peach (*Prunus persica*)
  - Cherry (*Prunus cerasus*)
  - Blueberry, Raspberry, Soybean, Squash, Orange

---

## 2. Model Architecture & Transfer Learning

```
Input Frame (RGB 224x224x3)
      │
      ▼
Rescaling [-1.0, 1.0]
      │
      ▼
MobileNetV2 Base (Pretrained ImageNet, Top Layers Fine-Tuned)
      │
      ▼
GlobalAveragePooling2D (1280 features)
      │
      ▼
BatchNormalization & Dropout(0.35)
      │
      ▼
Dense(256, ReLU, L2 Regularized) + Dropout(0.25)
      │
      ▼
Dense(38, Softmax) ──> Real Class Probabilities (0.0 to 1.0)
```

---

## 3. Bridging the Lab-to-Field Domain Gap

PlantVillage images are captured in lab conditions (uniform gray/black backgrounds, controlled illumination). To ensure high validation accuracy translates reliably into real outdoor field conditions, our training pipeline incorporates:
1. **Heavy Outdoor Augmentations**:
   - Random Brightness Jitter ($[0.75, 1.25]$) simulating changing direct sunlight vs cloud shadows.
   - Spatial Shifts ($\pm 20\%$) and Zoom ($\pm 25\%$) simulating robot camera vantage fluctuations.
   - Bidirectional Flips and Rotation ($\pm 35^\circ$) for orientation invariance.
2. **Selective Domain Fine-Tuning**:
   - Initial training with frozen MobileNetV2 base weights.
   - Subsequent unfreezing of the top 30 convolutional layers with a reduced learning rate ($10^{-5}$).
3. **Honest Optical Guard**:
   - If the camera feed is inactive or blocked, the detector outputs an honest alert rather than fabricating a diagnosis.

---

## 4. Google Colab 1-Click Training

Open `PlantVillage_MobileNetV2_Colab.ipynb` directly in [Google Colab](https://colab.research.google.com/):
1. Select **Runtime > Change runtime type > T4 GPU**.
2. Run all cells sequentially:
   - Downloads PlantVillage via Kaggle API or TensorFlow Datasets.
   - Executes transfer learning with EarlyStopping.
   - Evaluates Top-1 & Top-3 accuracy.
   - Converts the trained model directly to TensorFlow.js (`model.json` + `group1-shard1of1.bin`).
   - Downloads the resulting web bundle for client-side edge deployment.

---

## 5. Client Deployment

The converted model is served from `frontend/models/plant-disease/`:
- `model.json`: Layer topology and weight manifest.
- `group1-shard1of1.bin`: FP16/quantized weights.
- `classes.json`: Dictionary mapping class indices to crop name, pathogen, and recommended organic treatment.
