# Search Items

Search a configured provider for items matching a title phrase.

## Input

- `provider`: resolved item provider.
- `query`: user-provided title or title phrase.

## Steps

1. Load `../providers/<provider>.md`.
2. Use the provider operation named `search-items`.
3. Search titles using the narrowest provider-native query available.
4. Limit results to a short, relevant set.
5. Return readable title, status, destination, and provider ID for each match.

Do not list every item available from the provider or silently broaden the
user's query.
