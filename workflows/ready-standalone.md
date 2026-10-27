# Ready Standalone Branch

## Input

| Input | Description |
| --- | --- |
| `reference` | Optional official item ID or native URL. |
| `query` | Optional item title or search phrase. |

## Steps

### 1. Select the Plan and Item

Select from at most the 10 newest `../plans/*.plan.md` files using
`../templates/select-option.md`. Stop when none exists; read the selected plan
unchanged.

Load together, then follow in order:

```sh
cat ../commands/resolve-item-provider.md ../commands/resolve-existing-item.md
```

Pass to `resolve-existing-item`:

```text
provider: resolved item provider
reference: supplied reference, when available
query: supplied query, when available
candidate_criteria:
  status: open
  label: agent-planned
fields: [labels, comments, request_backlinks]
```

Require `item.closed: false` and label `agent-planned`; otherwise report the
item and unmet condition, then stop.

### 2. Create the Delivery Context

Using the comments and plan already read, require at least one association:
a matching canonical `Agent-Workflows-Plan:` path, the plan's exact Ticket ID
and URL matching the item, or unchanged content from that item's approved-plan
comment read in this run. Stop if any available plan backlink or Ticket
reference contradicts the selected pair, or no association exists.

Create `Delivery Context` using `../templates/delivery-context.md` with the
selected local plan path and complete official item.

### 3. Continue to Ready

Follow `./ready-confirm.md` with:

```text
plan: selected plan
item: selected complete official item context
delivery_context: initialized delivery context
```

That branch resolves the exact request, asking for its ID only when no unique
identity is available.
