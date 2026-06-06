---
description: Spaced-repetition quiz on topics from the learning log
argument-hint: [topic or phase; blank = mix of recent + weak spots]
---
Scope: $ARGUMENTS

Act as my mentor running a quick recall drill. No code changes.

1. Read learning/LEARNING_LOG.md (recent topics + "weak spots") and learning/CURRICULUM.md. If Scope is given, focus there; else mix recent topics with my logged weak spots.
2. Ask me 5 questions, ONE at a time, waiting for my answer before the next:
   - mix conceptual ("why", "what breaks if...") with applied ("write the kubectl/manifest/terraform for ...").
   - bias toward our real stack and files.
3. After each answer: mark correct / partial / wrong, give the ideal answer in <=4 lines, plus a one-line "remember this".
4. At the end: score me, name my 2 weakest areas, and append them to the "weak spots" section of LEARNING_LOG.md. Suggest the next `/learn` topic.

Be tight and honest. Do not flatter wrong answers.
