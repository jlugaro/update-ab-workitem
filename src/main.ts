import * as core from '@actions/core'
import * as fetch from 'node-fetch'
import * as github from '@actions/github'
import {useGithub} from './useGithub'
import {useAzureBoards} from './useAzureBoards'
import {actionEnvModel} from './models/actionEnvModel'

const version = '1.0.0'
global.Headers = fetch.Headers

async function run(): Promise<void> {
  try {
    console.log('VERSION ' + version)

    const vm = getValuesFromPayload(github.context.payload)

    const {pullRequest} = await useGithub(vm)

    const {getWorkItemsFromText, getWorkItemIdFromBranchName, updateWorkItem} =
      await useAzureBoards(vm, pullRequest)

    if (process?.env?.GITHUB_EVENT_NAME?.includes('pull_request')) {
      console.log('PR event')

      if (
        typeof pullRequest.title != 'undefined' &&
        pullRequest.title.includes('bot')
      ) {
        console.log('Bot branches are not to be processed')
        return
      }

      try {
        let workItemIds = getWorkItemsFromText(pullRequest.title)

        if (workItemIds == null || workItemIds.length == 0) {
          workItemIds = await getWorkItemsFromText(pullRequest.body)
        }

        if (workItemIds !== null && workItemIds.length > 0) {
          workItemIds.forEach(async (workItemId: string) => {
            console.log(`Update work item: ${workItemId}`)
            await updateWorkItem(workItemId)
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

      if (vm.branchName.includes('master') || vm.branchName.includes('main')) {
        console.log('Automation will not handle commits pushed to master')
        return
      }

      var workItemId = await getWorkItemIdFromBranchName()
      await updateWorkItem(workItemId)
    }
    console.log('Work item ' + workItemId + ' was updated successfully')
  } catch (err: any) {
    core.setFailed(err.toString())
  }
}

function getValuesFromPayload(payload: any) {
  return new actionEnvModel(
    payload.action,
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
