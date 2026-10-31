# Done Complete

## Outcome

The exact linked request is merged and its official item is done, or the
observed blocker or partial completion is reported.

## Result Format

Start the final response with this block. Keep both identities visible, using
`unavailable` when one could not be resolved:

```markdown
## Done result

**Request <repository#ID>:** <observed state>
**Item <ID>:** <observed status>
**Stage:** <failed stage, when returned>
**Reason:** <failure reason, when returned>
**Remaining:** <item action, only when returned>
```
