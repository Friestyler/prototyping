---
description: Start a session — grab the team's latest work and get ready to take a CSV or business requirement.
---

The user is starting a new working session. They are **non-technical**. Walk them through the start-of-session workflow without ever using technical words like "git", "pull", "branch", "commit", "rebase", "remote".

1. Grab the team's latest work by running `git pull --rebase`.
   - If it works: silently move on.
   - Network error → "Couldn't reach the shared project. Want me to try again?"
   - Refused because of unsaved local files → "Looks like some work from last time hasn't been shared yet. Want me to share it first?" and wait for their answer.
   - Merge conflict → explain in plain language which file is involved and ask how to proceed.

2. Run `git status --short` to spot leftovers from a previous session. If anything is uncommitted under `databases/` or `sql-results/`, gently mention it:

   > Heads up — there's some work from last time that hasn't been shared yet (`<folder>`). Want me to share it now, or are you starting something new?

   If the working tree is clean, skip this step entirely.

3. Greet them and invite the next step:

   > 👋 You're all caught up with the team's latest work. What can I help with today?
   > • Drop a CSV (or paste its path) and tell me what you want to find out
   > • Or pick up an existing query — just say which one

4. Wait for their message. From there, follow `CLAUDE.md` normally (scaffold the database folder for any CSV they mention, write the requirement / SQL / result CSV / report) and use the **"Saving finished work to the shared project"** flow at the bottom of `CLAUDE.md` when they say it's final.

Never print raw command output to the user. Translate everything to plain language.
