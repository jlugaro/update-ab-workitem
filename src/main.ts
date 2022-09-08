import * as core from '@actions/core'
import * as fetch from 'node-fetch'
import * as github from '@actions/github'
import {useGithub} from './helpers/useGithub'
import {useAzureBoards} from './helpers/useAzureBoards'
import {actionEnvModel} from './models/actionEnvModel'
import {useValidators} from './helpers/validators'

const version = '1.0.0'
global.Headers = fetch.Headers

async function run(): Promise<void> {
  console.log('VERSION ' + version)

  const vm = getValuesFromPayload(github.context.payload)

  const {isPullRequest, isBotEvent, isProtectedBranch} = useValidators(vm)

  const {getPullRequest} = useGithub(vm)

  const {
    getWorkItemIdsFromPullRequest,
    getWorkItemIdFromBranchName,
    updateWorkItem
  } = useAzureBoards(vm)

  try {
    const pullRequest = await getPullRequest()

    console.log(`GitHub event name: ${vm.githubEventName}`)

    console.log(`Pull Request title: ${pullRequest.title}`)

    console.log(`Pull Request body: ${pullRequest.body}`)

    if (isPullRequest()) {
      if (isBotEvent(pullRequest)) {
        console.log('Bot branches are not to be processed')
        return
      }

      try {
        let workItemIds = getWorkItemIdsFromPullRequest(pullRequest)

        if (workItemIds != null && workItemIds.length > 0) {
          console.log('Found work items: ' + workItemIds.toString())

          workItemIds.forEach(async (workItemId: string) => {
            await updateWorkItem(workItemId, pullRequest)
          })
        } else {
          console.log(`No work items found to update.`)
        }
      } catch (err: any) {
        core.setFailed(
          'Wrong PR title format. Make sure it includes AB#<ticket_number>.'
        )
        core.setFailed(err.toString())
      }
    } else {
      console.log('Branch event')

      if (isProtectedBranch()) {
        console.log('Automation will not handle commits pushed to master')
        return
      }

      var workItemId = getWorkItemIdFromBranchName(vm.branchName)
      if (workItemId != null) {
        await updateWorkItem(workItemId, pullRequest)
      }
    }
  } catch (err: any) {
    core.setFailed(err.toString())
  }
}

function getValuesFromPayload(payload: any) {
  return new actionEnvModel(
    payload.action,
    process.env.GITHUB_EVENT_NAME,
    process.env.gh_token,
    process.env.ado_token,
    process.env.ado_project,
    process.env.ado_organization,
    `https://dev.azure.com/${process.env.ado_organization}`,
    process.env.gh_repo_owner,
    process.env.gh_repo,
    process.env.pull_number,
    process.env.branch_name,
    process.env.closedstate,
    process.env.propenstate,
    process.env.inprogressstate
  )
}

run()
