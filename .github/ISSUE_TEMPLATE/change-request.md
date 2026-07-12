---
name: Change Request
about: Propose and record a change (change management)
title: "type(scope): short description"
labels: ["change"]
---

<!-- One issue = one change; the implementing PR closes it with "Closes #<issue>".
Trivial changes (dependency bumps, docs) can go straight to a PR. -->

**Change type:** Standard | Planned | Emergency
**Component / area:**
**Risk / impact:** Low | Medium | High —
**Security impact assessed:** Yes | No —

### Description & rationale


### Testing / validation
- [ ] CI passes on the PR
- [ ] Tests added/updated for the change
- Evidence: <link to PR / CI run>

### Rollback plan
<!-- Usually: revert the merge commit. For a published release, ship a patch revert. -->


### Notes
- [ ] Breaking change? (note the upgrade/migration impact for consumers)
