from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as functional
from transformers import AutoModel, AutoTokenizer


def default_model_path() -> Path:
    worktree_root = Path(__file__).resolve().parents[4]
    return worktree_root.parent / "shared_models" / "gte-multilingual-base"


class GTERuntime:
    def __init__(self, model_path: str | Path | None = None):
        self.model_path = Path(
            model_path or os.environ.get("GTE_MODEL_PATH") or default_model_path()
        ).resolve()
        if not self.model_path.exists():
            raise FileNotFoundError(f"GTE model not found: {self.model_path}")
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_path, local_files_only=True
        )
        self.model = AutoModel.from_pretrained(
            self.model_path,
            trust_remote_code=True,
            local_files_only=True,
        )
        self.model.eval()

    @torch.inference_mode()
    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        chunks = []
        for offset in range(0, len(texts), batch_size):
            batch = self.tokenizer(
                texts[offset : offset + batch_size],
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt",
            )
            output = self.model(**batch).last_hidden_state[:, 0, :]
            chunks.append(functional.normalize(output, dim=-1).cpu())
        return torch.cat(chunks, dim=0).numpy().astype(np.float64)
