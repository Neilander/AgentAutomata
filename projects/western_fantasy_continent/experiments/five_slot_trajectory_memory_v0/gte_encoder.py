from __future__ import annotations

import sys
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
GTE_EXPERIMENT = EXPERIMENTS / "latent_space_rune_v0"
if str(GTE_EXPERIMENT) not in sys.path:
    sys.path.insert(0, str(GTE_EXPERIMENT))

from gte_runtime import GTERuntime  # noqa: E402


class LocalGTEEncoder:
    """Adapter for the already-downloaded, offline GTE multilingual model."""

    def __init__(self, model_path: str | Path | None = None) -> None:
        self.runtime = GTERuntime(model_path=model_path)

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        return self.runtime.encode(texts, batch_size=batch_size)

