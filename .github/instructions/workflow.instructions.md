---
applyTo: '**'
---
This rule standardizes the feature branch workflow for collaborative development in this project.

- Always refer to appropriate files in the `reference` directory.
- Issues created that are for features should be tagged as "enhancement", issues created for fixes should be tagged as "bug"
- If available, use the GitHub MCP tool for branch creation, PRs, and related workflow steps to streamline and standardize the process.
- Always start new work by switching to the `main` branch and running `git pull origin main` to ensure it is up to date.
- Create a new feature branch off of `main` using a clear, descriptive name (e.g., `feature/short-description`).
- Develop and test your feature. Run `npm run test:all` from the root of the project and verify all tests pass before marking the feature as ready.
- When the feature is ready, commit all changes with a descriptive commit message.
- Suggest to the user that they can push the feature branch to the remote repository. Do not push it yourself


Following this workflow helps maintain code quality and project consistency.