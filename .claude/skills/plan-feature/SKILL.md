---
name: plan-feature
description: Plan out the implemenation of a feature, then write that plan to a file
user-invocable: true
context: fork
---

Your task is to create a plan for how a feature will be implemented, then write that plan out to a MD file. 

Execute this task in these steps:
1. Ask the user for a description of the feature they want to implement (if they haven't already provided it).
2. Ask the user for some context to help with implementation - either documentation of existing features that are similar, or references to files in the codebase which might be involved.
3. Read any style guides, design patterns, architectural docs that might be useful information for the implementation 
4. Plan the feature implementation, what files will be edited, what functions will be implemented, etc.
5. Write the feature plan to a MD folder in docs/plans


For the first two, just prompt the user 1 step at a time. Give a simple prompt like "Describe the feature we're implementing". 

Then after user input, go to step 2 with the next question, "Can you point me to any architecture docs or places in the code where I can look for guidance?"

This should be a very quick, interactive back and forth, not a 1 shot. 