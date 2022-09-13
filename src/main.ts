import * as core from '@actions/core'
import * as fetch from 'node-fetch'
import * as github from '@actions/github'
import {useGithub} from './helpers/useGithub'
import {useAzureBoards} from './helpers/useAzureBoards'
import {actionEnvModel} from './models/actionEnvModel'
import {useValidators} from './helpers/useValidators'

const version = '1.0.0'
global.Headers = fetch.Headers

async function run(): Promise<void> {
  console.log('VERSION ' + version)

  const vm = getValuesFromPayload(github.context.payload)

  const {
    isPullRequestEvent,
    isBranchEvent,
    isReviewEvent,
    isBotEvent,
    isProtectedBranch
  } = useValidators(vm)

  const {getPullRequest} = useGithub(vm, github.context)

  const {
    getWorkItemIdsFromPullRequest,
    getWorkItemIdFromBranchName,
    getWorkItemIdsFromContext,
    updateWorkItemByPushEvent,
    updateWorkItem
  } = useAzureBoards(vm, github.context)

  const updateWorkItemsFromPullRequest = async (pullRequest: any) => {
    let workItemIds = getWorkItemIdsFromPullRequest(pullRequest)

    if (workItemIds != null && workItemIds.length > 0) {
      console.log('Found work items: ' + workItemIds.toString())

      workItemIds.forEach(async (workItemId: string) => {
        await updateWorkItem(workItemId, pullRequest)
      })
    } else {
      console.log(`No work items found to update.`)
    }
  }

  try {
    const pullRequest = await getPullRequest()
    console.log(`Pull Request: ${pullRequest}`)
    console.log(`GitHub event name: ${vm.githubEventName}`)

    console.log(github.context)

    if (isPullRequestEvent()) {
      if (isBotEvent(pullRequest)) {
        console.log('Bot branches are not to be processed')
        return
      }

      console.log(`Pull Request title: ${pullRequest.title}`)
      console.log(`Pull Request body: ${pullRequest.body}`)

      try {
        await updateWorkItemsFromPullRequest(pullRequest)
      } catch (err: any) {
        core.setFailed(
          'Wrong PR title format. Make sure it includes AB#<ticket_number>.'
        )
        core.setFailed(err.toString())
      }
    } else if (isReviewEvent()) {
      console.log('Pull request review event')
      await updateWorkItemsFromPullRequest(pullRequest)
    } else if (isBranchEvent()) {
      console.log('Branch event')

      // if (isProtectedBranch()) {
      //   console.log('Automation will not handle commits pushed to master')
      //   return
      // }

      var workItemId = getWorkItemIdFromBranchName(vm.currentBranchName)

      if (workItemId != null) {
        await updateWorkItem(workItemId, pullRequest)
      } else {
        const workItemIds = getWorkItemIdsFromContext(github.context)
        if (workItemIds != null && workItemIds.length) {
          workItemIds.forEach(async (workItemId: string) => {
            await updateWorkItem(workItemId, null)
          })
        }
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
    process.env.current_branch_name,
    process.env.dev_branch_name,
    process.env.staging_branch_name,
    process.env.main_branch_name,
    process.env.in_progress_state,
    process.env.in_review_state,
    process.env.merged_state,
    process.env.staging_state,
    process.env.closed_state
  )
}

run()
