---
name: document-feature
description: Crawl through a codebase to trace the e2e implementation of a feature, and document it in a md file for use as context in the future
argument-hint: [feature_description] [filename]
user-invocable: true
context: fork
---

Look through this codebase, for the implementation of the feature described below, starting at the file mentioned:
$ARGUMENTS

Follow import paths, and crawl the rest of the codebase to find the e2e implementation of this feature, then create a file in .claude/docs/features/<feature_name>.md, with these headings:

- Description - what does this feature do?
- Trigger - how is this feature triggered or invoked?
- Data Flow - in numbered steps, how does control and data flow from the entrypoint to various other files in the codebase. Reference things by filename and function name.
- State Changes - What internal state changes thorughout this feature?
- External Integrations - Are any external systems involved, like databases, 3rd party APIs, or message brokers?
- Important Notes - Any other important notes a future developer would need to know about this feature?

Keep your document concise, technical, and with very minimal words. Assume the people who come after are engineers on this project, and understand this codebase pretty well - they just need to trace this 1 feature. 