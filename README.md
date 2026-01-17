# Tetris Co-pilot

Human-in-the-loop Tetris prototype that pairs fast automation with forced human decisions. Automation suggests and can auto-place high-confidence moves but always keeps the player accountable with mode gating, streak limits, and transparent rationales.

## Features
- Co-pilot modes: Advise-only, Timed assist (auto-place after a short countdown), and Emergency drop.
- Top 3 move suggestions with risk badges and heuristic scores; ghost overlay for the best move.
- Survival-focused heuristic (holes, height, bumpiness) plus line clear bonus.
- Auto-place streak cap to prevent long runs of automation without human input.
- Event log capturing mode changes, auto placements, and line clears for accountability.
- Simple UI with clear state indicators and keyboard shortcuts.

## Getting started
1. Install dependencies (Node 18+):
   ```bash
   npm install
   ```
2. Run the dev server:
   ```bash
   npm run dev
   ```
3. Open the printed local URL (default `http://localhost:5173`).

## Controls
- Left / Right: Move
- Up: Rotate
- Down: Soft drop
- Space: Hard drop
- A: Switch to Advise-only
- S: Switch to Timed assist
- D: Emergency drop (forces best survival move)

## Modes and human involvement
- Advise-only: Automation only recommends; player moves everything.
- Timed assist: If the player does not act before the countdown, automation locks in the best move (capped at three consecutive auto placements, then it waits for manual input).
- Emergency drop: Player-triggered stabilization; immediately plays the best survival move.

## Project structure
- index.html — Shell and layout
- src/styles.css — Visual styling and risk badges
- src/main.js — Game engine, heuristic evaluator, mode logic, UI bindings

## Implementation notes
- Uses Vite for a minimal dev server/bundle.
- Heuristic scoring favors low holes and lower stacks; lines add positive weight; bumpiness and height are penalized.
- Ghost overlay switches to the best suggestion in assisted modes to make automation intent visible.

## Next ideas
- Add T-spin/back-to-back awareness to the evaluator.
- Add replay review showing human vs. auto choices.
- Tune auto delay dynamically based on board risk and human performance.
