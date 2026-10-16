# resolve-item-status

Enumerate Lists as in `./list-destinations.md`, without retrieving tasks.
Read missing effective List statuses with:

```text
clickup-cli list get <List ID> --output json
```

Return every distinct exact `statuses[].status` name clearly matching
`semantic_status`. Report resolution unavailable when statuses cannot be
completely read; return an empty result only after enumeration with no match.
