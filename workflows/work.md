# Work

1. Reject an incomplete caller handoff instead of treating it as a standalone
   call.
2. Select exactly one branch and work mode:

   | Situation | Workflow | Work mode |
   | --- | --- | --- |
   | Complete caller handoff from `/ready` or `/inspect` | `./work-item.md` | `resumed` |
   | Approved plan and complete `agent-planned` official item context supplied by another caller | `./work-item.md` | `new` |
   | No caller handoff | `./work-standalone.md` | Resolved by the branch |

3. From this file's directory, read only the files below that are not already
   active. Omit active paths from the `cat` command; skip it when none remain:

   ```sh
   cat ../rules/default-language.md ../rules/git-authorization.md ../rules/skill-activation.md ../rules/inclusive-wording.md ../rules/user-facing-output.md ../rules/mutation-response.md ../rules/change-design.md ../goals/work-complete.md
   ```

4. Read the selected workflow file completely and follow it. The approved plan
   and official item, or complete caller handoff, authorize autonomous
   execution.
