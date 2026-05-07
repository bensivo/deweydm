---
name: trace-feature
description: Document the implementation of a feature from e2e
user-invocable: true
context: fork
---

Your task is to create a MD document which traces the data flow of a single feature e2e, for use as project documentation and context for future feature implemenations. 


Use these steps:
1. Ask the user to describe the feature that they want to trace (if they didn't provide it already)
2. Ask the user to point you to some key files where the implementation might be, or some relevant docs
3. Walk the codebase and follow import paths, function calls, etc. to discover the whole e2e implementation
4. Write a document with the format below


Document format (md, with these headings):
- Overview - a description of the feature in 2-3 sentences
- Flow - A numbered breakdown of abstract data flows, using human language
- Trace - A stack-trace like trace of the feature, REpeating the high-level steps in 'flow', but then adding filepaths (relative to this project root), line numbers, function names.
    - Keep this short enough to be human readable, keep each step to 1-3 files and functions if possible


Write final document to `docs/traces/`