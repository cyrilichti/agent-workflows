# create-item

```text
linear issue create --team <selected team ID> [--project <selected project ID>] --title <confirmed title> --description-file - --no-use-default-template --yes --no-input
```

Pass the confirmed free-form Markdown body on standard input. Omit `--project`
when no project was selected. The template flag prevents a team default from
adding fields that the caller did not confirm.

Return the created issue ID or identifier, title, and URL from the mutation
response.
