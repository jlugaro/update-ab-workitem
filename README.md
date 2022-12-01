<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# Update work item state using GitHub Actions and Azure DevOps

This is a Typescript rewrite of the original project [CanarysAutomations/pr-update-work-item-state](https://github.com/CanarysAutomations/pr-update-work-item-state)

The intention of this rewrite is to cleanup the code, extend its current functionalities and implement tests (which are not implemented yet).

All credit goes to [CanarysAutomations](https://github.com/CanarysAutomations/pr-update-work-item-state), [MarcinGadomski94](https://github.com/MarcinGadomski94/pr-update-work-item-state), and [sigglep](https://github.com/sigglep/pr-update-work-item-state).

## Project Setup

Install the dependencies

```bash
$ yarn
```

Build the typescript and package it for distribution

```bash
$ yarn build && yarn package
```

Run the tests :heavy_check_mark:

```bash
$ yarn test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Adding the Actions YML

```yml
name: 'Azure Boards work item state update'

on:
  pull_request:
    branches: [main, development]
    types: [opened, closed, edited]
  push:
    branches: [main, development]

jobs:
  alert:
    runs-on: ubuntu-latest
    name: Work item state update workflow
    steps:
      - uses: jlugaro/pr-update-work-item-state@master
        env:
          ado_token: '${{ secrets.ADO_PAT }}'
          ado_organization: '${{ secrets.ADO_ORGANIZATION }}'
          ado_project: '${{ secrets.ADO_PROJECT }}'
          gh_token: '${{ secrets.GH_PAT }}'
          gh_repo_owner: 'your-repo-name'
          gh_repo: 'your-repo-project-name'
          pull_number: '${{github.event.number}}'
          branch_name: ' ${{github.ref}} '
          closedstate: 'Closed'
          inprogressstate: 'Active'
          propenstate: 'Resolved'
          on_push_event: 'Staging' # Optional. This will cause to force a workitem state on Push Events
          on_pull_request_event: 'Closed' # Optional. This will cause to force a workitem state on Pull Request Events
```
