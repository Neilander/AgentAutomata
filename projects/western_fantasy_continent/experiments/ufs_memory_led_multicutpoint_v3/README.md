# UFS memory-led multicutpoint V3

This experiment replaces the V2 controller's room-type placement-count special case with a rule-memory-led grounding boundary.

The environment remains responsible only for exposing visible map positions and the primitive public action contract:

```text
place_die(dieId, cellId)
```

The player must separately recall:

- from Q-after, a method related to the desired result;
- from Q-before, the rule that a multi-cell room becomes complete only after all visible cells are occupied.

The grounder binds the recalled `each_unoccupied_visible_cell_in_same_room` operation pattern to the currently visible cells. It contains no room-type-to-die-count table.

Run the focused validation:

```powershell
node --test test-memory-led-controller.js
```

See [`RESULTS.md`](RESULTS.md) for the verified boundary and remaining limits.
