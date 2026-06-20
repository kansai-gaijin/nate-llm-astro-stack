# Audit contract

## Severity

- **P0**: missing route/content, broken navigation, unusable layout, runtime failure, or inaccessible
  core interaction.
- **P1**: conspicuous fidelity gap in structure, responsive behavior, typography scale, motion, or a
  required state. Any abrupt, discontinuous, linear, jarring, or poorly interrupted visible motion
  is at least P1.
- **P2**: localized polish issue that does not change structure or task completion.

## Required finding fields

Every finding must include:

- route, viewport, and state;
- expected reference behavior;
- actual implementation behavior;
- screenshot, trace, console output, measurement, or reproducible browser evidence;
- severity and user impact;
- a concrete fix direction without editing code.

## Scoring

Score the dimensions and weights in `workflow/acceptance.json`. Explain deductions. Review motion
at real speed and inspect intermediate/reversed states, not only final screenshots. Font-family
pixels caused solely by an approved Google Font substitution are not a defect, but mismatched type
scale, weight, width, line height, wrapping, or spacing remain defects.

Raw pixel similarity is supporting evidence only. It is unreliable when approved content differs
from the reference, page height differs, dynamic media changes, or antialiasing varies. Prefer
paired region/state review plus geometry measurements.
