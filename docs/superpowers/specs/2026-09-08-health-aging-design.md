# Phase 5a: Health & Aging — Design

## Goal

Give the existing health/death system (currently just `rollDeath` in
`ageUp.ts`, producing the two generic causes `'Poor health'` / `'Old age'`)
real depth: persistent conditions the player can develop, treat, or ignore;
active health-management actions; richer, cause-specific deaths; and
injuries — including career-ending ones — tied into crime, sports/fame
careers, and lifestyle/vice events.

## Scope

Both halves requested, roughly equal weight:

1. **Richer causes of death** — expand beyond two generic strings into a
   weighted cause table wired into crime, sports/fame careers, and vice
   events (smoking, drinking, etc. — the smoking-pressure event already
   exists in `src/lib/data/events/teen.ts`).
2. **Active health management** — the player can see a doctor (costs
   money, chance to cure/mitigate a condition, small direct health boost)
   and toggle lifestyle choices (e.g. join a gym) that shift long-term
   health drift for a recurring cost.

Conditions are **persistent**: once diagnosed they stick around, apply
ongoing effects (health/happiness/money drift), and can be cured (via
doctor visits) or worsen if ignored. Injuries can be severe enough to
**force retirement** from a physical career (sports/entertainment),
pushing the player back into the job market via the existing quit-job path.

## Data model

Catalog-driven, following the pattern already established by
`JOB_CATALOG` / `CRIME_CATALOG` / `MAJOR_CATALOG` — new conditions are
data rows, not new branches of engine code.

**New file `src/lib/data/conditions.ts`** — `HealthCondition` catalog:

```ts
interface HealthCondition {
  id: string;
  name: string;
  description: string;
  yearlyEffects: Partial<Record<StatKey | 'money', number>>; // drift applied every year while active
  cureChance: number;       // 0-1, rolled once per doctor visit
  worsenChance: number;     // 0-1, rolled each yearly tick while untreated
  worsenPenalty: Partial<Record<StatKey | 'money', number>>; // extra one-time hit applied the year it worsens, on top of yearlyEffects; does not compound in v1
  forcesCareerExit?: boolean; // severe enough to end a sports/entertainment career on diagnosis
}
```

**`Character` gets a new top-level field** `conditions: ActiveCondition[]`
(flat, matching how `job`/`education`/`criminalRecord` are already
top-level fields rather than nested under a wrapper):

```ts
interface ActiveCondition {
  conditionId: string;
  diagnosedAge: number;
}
```

A condition has no separate "treated" status — each doctor visit rolls
`cureChance` fresh against every active condition; a hit removes it from
`conditions` outright (cured). Otherwise it stays active (and keeps
applying `yearlyEffects` / rolling `worsenChance`) until cured.

`Character` also gets `gymMembership: boolean` (defaults `false`) — a
simple flag, not a condition, since it's a player choice rather than a
diagnosed problem.

**New engine module `src/lib/engine/health.ts`**, mirroring
`career.ts`/`crime.ts`:

- `applyHealthYearlyTick(character)` — applies each active condition's
  `yearlyEffects`; untreated conditions roll `worsenChance` and take
  `worsenPenalty` if it hits. While `gymMembership` is active, deducts
  $200 and applies +1 health.
- `visitDoctor(character)` — costs a flat $300, rolls `cureChance`
  against each active condition (cured ones are removed from
  `conditions`), and applies +2 health regardless of outcome.
- `toggleGymMembership(character)` — flips a boolean `gymMembership`
  field on `Character` (not a condition); its $200/yr cost and +1 health
  drift are applied in `applyHealthYearlyTick`, not on toggle.
- `rollDeath(age, health, character)` — **moved from `ageUp.ts` into
  `health.ts`** and expanded from 2 generic causes into a weighted cause
  table: old age, condition-specific causes (e.g. a `'lung_cancer'`
  condition's death entry reads "Lung cancer"), plus injury/violence
  causes triggered directly by crime/sports outcomes (bypassing the
  age/health-curve roll entirely — those are immediate, not a yearly
  probability).

**`EventChoice` gets an optional `healthEffect?: HealthEffect`**
(add/cure a condition), matching the shape of the existing `jobEffect` /
`assetEffect` fields. This lets existing event content (the smoking
event in `teen.ts`) attach a `'smoker'` condition instead of just a
stat nudge.

## Systems integration

- **Crime** (`crime.ts`) — failed high-risk crimes (Burglary, Grand Theft
  Auto) get a chance of an injury outcome (new condition, or immediate
  death) as an alternative to jail, on top of the existing risk/reward roll.
- **Sports/fame careers** (`career.ts`, `field: 'sports'` /
  `'entertainment'`) — yearly tick gets a small age-scaling injury-risk
  roll. A severe hit sets `forcesCareerExit` on the resulting condition →
  the existing quit-job path fires, same as a normal job loss. No new
  career-state machinery needed.
- **Vice events** — smoking/drinking events already in `teen.ts` get a
  `healthEffect` on their existing choices, attaching the corresponding
  condition.

## UI

No changes to the Career/Relationships/Assets tabs. **Health becomes a
4th sub-tab on the Activities page** (`src/app/game/activities/page.tsx`),
alongside Crime / Casino / Investing, using the same `SegmentedControl`
pattern — always visible (unlike Casino/Investing, health management
isn't age-gated). Shows: active conditions (name, description), a "See a doctor" button
($300, disabled if unaffordable), and a gym-membership toggle showing
the $200/yr cost.

## Testing

- `health.test.ts` — condition catalog application, cure/worsen rolls
  (deterministic via `setRngSource`), doctor visit cost/effect, gym
  toggle drift, career-ending injury path.
- Extend `ageUp.test.ts` for the moved/expanded `rollDeath` cause table.
- Extend `crime.test.ts` and `career.test.ts` for the new injury hooks.
