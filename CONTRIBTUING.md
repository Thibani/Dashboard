# Contributing

## Team

- **Esteban** — Repo Maintainer, Tech Lead, Front-end Dev
- **Maryam** — Back-end Dev

## Branch Strategy

All branches are created from `main`, which must always be a deployable version.

There is no `dev` branch. To keep a version for testing purposes, if an issue comes up we pull `main` locally and test against our feature branches. This keeps versioning under control and avoids creating pull requests for no good reason.

Branches are named following this pattern:

```
<UseOfTheBranch>/<WhatIsChanged>
```

One branch is created per feature, to keep the versioning clean.

If several features depend on one another and can't work independently, we still create one branch per feature. These are merged into a dedicated integration branch first, then that integration branch is merged into `main` once it's ready — after which it is deleted.

Anyone can merge a pull request, as long as:
- It has at least two approving reviews, and
- The person merging is not the author of the pull request.

## Commit Convention

Every commit must follow this format:

```
<type>(<scope>): <description>
```

- **Type**: one of the standard [Conventional Commits](https://www.conventionalcommits.org/) types (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`), written in **lowercase**.
- **Scope**: one of `server`, `gui`, `ai`, `ci`, `docs` — or more specific if possible (e.g. a subdirectory or file affected).
- **Description**: mandatory, written in lowercase.

**Examples:**
```
fix(server): fix authentication error
feat(gui): add new sprites in the game
feat(ai): bot will look for food
```

## Setup

When cloning the repo, run:

```bash
npm init -y && npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
```

Then, from the root of the repository, run:

```bash
mkdir -p .git/hooks && cat > .git/hooks/commit-msg << 'EOF'
#!/bin/sh

ROOT="$(git rev-parse --show-toplevel)"
"$ROOT/node_modules/.bin/commitlint" --edit "$1"
EOF

chmod +x .git/hooks/commit-msg
```

## Review Process

- Reviews must be completed within 24 hours of the pull request's creation, during the working week.
- The reviewer checks: CI status, correctness, style, and architecture alignment.
- **Approved**: the reviewer found no issues and considers the code ready to merge. An approved review must not contain any comments — it should be clean.
- **Changes requested**: the review must include comments so the pull request author knows exactly where the issue is.
- Once a pull request has two approving reviews, it must be merged by the author of the last approval. 