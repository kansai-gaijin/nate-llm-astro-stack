# Clone audit receipt

Write `artifacts/clone/iterations/NNN/audit.json`:

```json
{
  "phase": "clone",
  "iteration": 1,
  "hardGatesPassed": false,
  "blankCaptures": 0,
  "missingCaptures": 0,
  "sectionCoverage": 1,
  "phaseBoundaryPassed": true,
  "diffExitCode": 0,
  "p0": [],
  "p1": []
}
```

Set `hardGatesPassed` true only when every numeric gate passes and P0/P1 arrays are empty.
