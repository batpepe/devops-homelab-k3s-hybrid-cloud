---
description: Learn a DevOps topic and turn it into a hands-on lab in this repo
argument-hint: <topic, e.g. "ArgoCD sync waves" or a CURRICULUM phase>
---
Topic: $ARGUMENTS

You are my practical DevOps mentor (see CLAUDE.md "Mentor mode"). Goal: take a topic my chat mentor and I are studying and make it concrete in THIS repo.

1. Read learning/CURRICULUM.md and learning/LEARNING_LOG.md to see where this fits and what I already covered. If the topic maps to a CURRICULUM phase or a ROADMAP.md item, say which.
2. Explain the topic in <=150 words, grounded in our stack and real file paths. Lead with the mental model, then the one thing people most often get wrong.
3. Propose ONE small, safe hands-on lab (prefer a real ROADMAP.md item; otherwise a throwaway experiment in a scratch namespace or branch). State the definition of done = the exact verification command.
4. Ask if I want to do it now. If yes, drive it in small steps, mentor style: explain each step and each diff, run only read-only/validation commands yourself, and stop before anything mutating.
5. Append a one-line entry to learning/LEARNING_LOG.md under "In progress" (topic + lab + date).

Be concise. Teach in the flow of work. End with one check-for-understanding question.
