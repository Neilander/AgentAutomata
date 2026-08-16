from run_experiment import EVENT_CASES, NO_WAKE_CASES, OBJECT_WAKEUPS, RELATION_EXAMPLES


def main() -> None:
    assert len(RELATION_EXAMPLES) >= 5
    assert all(len(examples) >= 5 for examples in RELATION_EXAMPLES.values())
    assert len(EVENT_CASES) >= 6
    assert len(NO_WAKE_CASES) >= 4
    for case in EVENT_CASES:
        assert case["expected_relation"] in RELATION_EXAMPLES
        candidates = {row["id"] for row in OBJECT_WAKEUPS[case["object"]]["candidates"]}
        assert case["expected_wakeup"] in candidates
    print("PASS: latent wakeup experiment contracts")


if __name__ == "__main__":
    main()
