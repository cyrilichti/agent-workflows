# create-child-item

```text
clickup-cli task create --list <official parent List ID> --parent <official parent task ID> --name <confirmed child title> --description <confirmed child Markdown> --output json
```

Return ID, name, and URL from the single created JSON record. Use the parent's
official List; omit assignment, status, labels, and other optional fields.
Do not update the parent. Pass text as one argument, escaping a literal leading
`@` as `@@`.
