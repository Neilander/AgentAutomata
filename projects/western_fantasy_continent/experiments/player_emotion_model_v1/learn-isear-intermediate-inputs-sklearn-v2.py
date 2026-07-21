"""Learn text -> cognitive/physical questionnaire fields without emotion labels."""

from __future__ import annotations

import json
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.pipeline import FeatureUnion


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data" / "prepared" / "isear-v1"
TRAIN_INPUTS = DATA_DIR / "train.inputs.jsonl"
TRAIN_GOLD = DATA_DIR / "train.gold.jsonl"
DEVELOPMENT_INPUTS = DATA_DIR / "development.inputs.jsonl"
OUTPUT = DATA_DIR / "development.sklearn-questionnaire-fields-v2.jsonl"

FIELDS = [
    "ERGO", "TROPHO", "TEMPER", "EXPRES", "MOVE", "EXP1", "EXP2", "EXP10", "PARAL",
    "CON", "EXPC", "PLEA", "PLAN", "FAIR", "CAUS", "COPING", "MORL", "SELF", "RELA",
    "VERBAL",
]

EMOTION_WORD_PATTERN = re.compile(
    r"\b(?:anger|angry|annoyed|rage|furious|fear|afraid|scared|terror|frightened|"
    r"joy|joyful|happy|delighted|elated|sad|sadness|sorrow|grief|depressed|"
    r"disgust|disgusted|disgusting|revolted|repulsed|shame|ashamed|embarrassed|"
    r"humiliated|guilt|guilty|remorse)\b",
    re.IGNORECASE,
)


def read_jsonl(file_path: Path) -> list[dict]:
    with file_path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def sanitize(text: str) -> str:
    return EMOTION_WORD_PATTERN.sub(" emotionwordremoved ", text)


def main() -> None:
    train_inputs = read_jsonl(TRAIN_INPUTS)
    train_gold_by_id = {
        record["caseId"]: record["researchOnlyPostEmotionFields"]
        for record in read_jsonl(TRAIN_GOLD)
    }
    development_inputs = read_jsonl(DEVELOPMENT_INPUTS)

    train_text = [
        sanitize(record["observableBeforeInference"]["situation"])
        for record in train_inputs
    ]
    development_text = [
        sanitize(record["observableBeforeInference"]["situation"])
        for record in development_inputs
    ]
    vectorizer = FeatureUnion([
        (
            "word",
            TfidfVectorizer(
                ngram_range=(1, 2),
                min_df=2,
                max_df=0.97,
                max_features=22000,
                sublinear_tf=True,
                strip_accents="unicode",
            ),
        ),
        (
            "char",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                min_df=3,
                max_features=24000,
                sublinear_tf=True,
            ),
        ),
    ])
    train_matrix = vectorizer.fit_transform(train_text)
    development_matrix = vectorizer.transform(development_text)
    predictions_by_field: dict[str, np.ndarray] = {}
    confidence_by_field: dict[str, np.ndarray] = {}

    for field_index, field in enumerate(FIELDS):
        target = np.asarray([
            train_gold_by_id[record["caseId"]][field]
            for record in train_inputs
        ])
        classifier = SGDClassifier(
            loss="log_loss",
            penalty="elasticnet",
            alpha=0.00008,
            l1_ratio=0.08,
            max_iter=2500,
            tol=1e-4,
            class_weight="balanced",
            random_state=1700 + field_index,
            average=True,
        )
        classifier.fit(train_matrix, target)
        predictions_by_field[field] = classifier.predict(development_matrix)
        confidence_by_field[field] = classifier.predict_proba(development_matrix).max(axis=1)

    records = []
    for index, source in enumerate(development_inputs):
        predicted_fields = {
            field: int(predictions_by_field[field][index])
            for field in FIELDS
        }
        field_confidence = {
            field: round(float(confidence_by_field[field][index]), 4)
            for field in FIELDS
        }
        records.append({
            "schema": "isear_sklearn_questionnaire_fields_v2",
            "caseId": source["caseId"],
            "split": source["split"],
            "sourceGroup": source["sourceGroup"],
            "predictedFields": predicted_fields,
            "fieldConfidence": field_confidence,
            "protocol": {
                "emotionLabelUsedAsTrainingTarget": False,
                "trainingTargets": "cognitive, physical and behavior questionnaire fields",
                "directEmotionWordsRemoved": True,
            },
        })

    with OUTPUT.open("w", encoding="utf-8", newline="\n") as handle:
        for record in records:
            handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(json.dumps({
        "status": "PASS",
        "trainingCases": len(train_inputs),
        "developmentCases": len(development_inputs),
        "fields": len(FIELDS),
        "emotionLabelUsedAsTrainingTarget": False,
        "directEmotionWordsRemoved": True,
        "output": str(OUTPUT),
    }, indent=2))


if __name__ == "__main__":
    main()
