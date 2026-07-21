"""Convert the three locally downloaded ISEAR parquet shards to JSONL."""

from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parent
RAW_DIR = ROOT / "data" / "raw" / "isear"
OUTPUT = RAW_DIR / "filtered-api.jsonl"
SHARDS = {
    "train": RAW_DIR / "train-0000.parquet",
    "validation": RAW_DIR / "validation-0000.parquet",
    "test": RAW_DIR / "test-0000.parquet",
}


def main() -> None:
    frames = []
    counts = {}
    for split, file_path in SHARDS.items():
        frame = pd.read_parquet(file_path)
        frame.insert(0, "sourceDatasetSplit", split)
        frames.append(frame)
        counts[split] = len(frame)

    corpus = pd.concat(frames, ignore_index=True)
    corpus.to_json(OUTPUT, orient="records", lines=True, force_ascii=False)
    print({
        "rows": len(corpus),
        "sourceSplitCounts": counts,
        "output": str(OUTPUT),
    })


if __name__ == "__main__":
    main()
