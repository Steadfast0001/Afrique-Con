# Contributing Guidelines & Branching Model

Thank you for contributing to Afrique-Con! To maintain code quality and ensure stable releases, we follow a structured branching model based on GitFlow.

## Branching Model

We use the following branch types to manage development:

### 1. Permanent Branches
*   **`main`**: Represents the production-ready state of the codebase. Only stable, fully tested releases are merged here. Direct commits to `main` are restricted.
*   **`develop`**: The main integration branch for ongoing development. This is where features are merged for testing before release.

### 2. Supporting Branches
*   **`feature/*`**: Used to develop new features or enhancements.
    *   *Source Branch*: `develop`
    *   *Merge Target*: `develop` (via Pull Request)
    *   *Naming Convention*: `feature/short-description` or `feature/ticket-number`
*   **`release/*`**: Used to prepare for a new production release. Allows for minor bug fixes and release preparation without blocking ongoing feature development.
    *   *Source Branch*: `develop`
    *   *Merge Target*: `main` and `develop`
    *   *Naming Convention*: `release/vX.Y.Z`
*   **`hotfix/*`**: Used to quickly address critical issues in production.
    *   *Source Branch*: `main`
    *   *Merge Target*: `main` and `develop` (or the active release branch)
    *   *Naming Convention*: `hotfix/short-description`

---

## Development Workflow

1.  **Create a Feature Branch**:
    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feature/your-feature-name
    ```
2.  **Commit Your Changes**: Follow clear, descriptive commit messages.
3.  **Submit a Pull Request (PR)**: Target the `develop` branch. Ensure code reviews and CI checks pass before merging.
4.  **Preparing a Release**:
    *   Branch off `develop` to `release/vX.Y.Z`.
    *   Finalize tests and bump version.
    *   Merge to `main` (and tag) and back into `develop`.

---

## Branch Protection & Pull Request Guidelines

To ensure code stability, both the `main` and `develop` branches are protected. The following settings are required:

### Required Reviews
- **Pull Request Reviews**: All code merges into `main` and `develop` require a minimum of **1 approving review** from a code owner (defined in [.github/CODEOWNERS](file:///d:/AFRIQUE/Afrique-Con/.github/CODEOWNERS)).
- **Dismiss Stale Approvals**: New commits pushed to a pull request will dismiss previous approvals.

### Required Status Checks
- The **`Validate PR`** status check (defined in [.github/workflows/ci.yml](file:///d:/AFRIQUE/Afrique-Con/.github/workflows/ci.yml)) must pass before a branch can be merged.
- **Require branches to be up to date**: Branches must be up-to-date with the target branch (`main` or `develop`) before merging.

