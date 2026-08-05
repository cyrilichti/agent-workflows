# Search Items

Search a configured provider for items matching a title phrase.

## Input

- `provider`: resolved item provider.
- `query`: user-provided title or title phrase.

## Steps

1. Load `../providers/<provider>/search-items.md`. If the file is missing, stop.
2. Follow the loaded operation to search titles using the narrowest
   provider-native query available.
3. Limit results to a short, relevant set.
4. Return readable title, status, destination, and provider ID for each match.

Do not list every item available from the provider or silently broaden the
user's query.
