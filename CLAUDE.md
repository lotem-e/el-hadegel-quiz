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
hash router in `App.tsx` (`#/admin` = backoffice). Supabase for the backend
(see below). Plus `ivrita` for gendered Hebrew, which is why the project is
AGPL-3.0 (`LICENSE`, and the `license` field in `package.json`).

## Commands

- `npm run dev` - dev server
- `npm run build` - type-check (`tsc --noEmit`) + production build
- `npm run verify` - every check: quiz engine, screen rendering, content
  integrity, and the unpublished-changes logic (`scripts/verify.tsx`)
- `npm run check` - build + verify, i.e. what to run before deploying
- `npm run preview` - serve the production build locally

## Docs

- `docs/admin-guide.md` - the admin interface spec, in Hebrew, written for
  Lotem rather than for a developer
- `supabase/README.md` - what each migration did, and how to write the next

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

## Link previews - since 2026-08-11

`index.html` carries og:* and twitter:* tags plus `public/og-image.png`
(1200x630, the logo on navy - built from the Logo.tsx vector paths so no font
had to be rendered; `qlmanage` only renders SVG into a SQUARE thumbnail, so the
source is a 1200x1200 square that `sips -c 630 1200` crops).

**The URLs in those tags are absolute on purpose.** A scraper fetches the page
from its own server, so vite's relative `base: './'` paths would resolve
against the wrong host. If the site moves off github.io, those URLs move with
it - they are the one place in the app that hardcodes the domain.

The `noindex` meta does not stop link previews: it is a search-engine
directive, and the social scrapers go by robots.txt (there is none here).

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

## Writing a migration (the template)

Content changes made in SQL land in the DRAFT, so without this envelope they
surface in the admin as "unpublished changes" Lotem never made. Every content
migration must be wrapped:

```sql
begin;
select public.system_change_begin();
-- ... the updates ...
select public.system_change_publish();
commit;
```

`system_change_publish()` publishes only if her draft was already fully
published when the migration started; otherwise it returns `deferred` and the
change rides along with her next publish, so her unfinished work is never
pushed live behind her back. It raises if the two calls end up in different
transactions, so the `begin/commit` is load-bearing - tell her to run the file
in one go.

**Do not wrap a migration that changes question text.** Category copy is only
ever seen by her in the admin; statements are what visitors read, so those stay
hers to approve.

Structural migrations (new tables, functions, grants) need no envelope.

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

## Gendered address (עברית/ה) - since 2026-08-11

Three ways to address a visitor (Lotem's scheme, 2026-08-11):

| mode | form | example |
|---|---|---|
| `neutral` (default) | masculine PLURAL | כמה קרובים אתם |
| `male` | masculine SINGULAR | כמה קרוב אתה |
| `female` | feminine SINGULAR | כמה קרובה את |

**No slashes ever reach a visitor.** Ivrita cannot do this alone - it swaps
gender within a number but cannot turn a plural into a singular - so each
phrase is authored TWICE via `p(plural, singular)` from `src/lib/gender.tsx`:
the plural is what neutral shows, and Ivrita splits the singular for male and
female. The singular carries a slash only where the two genders differ in
writing, and in Hebrew they often do not ("עברת", "התחברת", "שלך", "רוצה" are
identical), so most singular copy needs no slash at all. Chosen with
`<GenderSwitch />`, remembered in localStorage under `elhadegel-gender-v1`.

Rules when touching visitor copy:

- A new string that addresses the reader is authored with `p(plural, singular)`
  and passed to `g()`. A plain string still works and passes straight through -
  that is how database content flows.
- Plural imperatives (דרגו, נסו, הצטרפו, גלו) are already gender-neutral -
  leave them alone. Participles used as CTAs (מתחילים/ות, נועצים/ות) are not.
- **Database content goes through `g()` too**, including the statements, the
  category names and the source labels. This is safe because Ivrita transforms
  ONLY slash forms - verified against all 54 statements, zero are altered. So
  plain text Lotem writes reaches visitors byte for byte, and a slash form she
  writes deliberately in the admin is honoured. It is authorship, not a runtime
  rewrite. What Ivrita cannot do is infer gender: it will never turn a plain
  "אתם מסכימים" into "אתן מסכימות", so the slash form has to be written.
- **The admin shows raw text, never genderized.** She is authoring the slash
  form there and has to see exactly what she typed.
- The import is the deep path `ivrita/src/ivrita`, not `ivrita`. The package's
  `browser` field points at `src/element.js` (a DOM wrapper that rewrites the
  page in place) which does not export `genderize`, so a plain `import` builds
  fine under Node and fails under Vite. `src/types/ivrita.d.ts` declares that
  same path.
- `npm run verify` checks the exact forms the copy relies on, and that the
  screens still address both genders by default.

**Do not "improve" their markup.** Their stylesheet keys everything - the
Ivritacons font, the 33px box, the colour - to `.ivrita-switch a`. Rendering
the logo as a semantically-tidier `<span>` silently dropped all of it and the
collapsed bar (what you see almost all the time) fell back to Heebo. Verified
against the reference implementation at alaxon.co.il, which is what Lotem
points at for the correct look: logo is an `<a>`, mode buttons carry
`ivrita-button-style-1` (the ss01 stylistic set - the library default style-0
is a different icon set), bar background rgba(255,255,255,.8), radius
0 7px 7px 0, neutral active by default.

The switch is Ivrita's own bar: `src/ui/style.scss` from the package is imported
verbatim (hence `sass` as a dev dependency, and their Ivritacons icon font in the
build), and `GenderSwitch` reproduces their markup exactly - same classes, icons,
collapse-until-hover, and the ⓘ link back to the project. What we do NOT use is
their `DefaultSwitch` class: it builds its DOM with a different JSX factory and
appends itself to `document.body` outside React. Their `setMode` was only ever a
call into whatever object you hand it, so React state takes that role. The bar is
`position: fixed`, so `App.tsx` renders it once for the whole visitor flow and
never on `#/admin`. Its `<a href="#">` links call `preventDefault` - without that
they would write a bare `#` into the URL and disturb the hash router.

## Creating a statement - since 2026-08-11

The admin could always edit, pin and delete; creating is new. The form takes
only text and category (Lotem's call - no source fields, no duplicate check:
"זו באחריות האדמין"). It inserts into the draft, so it publishes like any
other change.

The one subtle part is the id. Ids look like `<category>-<number>` and a
retired number must never be reused, but DELETE removes the row outright so
the questions table has no memory of it. `computeNextQuestionId` (exported
from `Admin.tsx`, so `npm run verify` can exercise it) therefore counts the
live pool AND every id in `published_content`, which is append-only.
vision-victory is the case that proves it necessary: it holds 1 and 2 today,
but 3-8 were used and retired, so counting only what exists would hand out 3.

Verified without admin credentials by attempting an anonymous REST insert: it
returns 42501 (RLS refusal) rather than PGRST204, which shows both that
visitors cannot create statements and that every column name in the insert
exists - a wrong name would fail before reaching the policy check.

## Known limitations / next

- Frontend polish phase planned. Bundle grew to ~457KB raw (~132KB gzip)
  with supabase-js - a code-split candidate.
- Results are recorded but not yet visible anywhere (admin results view is
  future work). Pin-the-flag feature still awaits Lotem's spec.
- The pin-flag threshold is in the DB but not editable in the admin UI yet.
- Pillar descriptions and source links live in the DB with no editing UI -
  change them via SQL (see `supabase/migration-5-pillar-sources.sql`).
