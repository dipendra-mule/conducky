---
applyTo: '**'
---
## Testing Instructions

- All new features must include appropriate automated tests (unit, integration, or both) as part of the implementation.
- Any new API endpoints much include automated tests
- Bug fixes should include regression tests to prevent recurrence.
- Tests must be run and pass before a feature or bugfix is considered complete.
- Pull requests should not be merged unless all required tests pass in CI.
- The testing process, including how to run and write tests, must be clearly documented in `/website/docs/developer-docs/testing.md`.
- When adding or updating features, update `/website/docs/developer-docs/testing.md` with any new or changed testing instructions as needed.
- Use the provided scripts (`./backend/npm test`, `./frontend/npm test`,`./backend/npm run test:coverage`,`./frontend/npm run test:coverage` `./npm run test:all`) to run tests locally before pushing changes.
- For features that require manual testing, document the manual test steps in the relevant PR or issue.
