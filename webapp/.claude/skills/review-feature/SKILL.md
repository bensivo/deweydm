---
name: review-feature
description: Review the current working branch against style guides and identify refactoring opportunities
argument-hint: []
user-invocable: true
---

Review all changes in the current working branch to ensure compliance with project style guides and identify areas for code cleanup and maintainability improvements.

## What This Skill Does

1. **Style Guide Compliance Check**
   - Review TypeScript code against `docs/typescript-style-guide.md`
   - Review LESS/CSS code against `docs/less-style-guide.md`
   - Review Angular code against `docs/angular-codebase-design.md`
   - Check folder structure, naming conventions, architecture patterns

2. **Code Quality Analysis**
   - Identify code duplication and abstraction opportunities
   - Find unused variables, imports, or exports
   - Look for overly complex functions that should be simplified
   - Check for missing error handling or edge cases
   - Identify performance issues or inefficient patterns

3. **Maintainability Review**
   - Suggest improvements to naming and clarity
   - Recommend refactoring opportunities
   - Check for proper separation of concerns
   - Verify business logic is in services, not components
   - Ensure stores are simple and have no side effects

4. **Architecture Verification**
   - Confirm proper three-layer design (Component → Service → Store)
   - Check that components don't contain business logic
   - Verify services handle all side effects
   - Ensure stores only use Signals and basic CRUD

## Output
Generate a concise, quickly-reviewable document with:
- **Style Guide Issues**: Specific violations with file paths and line numbers
- **Code Quality Issues**: Problems found with explanations
- **Refactoring Recommendations**: Opportunities to improve maintainability
- **Architecture Notes**: Any architectural concerns or improvements
- **Quick Wins**: Easy fixes that would improve code quality

For each item, just put a bullet point, a severity ('HIGH', 'MEDIUM', 'LOW'), a file name and line number, a description of the issue, and a suggested fix (if there is an obvious one).

Focus on actionable feedback that improves maintainability and consistency with the project's standards.

