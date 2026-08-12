# Database

Run these in the Supabase SQL editor, in order. All of them have been run
against the live project.

| File | What it did |
|---|---|
| `schema.sql` | Tables (pillars, questions, quiz_config, results), RLS policies, and the original seed |
| `migration-2-publish.sql` | Draft/publish split: `published_content` + `publish_content()`, drafts became admin-only |
| `migration-3-fix-publish-grant.sql` | Security fix - Supabase grants EXECUTE on new functions to `anon` by default, so revoking from PUBLIC was not enough |
| `migration-4-pinned.sql` | `questions.pinned` |
| `migration-5-pillar-sources.sql` | `pillars.sources` + first pass of descriptions |
| `migration-6-category-names.sql` | Category names - **superseded by 7**, kept for history |
| `migration-7-category-copy.sql` | Names + descriptions (supersedes 6) |
| `migration-8-category-order.sql` | `sort_order` - economy moved last |
| `migration-9-source-deeplinks.sql` | Sources point at the movement site's individual accordions |
| `migration-10-statements-wording.sql` | "שאלות" became "היגדים"; the Basic Law bill joined the service category's sources |
| `migration-11-publish-plumbing.sql` | `build_snapshot()` split out, plus the self-publishing envelope for future migrations |
| `migration-12-zionist-unity-rename.sql` | ממשלה ציונית רחבה - the zionist-unity name, reworded |
| `migration-13-pin-threshold-80.sql` | Pin-flag threshold 90 -> 80 |
| `migration-14-education-platform-source.sql` | The dedicated education platform PDF joins the education sources |

## Writing the next one

See the template in the project's `CLAUDE.md` - content migrations wrap
themselves in `system_change_begin()` / `system_change_publish()` so they
publish themselves when the draft is clean, and never surface to Lotem as
changes she did not make. Migrations that change question text are the one
exception and stay unwrapped.
