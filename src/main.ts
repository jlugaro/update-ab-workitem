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

  const {getPullRequest, getCommitsFromPullRequest} = useGithub(
    vm,
    github.context
  )

  const {
    getWorkItemIdsFromPullRequest,
    getWorkItemIdFromBranchName,
    getWorkItemIdsFromContext,
    updateWorkItemByPushEvent,
    getWorkItemIdsFromCommits,
    updateWorkItem
  } = useAzureBoards(vm, github.context)

  const updateWorkItemsFromPullRequest = async (pullRequest: any) => {
    console.log(`updateWorkItemsFromPullRequest ${pullRequest}`)

    const commits = await getCommitsFromPullRequest(pullRequest)

    let workItemIds = getWorkItemIdsFromPullRequest(pullRequest, commits)

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

    console.log(`Pull Request: `)
    console.log(pullRequest)

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
          'Could not find work items for the provided pull request. Make sure it includes AB#<ticket_number>.'
        )
        core.setFailed(err.toString())
      }
    } else if (isReviewEvent()) {
      console.log('Pull request review event')
      try {
        await updateWorkItemsFromPullRequest(pullRequest)
      } catch (err: any) {
        core.setFailed(
          'Could not update the work item from the Pull Request Review.'
        )
        core.setFailed(err.toString())
      }
    } else if (isBranchEvent()) {
      console.log('Branch event')

      // if (isProtectedBranch()) {
      //   console.log('Automation will not handle commits pushed to master')
      //   return
      // }
      let workItemIds: string[] = []

      console.log(github.context.payload.commits)

      if (github.context?.payload?.commits) {
        workItemIds = getWorkItemIdsFromCommits(github.context.payload.commits)
      }

      const workItemIdFromBranchName = getWorkItemIdFromBranchName(
        vm.currentBranchName
      )

      if (workItemIdFromBranchName) {
        workItemIds.push(workItemIdFromBranchName)
      }

      const workItemIdsFromContext = getWorkItemIdsFromContext(github.context)

      if (workItemIdsFromContext) {
        workItemIds.concat(workItemIdsFromContext)
      }

      workItemIds = workItemIds.reduce((distinct: string[], id: string) => {
        if (!distinct.includes(id)) {
          distinct.push(id)
        }
        return distinct
      }, [])

      if (workItemIds != null && workItemIds.length) {
        workItemIds.forEach(async (workItemId: string) => {
          await updateWorkItem(workItemId, null)
        })
      }
    }
  } catch (err: any) {
    core.setFailed(err.toString())
  }
}

function getValuesFromPayload(payload: any) {
  let branchName = process.env.current_branch_name
  if (branchName) {
    if (branchName.includes(process.env.dev_branch_name as string)) {
      branchName = process.env.dev_branch_name
    } else if (branchName.includes(process.env.staging_branch_name as string)) {
      branchName = process.env.staging_branch_name
    } else if (branchName.includes(process.env.main_branch_name as string)) {
      branchName = process.env.main_branch_name
    }
  }

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
    branchName,
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
