---
name: review-feature
description: Review the implementation of the given feature, and check it against codebase style guides and bad patterns
user-invocable: true
context: fork
---

Your task is to review the implementation of a feature, as if you are a senior engineer reviewing someone else's code. Do this in 3 steps, using sub-agents with clean context windows. 

## Step 1 - Create refactor opportunities
Take the code given, the style guides given, and generate a document "./refactor-opportunities.md" listing each issue found in the codebase, describing it, pointing to code, and roughly mapping out what a fix would be. 

The user may point you to the feature in one of these ways:
- Describing the feature itself (look in the codebase for the implementation, or look for a plan file)
- Pointing you to an implementation plan file (just read the MD file given)
- Using the git worktree, either current branch, current staged changes

Interactively ask the user where to find the feature, if none of these is given.

Also, before you review, find the codebase style guides. They are in `docs/style-guide` folders. 


## Step 2 - Review refactor opportunities
IN A NEW AGENT, read the doc './refactor-opportunities.md', then take each finding 1 by 1, and interactively show it ot the user - in a very short and concise manner, no more than 1-2 sentences to describe the issue, and a few files to point to. Ask the user if they would liket o include this finding in the refactor plan or not. After all findings have been reviewed by the user, create a new file './reviewed-refactor-opportunities.md'

## Step 3 - Create Refactor Plan
IN A NEW AGENT, 
Your task is to create a plan how this refactor will be implemented, then write that plan out to a MD file. 

Execute this task in these steps:
1. Look at the description of the refactor given to you by the previous agent, and in the ./reviewed-refactor-opportunities.md file
3. Read any style guides, design patterns, architectural docs that might be useful information for the implementation 
4. Plan the feature implementation, what files will be edited, what functions will be implemented, etc.
5. Write the feature plan to a MD folder in docs/plans
