Fine. We’re building NAV CANADA Tetris Co-Pilot first, and we’ll do it cleanly so you can bolt on Agent Mesh / feedback / comparisons later without the whole thing collapsing like your stack when you panic-hold an I-piece.

Below is a step-by-step guide that gets you from zero → playable Tetris → “human-in-the-loop” AI assist → logging/accountability → demo-ready.

I’m going to assume a web app (React + TypeScript + Canvas) because it’s fast to demo, easy to share, and you already live in JS land.

Phase 0: Project rules (so you don’t accidentally build an autopilot)

NAV requirement translated into dev constraints:

AI never executes moves.

AI gives 2–3 suggested placements (visual overlays).

AI has limits (suggestion budget + confidence gating).

Human must decide rotation + placement + hold.

Everything is logged (suggestions, choice, outcome).

Keep those as non-negotiables.

Phase 1: Scaffold the app
1) Create project
npm create vite@latest nav-tetris -- --template react-ts
cd nav-tetris
npm install
npm run dev

2) Add basic utilities

Install optional helpers (not required):

npm install immer

3) Folder structure (loose coupling from day 1)
src/
  core/              # pure game logic (no UI)
    types.ts
    constants.ts
    rng.ts
    board.ts
    pieces.ts
    rules.ts
    reducer.ts
  ai/                # advisor only (no control)
    features.ts
    evaluator.ts
    suggest.ts
    budget.ts
    explain.ts
  telemetry/         # logs + replay
    events.ts
    logger.ts
    metrics.ts
  ui/
    CanvasBoard.tsx
    HUD.tsx
    SuggestionsOverlay.tsx
  App.tsx


Golden rule: core/ must not import from ui/ or ai/.
Only App.tsx wires them together.

Phase 2: Build the Tetris core (pure logic)
Step 2.1: Define types

In core/types.ts:

Cell = 0 | 1 | 2 | ... (or string colors)

Board: number[][]

PieceType: 'I'|'O'|'T'|'S'|'Z'|'J'|'L'

PieceState { type, rotation, x, y }

GameState { board, active, nextQueue, hold, canHold, score, level, lines, gameOver }

Action union: Tick | MoveLeft | MoveRight | Rotate | SoftDrop | HardDrop | Hold | Restart

Step 2.2: Implement board + collision

In core/board.ts:

create empty board

collides(board, pieceState): boolean

lockPiece(board, pieceState): Board

clearLines(board): { board, cleared }

Step 2.3: Pieces & rotations

In core/pieces.ts:

Define piece shapes in 4 rotations (matrix or coordinate list).

Provide helper: getBlocks(type, rotation): Array<{x,y}>

Step 2.4: Game reducer

In core/reducer.ts:

One function: reduce(state, action): GameState

All rules go here:

Tick: attempt move down; if collision then lock + clear + spawn next

Move/Rotate: if legal then apply

HardDrop: drop until collision, then lock

Hold: swap with hold piece (only once per spawn)

This reducer is your “safety-critical logic.” Keep it deterministic.

Step 2.5: Timing loop (in App)

Use requestAnimationFrame or interval to dispatch Tick based on level speed.

Phase 3: Render the game (Canvas UI)
3.1: Board renderer

ui/CanvasBoard.tsx:

Draw board grid

Draw active piece

Draw ghost piece (where it would land)

3.2: Controls

In App.tsx:

keydown mapping:

← → move

↑ rotate

↓ soft drop

Space hard drop

C / Shift hold

dispatch actions into reducer

At this point you have a working Tetris.

Phase 4: Add the “Co-Pilot” AI (advisor only)

This is where NAV challenge starts.

Step 4.1: Enumerate legal placements (no lookahead yet)

ai/suggest.ts:

For the current piece:

For each rotation (0–3)

For each x across board width

Simulate dropping piece until collision

If valid: produce a candidate MovePlan { rotation, x, landingY, resultingBoard }

Step 4.2: Score each candidate with heuristics

ai/features.ts compute:

holes

aggregate height

bumpiness

lines cleared

max height

ai/evaluator.ts:

weighted score:

reward lines cleared

penalize holes heavily

penalize height and bumpiness

Return top 3.

Step 4.3: Explainability tags

ai/explain.ts:
Given feature deltas, label moves:

“Reduces holes”

“Keeps board flat”

“Sets up Tetris well”

“Risky: adds holes”

Step 4.4: Confidence gating (must abstain sometimes)

Compute simple confidence:

gap between best and second best score

if small gap → “low confidence”
Rules:

High confidence → show 3 options

Low confidence → show 1 safe option OR show “Not sure”

Step 4.5: Suggestion budget (force human involvement)

ai/budget.ts:

budgetMaxPerLevel = 5 (example)

budget decreases each time user requests advice (press “A”)

budget resets when level changes

Important: AI suggestions should not be always-on.
Make it a user action:

Press A: “Request advice”

AI returns suggestions if budget remains

Otherwise: “Advice unavailable (budget empty)”

That’s literally “human meaningfully involved.”

Phase 5: Show the suggestions (overlay, not control)

ui/SuggestionsOverlay.tsx:

Draw 2–3 ghost outlines on the board (different style than normal ghost)

Side panel list:

Option 1: label + risk notes

Option 2: label + risk notes

Option 3: label + risk notes

No “auto apply.” Ever.

Phase 6: Telemetry and accountability (judge candy)
6.1: Event model

telemetry/events.ts:

AdviceRequested

AdviceProvided (candidates + features + confidence)

HumanAction (move/rotate/drop/hold)

PieceLocked

LinesCleared

GameOver

RunSummary

6.2: Logger

telemetry/logger.ts:

store events in memory

allow export JSON (“Download run log” button)

6.3: Run summary for demo

At game over, show:

Advice requests used / budget total

% of time human followed top suggestion

Average hole delta after locks

Best score, lines, level

This is how you prove: the human remained the decision maker.

Phase 7: “NAV Canada flavor” (ATC analogy without cringe)

Add a “Safety Alert” system:
ai/ or core/ metric triggers:

“Stack height critical”

“Hole count increasing”

“Recovery recommended”

Show it like an ATC conflict alert: advisory, not control.

Phase 8: Make it demo-ready

Checklist:

Works in browser, stable FPS

Clear UI showing:

advice budget

confidence (high/low)

options + reasons

alerts

exportable logs

2-minute demo script:

Play normally

Request advice a few times

Budget runs out

Human survives anyway

Export log + show summary