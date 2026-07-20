# ADR 0001: Terminal Key Strategy for `system_branches`

## Context

The system must store branch terminal records in `system_branches` and support clean onboarding of new terminals. Two candidate key strategies were evaluated:

1. Use a human-readable terminal identifier as the primary key.
2. Use a surrogate numeric `id` primary key and keep terminal code as a unique attribute.

The design decision must balance:
- routing simplicity for services that resolve terminal metadata by code,
- onboarding ease for creating new terminals without breaking existing references,
- migration risk when evolving schema or rekeying data.

## Candidate Designs

### Option A: Human-readable terminal code as primary key
- Primary key: `terminal_code` (e.g. `BUEA-01`, `DOUALA-02`)
- Additional columns: `is_active`, `onboarded_at`, timestamps

#### Pros
- routing simplicity: services can join or query directly by terminal code without translating from an `id`.
- onboarding ease: new terminals are introduced using their actual code, making records self-describing.
- fewer joins in query paths that already use terminal code as the caller-facing identifier.

#### Cons
- migration risk: altering a terminal code requires updating every referencing table and service.
- key stability: if terminal naming conventions change, the primary key must change too.
- index size / performance: string PKs are larger than integer PKs, slightly increasing index and join cost.

### Option B: Surrogate integer `id` primary key with terminal code unique
- Primary key: `id` (BIGSERIAL)
- Unique attribute: `terminal_code`
- Additional columns: `is_active`, `onboarded_at`, timestamps

#### Pros
- migration risk: terminal code can be renamed without affecting foreign key references.
- onboarding ease: internal IDs remain stable while actual terminal codes can be managed as metadata.
- standard relational design: numeric surrogate keys are familiar and usually less expensive for joins.

#### Cons
- routing simplicity: services must map terminal codes to IDs before executing join-based lookups.
- additional lookup: every terminal-code-based query needs a join or lookup on the `system_branches` table.
- developer overhead: more implicit indirection between user-facing terminal identifiers and DB references.

## Tradeoff Review

### Routing Simplicity
- Option A scores higher because the terminal code is directly usable as the key.
- Option B scores lower because it introduces an extra lookup step.

### Onboarding Ease
- Option A is strong when terminal codes are stable and onboarding means simply inserting a new code.
- Option B is strong when terminal codes may need to change or be corrected after creation, since references remain stable.

### Migration Risk
- Option A has higher migration risk if terminal codes ever need to change.
- Option B reduces migration risk by decoupling identity from mutable code.

## Decision

### Chosen design: Option A — Human-readable `terminal_code` as primary key

Rationale:
- The system expects terminal codes to be the primary lookup key for routing.
- Onboarding is easier with self-describing terminal records.
- Existing operations and seed data already use codes directly.
- The terminal code space is stable enough for this domain, and the explicit code-as-key improves developer clarity.

## Consequences

- `system_branches` will be defined with `terminal_code` as the PK.
- All references to branch terminals should use `terminal_code` where routing/lookup is required.
- If a code change becomes necessary, a migration will need to update any dependent records and services.

## Updated Schema Definitions

- `S1-05`: `system_branches(terminal_code PK, is_active, onboarded_at, created_at, updated_at)`
- `S2-02`: `global_users(id PK, email UNIQUE, display_name, role ENUM, is_active, created_at, updated_at)`
