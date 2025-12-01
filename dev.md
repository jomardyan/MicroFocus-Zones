Productivity: “MicroFocus Zones” – Task‑Scoped Tab & Distraction Gates
Core idea:
A task‑centric productivity extension that creates temporary, strict-focus zones where only tabs and tools related to a single task are allowed—enforced with a “gate” system instead of crude domain blocking.

What it does
User defines a task (e.g., “Write blog post on ESP32 OTA updates”).

When activating that task:

The extension:

Captures currently opened relevant tabs into a Task Capsule.

Suspends or hides unrelated tabs (without closing).

Blocks opening of tabs unrelated to this task using a soft gate (confirmation friction with a reason prompt).

When task ends or breaks:

Restores previous environment exactly as it was.

Why it’s new/useful
Typical productivity tools:

Blocklist domains or use time limits (e.g., “no YouTube”).

This focuses on task context, not domains:

YouTube video about ESP32 debugging is allowed during an ESP32 task.

Random music videos are not.

Feels like creating a temporary project-specific “mini desktop” in the browser.

Key features
Task Capsules:

Each capsule stores:

List of tabs (URL + scroll position + title).

Mini notes/checklist for that task.

One-click restore later: open all needed tabs exactly as before.

Semantic relevance gate:

When user tries to open a new tab:

Extension checks its semantic similarity to the task title/notes (local embedding or heuristic).

If unrelated, a gate prompt appears:

“This doesn’t look related to ‘Write ESP32 OTA post’. Still open? If yes, mark as: [Legit research] [Short break] [Off-task].”

Collects stats on how often user diverges.

Micro-focus timers:

Built‑in 25/50‑minute timers per task.

During a focus period, unrelated tabs are:

Hidden from the tab strip, or

Shown but with strong visual dimming and a “not in this Zone” overlay.

Context history:

Shows a timeline of focus sessions:

Task name, time spent, number of gates bypassed, top domains used.

Can help understand where attention leaks.

Implementation notes
Uses chrome.tabs, chrome.storage, and chrome.sidePanel or popup UI.

Optional lightweight semantic check:

Local embeddings via WebAssembly model or heuristic keyword matching.

No heavy blocking; it adds friction and awareness instead of hard bans.