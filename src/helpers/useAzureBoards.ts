import * as core from '@actions/core'
import * as azureDevOpsHandler from 'azure-devops-node-api'
import {actionEnvModel} from '../models/actionEnvModel'

export function useAzureBoards(env: actionEnvModel) {
  const getWorkItemsFromText = (text: string) => {
    try {
      const idList: string[] = []
      const matches = text.match(/[AB#(0-9)]*/g)

      if (matches) {
        matches.forEach(id => {
          if (id && id.match(/[AB#]+/g)) {
            const newId = id.replace(/[AB#]*/g, '')
            if (newId) {
              idList.push(newId)
            }
          }
        })
      }
      console.log('Found work items:' + idList.toString())

      return idList
    } catch (err) {
      core.setFailed('Wrong format. Make sure it includes AB#<ticket_number>')
    }
  }

  const getWorkItemIdFromBranchName = (branchName: string) => {
    try {
      const foundMatches: RegExpMatchArray | null =
        branchName.match(/([0-9]+)/g)

      console.log('Found matches on branch name' + foundMatches)

      const workItemId = foundMatches && foundMatches[3]

      console.log('Work item ID: ' + workItemId)

      return workItemId
    } catch (err) {
      core.setFailed(
        'Branch name format is wrong. Make sure it starts from AB#<ticket_number>'
      )
    }
  }

  const getWorkItemIdsFromPullRequest = (pullRequest: any) => {
    let workItemIds = getWorkItemsFromText(pullRequest.title)

    if (workItemIds == null || workItemIds.length == 0) {
      workItemIds = getWorkItemsFromText(pullRequest.body)
    }

    return workItemIds
  }

  const updateWorkItem = async (workItemId: string, pullRequest: any) => {
    console.log('Updating work item: ' + workItemId)

    let authHandler = azureDevOpsHandler.getPersonalAccessTokenHandler(
      env.adoPAT
    )

    let connection = new azureDevOpsHandler.WebApi(
      `https://dev.azure.com/${env.adoOrganization}`,
      authHandler
    )

    let client = await connection.getWorkItemTrackingApi()
    let workItem: any = await client.getWorkItem(<number>(<unknown>workItemId))

    console.log('Work Item Type: ' + workItem.fields['System.WorkItemType'])

    if (workItem.fields['System.State'] == env.closedState) {
      console.log('WorkItem is already closed and cannot be updated.')
      return
    } else if (
      workItem.fields['System.State'] == env.openState &&
      pullRequest.status != '204'
    ) {
      console.log('WorkItem is already in a state of PR open, will not update.')
      return
    } else if (
      workItem.fields['System.WorkItemType'] == 'Product Backlog Item'
    ) {
      console.log(
        'Product backlog item is not going to be automatically updated - needs to be updated manually.'
      )
    } else {
      if (pullRequest.status == '204') {
        console.log('Event: Pull Request was merged')
        await handleMergedPr(workItemId)
      } else if (pullRequest.state == 'open') {
        console.log('Event: Pull Request was opened ' + env.openState)
        await handleOpenedPr(workItemId)
      } else if (pullRequest.state == 'closed') {
        console.log('Event: Pull Request was closed ' + env.inProgressState)
        await handleClosedPr(workItemId)
      } else {
        console.log('Event: Branch was pushed ' + env.inProgressState)
        await handleOpenBranch(workItemId)
      }
    }
  }

  const setWorkItemState = async (workItemId: string, state: string) => {
    const authHandler = azureDevOpsHandler.getPersonalAccessTokenHandler(
      env.adoPAT
    )

    const connection = new azureDevOpsHandler.WebApi(
      `https://dev.azure.com/${env.adoOrganization}`,
      authHandler
    )

    const client = await connection.getWorkItemTrackingApi()

    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.State',
        value: state
      }
    ]

    await client.updateWorkItem(
      [],
      patchDocument,
      <number>(<unknown>workItemId),
      env.adoProject,
      false
    )
  }

  const handleMergedPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.closedState)
  }

  const handleOpenedPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.openState)
  }

  const handleClosedPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.inProgressState)
  }

  const handleOpenBranch = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.inProgressState)
  }

  return {
    getWorkItemIdsFromPullRequest,
    getWorkItemsFromText,
    getWorkItemIdFromBranchName,
    updateWorkItem
  }
}
