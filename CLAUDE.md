# El HaDegel - Alignment Quiz

A Hebrew (RTL) web quiz that measures how much a visitor identifies with the
El HaDegel movement's vision. 13 statements per quiz, randomly drawn from a
54-question pool according to a per-pillar mix, rated on a 1-5 Likert scale,
ending with a match percentage. At 90%+ the visitor is invited to pin their
flag on the 150,000-project map (elhadegel-friends.com).

Pillars (since the 2026-08-10 merge): the vision chapters are grouped into
7 pillars - 4 merged (vision-victory, zionist-unity, winning-iron-wall,
service-integration) + 3 standalone (zionist-economy, education-revolution,
legal-reform). The ישראל 2050 chapter and its questions were deleted at
Lotem's request. Default mix (hand-tuned by Lotem in the admin editor,
2026-08-10): vision-victory 1, zionist-unity 1, winning-iron-wall 3,
service-integration 2, economy 2, education 2, legal 2 = 13. A question's
original chapter stays visible via its sourceLabel and id prefix; question
ids never change.

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4. No router library - a tiny
hash router in `App.tsx` (`#/admin` = backoffice). No backend yet.

## Commands

- `npm run dev` - dev server
- `npm run build` - type-check (`tsc --noEmit`) + production build
- `npm run preview` - serve the production build locally

## Structure

- `src/content/` - the data: `pillars.ts` (the 7 pillars), `questions.ts`
  (54 statements; the security pillar was rebuilt in Lotem's editorial
  review - winning-iron-wall retired ids: 2, 6, 7, 8, 9, 11, 12, 13-17;
  vision-victory was slimmed to exactly TWO October-7-understanding
  statements at her request - retired ids there: 3, 4, 5, 6, 7, 8; pool
  sizes 2/11/10/8/8/8/7; retired ids never reused; sourceLabel says whether
  a statement comes from "החזון שלנו", "המצע המלא" or the official site),
  `quizConfig.ts` (quiz length 13, Lotem's hand-tuned mix, pin-flag
  threshold + URL), `types.ts`
- `public/docs/full-platform.pdf` - the full 25-page party platform (May
  2026). Both the source record for the "המצע המלא" statements AND a served
  site asset, so the admin's source links can deep-link into it
  (`...#page=N`). Page map: 1-2 intro/vision, 3-9 security, 10-13 education,
  14-19 governance and legal, 20-25 economy.
- `src/engine/` - pure logic: `selectQuestions.ts` (random pick per pillar
  quota), `scoring.ts` (1-5 answer -> 0-100%, total + per-pillar)
- `src/store/adminStore.ts` - effective data = base content + localStorage
  overlay of admin edits (key `elhadegel-quiz-admin-v1`)
- `src/screens/` - `Landing`, `Quiz`, `Results`, `Admin`
- `src/components/` - `Logo` (official SVG, extracted from elhadegel.co.il),
  `Header`, `ProgressBar`, `LikertScale`

## Design

Matches elhadegel-friends.com exactly: Heebo font, navy `#1B2D52`, dark navy
`#0F1B36`, warm off-white background `#FAFAF7`, grays `#333/#777/#E5E7EB`.
Tokens live in `src/index.css` under `@theme`. Logo star colors are the
official `#0058ff` (blue) and `#a3b06e` (olive) from the main Webflow site.

## Content

All questions were derived from the 7 vision chapters at
https://www.elhadegel.co.il/about-us ("החזון שלנו"). Question texts are Hebrew
product content and still await Lotem's editorial review.

## Deployment

Live at https://lotem-e.github.io/el-hadegel-quiz/ (replaced the old app's
deployment 2026-08-10). Mechanism: `npm run build`, then force-push `dist/`
as the `gh-pages` branch of `lotem-e/el-hadegel-quiz` (vite `base: './'` +
hash routing make the subpath work; `.nojekyll` included). A TEMPORARY
`noindex` meta tag in `index.html` keeps search engines away while in beta -
remove that one line at launch (movement sign-off for public branding was
still pending as of 2026-08-10).

## Backend (Supabase) - since 2026-08-10

Project `el-hadegel-quiz` in Lotem's Supabase org (lotem-e), URL
`https://wlvfvkvatxqrlhpwikeu.supabase.co`. The URL + publishable key are
PUBLIC by design and live in `src/lib/supabaseClient.ts`; security is
enforced by Row Level Security (schema + policies + seed in
`supabase/schema.sql`). Public signups are DISABLED in the dashboard -
authenticated = admin. Tables: `pillars` (incl. quota), `questions`,
`quiz_config`, `results`.

**Content source of truth is now the DATABASE, with a draft/publish flow**
(migrations 2+3, Lotem's request): admin edits write to the draft tables
(pillars/questions/quiz_config - readable by authenticated only, private
from visitors), and the "פרסום לאתר" button calls the `publish_content()`
DB function (authenticated-only; anon execution explicitly revoked - the
Supabase default privileges grant it and revoking PUBLIC is NOT enough,
verified exploitable then fixed) which snapshots the draft into
`published_content` (append-only = version history). Visitors read ONLY the
latest published snapshot. `src/content/*` files are the baked FALLBACK and
original seed - editing them changes nothing live. The admin shows a
dirty-state line ("יש שינויים שעדיין לא פורסמו") by comparing editable
fields against the latest snapshot, and "גיבוי JSON" downloads a manual
backup (free tier has no automatic backups).

## Admin access

`#/admin` sits behind real authentication (`AuthGate.tsx` -> Supabase email
+ password; the only user is Lotem's, created by her in the dashboard -
Claude never knows the password). The admin writes straight to the DB.
Anonymous visitors can read content and insert results only - verified by
direct REST probes.

## Content backups

Automatic: `.github/workflows/backup-published.yml` runs daily (and on
demand) - fetches the latest published snapshot and commits it to
`backups/published-latest.json` when it changed. The file's git history is
the full archive of every published version, living outside Supabase.
The manual "גיבוי JSON" admin button was removed (Lotem's decision) in favor
of this automation. Note: GitHub disables cron workflows after ~60 days
without repo activity; a quiet repo means the last backup simply stays the
last one, and the workflow can be re-enabled from the Actions tab.

## Quiz length

Derived, never configured: the length is the sum of the pillar quotas, so
the admin sets it by editing the mix. `contentStore.deriveQuizLength` counts
`min(quota, questions the pillar actually has)` so the number shown to
visitors is what they will really be asked. `quiz_config.quiz_length` still
exists in the database but nothing reads it. The only publish restriction
left is that an empty quiz (all quotas 0) cannot be published.

## Known limitations / next

- Frontend polish phase planned. Bundle grew to ~457KB raw (~132KB gzip)
  with supabase-js - a code-split candidate.
- Results are recorded but not yet visible anywhere (admin results view is
  future work). Pin-the-flag feature still awaits Lotem's spec.
- The pin-flag threshold is in the DB but not editable in the admin UI yet.
- Pillar descriptions and source links live in the DB with no editing UI -
  change them via SQL (see `supabase/migration-5-pillar-sources.sql`).
