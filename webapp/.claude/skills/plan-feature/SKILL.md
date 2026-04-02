---
name: plan-feature
description: Plan out the implemenation of a feature, based on user input, documentation, and the codebase
argument-hint: [feature_description]
user-invocable: true
context: fork
---

Create a plan for how this feature would be implemented.

If given, look at the reference files the user provides as a starting point. 

The folder `docs/features` contains traces and documentation on how some existing features were implemented. Before planning, look through that to see if any similar features have been implemented before, and try your best to match the implementation there. 

Create the plan for the feature, and write it to a MD file in /docs/scratchpad/<feature_name>-plan.md. Keep the implementation plan concise enough for a human to read, but detailed enough to a future LLM to one-shot the implementation. 
