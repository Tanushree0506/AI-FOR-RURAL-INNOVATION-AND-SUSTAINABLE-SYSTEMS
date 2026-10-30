"""
train_crop_model.py - Train and Evaluate Gaussian Naive Bayes & Random Forest
Dataset: backend/data/raw/crop_recommendation.csv
"""

import os
import pandas as pd
import numpy as np

def train_and_export():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "raw", "crop_recommendation.csv")
    
    if not os.path.exists(data_path):
        print(f"Error: Dataset not found at {data_path}")
        return

    print("Loading crop recommendation dataset...")
    df = pd.read_csv(data_path)
    print(f"Dataset shape: {df.shape}")
    print(f"Unique crop classes ({len(df['label'].unique())}): {df['label'].unique()}")

    # Feature matrix X and target y
    features = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']
    X = df[features]
    y = df['label']

    try:
        from sklearn.model_selection import train_test_split
        from sklearn.naive_bayes import GaussianNB
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import classification_report, accuracy_score
        import joblib

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # 1. Train Gaussian Naive Bayes
        gnb = GaussianNB()
        gnb.fit(X_train, y_train)
        gnb_preds = gnb.predict(X_test)
        print(f"\n✅ Gaussian Naive Bayes Accuracy: {accuracy_score(y_test, gnb_preds) * 100:.2f}%")

        # 2. Train Random Forest Classifier
        rf = RandomForestClassifier(n_estimators=100, random_state=42)
        rf.fit(X_train, y_train)
        rf_preds = rf.predict(X_test)
        print(f"✅ Random Forest Accuracy: {accuracy_score(y_test, rf_preds) * 100:.2f}%")

        # Export models
        export_dir = os.path.dirname(__file__)
        joblib.dump(gnb, os.path.join(export_dir, "crop_gnb_model.joblib"))
        joblib.dump(rf, os.path.join(export_dir, "crop_rf_model.joblib"))
        print(f"Models successfully saved to {export_dir}")

    except ImportError:
        print("Note: scikit-learn or joblib not installed yet. Models can be trained after running 'pip install -r backend/requirements.txt'.")

if __name__ == "__main__":
    train_and_export()
