# create-child-item

Create the confirmed issue as a sub-issue in the official parent issue's
destination:

```text
linear issue create --team <official parent team ID> [--project <official parent project ID>] --parent <official parent issue ID> --title <confirmed child title> --description-file - --no-use-default-template --yes --no-input
```

Pass the confirmed child Markdown body on standard input. Omit `--project` when
the parent has no project. The template flag prevents default issue fields
from being added to the child.

Use the team and optional project from the official parent context. Do not
resolve or select another destination. Omit assignment, state, labels, and
other optional fields. This operation creates only the child issue and must not
update the parent issue.
