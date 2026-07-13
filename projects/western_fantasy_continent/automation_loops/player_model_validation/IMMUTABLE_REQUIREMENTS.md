# Player Model Validation Loop: Locked Requirements

This file is the user-approved invariant for this automation loop. Automation agents must never edit, replace, reinterpret, or weaken it. Only an explicit new user instruction may authorize a revision.

## Sole Objective

Build and verify this closed loop:

```text
game design change
-> real game events
-> frozen signal interpreter and player model
-> knowledge, expectation, PQRA, emotion, and behavior changes
-> report-based design judgment
-> one justified game design adjustment
-> paired retest
```

The current task is to prove that the simulated player can evaluate game design through real signals and emotional change. It is not to build a playable webpage, improve UI, harden browser combat, or merely make a behavior chain trigger.

## Mandatory Work Order

1. Read existing real-event traces and player reports before writing code.
2. Select one bounded original-versus-candidate design comparison.
3. Freeze the same player-model version, interpreter, parameters, seeds, and initial knowledge for both sides.
4. Run the game or AI-only gameplay simulation to produce real events. Do not hand-fill psychological results.
5. For every important emotional change, report:
   - real game event;
   - prior knowledge and expectation;
   - interpreted H, E/W, P, Q, R, k, and A where applicable;
   - emotion delta and reason;
   - knowledge update after feedback;
   - resulting next behavior.
6. Compare original and candidate on total emotion, minimum emotion, longest no-feedback interval, goal strength, expectation mismatch, learning, and behavior change.
7. Use at least two independent reviewers. A trace must not approve itself.
8. If the model cannot explain the difference, remain in model validation and repair or simplify the model. Do not proceed to gameplay design iteration.
9. If the model works and identifies a design problem, change exactly one relevant gameplay variable and repeat the paired test.
10. Record an honest pass, fail, or inconclusive result. Never manufacture progress.

## Acceptance Standard

A gameplay design is accepted only when all of the following are true:

- The emotional difference originates from different real game events, not different psychological inputs.
- The same frozen interpreter and player configuration process both versions.
- Important emotion deltas are causally traceable through prior expectation and signal interpretation.
- The emotional change influences or credibly informs the next behavior.
- Independent reviewers accept the causal explanation.
- A simpler baseline or relevant ablation does not reveal that the claimed complex-model contribution is decorative.

Behavior-chain trigger rates, win rates, retry rates, and route completion rates are supporting evidence only. They are never substitutes for emotional validation.

## Hard Prohibitions

- Do not create, revise, inspect, or test webpages, UI, workbench pages, browser adapters, or human-playable candidates.
- Do not launch Chrome, the in-app browser, a browser server, screenshots, Playwright, CDP, or any visual browser test. Browser work is allowed only while the user is present and explicitly requests it.
- Do not use a webpage limitation as a blocker; use the AI-only gameplay path and reports.
- Do not directly set or tune P, Q, R, A, emotion, Agency, or intermediate psychological outputs to make a candidate look better.
- Do not treat parser execution, event coverage, route completion, or combat-result parity as proof that the player model evaluates design.
- Do not switch to implementation cleanup, UI polish, combat framework work, or unrelated gameplay features.
- Do not modify formal skills, formal combat values, or production assets unless a report identifies a model-blocking defect and the user explicitly approves that change.
- Do not modify this file or its expected hash.

## Drift Guard

At the beginning and end of every run:

1. Verify this file against `REQUIREMENTS.sha256`.
2. State the sole objective in the run report.
3. Answer these four questions:
   - Which emotional-model claim is being tested?
   - Which real game design variable differs?
   - Which real events changed?
   - How did those events alter emotion and next behavior?
4. If any answer is missing, the run is incomplete and must not branch into another task.

## Immediate Recovery Task

Start with existing Frozen V3 traces and reports. Produce the missing report analysis before adding features:

1. Reconstruct at least one original-versus-candidate emotional timeline from real events.
2. Explain each major emotion delta through old knowledge, expectation, PQRA settlement, learning order, and next action.
3. Compare the full model with a simple baseline or targeted ablation on the same trajectory.
4. Decide which model components are genuinely useful, decorative, or currently unproven.
5. Only then select one gameplay design adjustment for a paired retest.

