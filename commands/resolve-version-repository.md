# Resolve Version Repository

Resolve the repository identity expected by the configured version provider
from one Git push remote.

## Input

- `provider`: resolved version-control provider.
- `push_remote`: exact push remote URL selected by the caller.

## Steps

1. Load `../providers/<provider>/resolve-repository.md`. Stop when it is
   missing.
2. Run it with `push_remote`.
3. Return the provider-specific repository identity without contacting the
   remote.

Stop when the URL syntax is unsupported, the host is missing, or the path does
not identify exactly one repository. Do not guess an owner, namespace,
repository, host, or provider from partial input.
