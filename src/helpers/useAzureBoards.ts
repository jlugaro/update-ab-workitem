import * as core from '@actions/core'
import * as azureDevOpsHandler from 'azure-devops-node-api'
import {WorkItem} from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
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

  const getWorkItemIdsFromContext = (context: any) => {
    const workItemIds = getWorkItemsFromText(
      context?.payload?.head_commit?.message
    )
    return workItemIds
  }

  const getApiClient = async () => {
    const authHandler = azureDevOpsHandler.getPersonalAccessTokenHandler(
      env.adoPAT
    )

    const connection = new azureDevOpsHandler.WebApi(
      `https://dev.azure.com/${env.adoOrganization}`,
      authHandler
    )

    return connection.getWorkItemTrackingApi()
  }

  const updateWorkItem = async (workItemId: string, pullRequest: any) => {
    console.log('Updating work item: ' + workItemId)

    const client = await getApiClient()

    const workItem: any = await client.getWorkItem(
      <number>(<unknown>workItemId)
    )

    if (workItem) {
      console.log('Work Item Type: ' + workItem.fields['System.WorkItemType'])

      // if (workItem.fields['System.State'] == env.closedMainState) {
      //   console.log('WorkItem is already closed and cannot be updated.')
      //   return
      // } else if (
      //   workItem.fields['System.State'] == env.openMainState &&
      //   pullRequest.status != '204'
      // ) {
      //   console.log(
      //     'WorkItem is already in a state of PR open, will not update.'
      //   )
      //   return
      // } else

      if (workItem.fields['System.WorkItemType'] == 'Product Backlog Item') {
        console.log(
          'Product backlog item is not going to be automatically updated - needs to be updated manually.'
        )
      } else {
        const targetBranch = pullRequest.base.ref
        console.log(`Target branch: ${targetBranch}`)

        if (pullRequest.status == '204') {
          console.log('Event: Pull Request was merged')
          await handleMergedPr(workItemId)
        } else if (
          //Development Branch
          targetBranch == 'development' &&
          pullRequest.state == 'open'
        ) {
          console.log(
            'Event: Pull Request was opened, moving to: ' + env.openDevState
          )
          await handleOpenedDevPr(workItemId)
        } else if (
          targetBranch == 'Pre-Release' &&
          pullRequest.state == 'push'
        ) {
          console.log(
            'Event: Pull Request was opened, moving to: ' + env.closedDevState
          )
          await handleClosedDevPr(workItemId)
        } else if (
          //Staging Branch
          targetBranch == 'Pre-Release' &&
          pullRequest.state == 'open'
        ) {
          console.log(
            'Event: Pull Request was opened, moving to: ' + env.openStagingState
          )
          await handleOpenedStagingPr(workItemId)
        } else if (
          targetBranch == 'Pre-Release' &&
          pullRequest.state == 'closed'
        ) {
          console.log(
            'Event: Pull Request was closed, moving to: ' +
              env.closedStagingState
          )
          await handleClosedStagingPr(workItemId)
        } else if (targetBranch == 'main' && pullRequest.state == 'closed') {
          console.log(
            'Event: Pull Request was opened, moving to: ' +
              env.closedStagingState
          )
          await handleClosedStagingPr(workItemId)
        } else if (
          //Main Branch
          targetBranch == 'main' &&
          pullRequest.state == 'open'
        ) {
          console.log(
            'Event: Pull Request was opened, moving to: ' + env.openMainState
          )
          await handleOpenedMainPr(workItemId)
        } else if (targetBranch == 'main' && pullRequest.state == 'push') {
          console.log(
            'Event: Pull Request was opened, moving to: ' + env.closedMainState
          )
          await handleClosedMainPr(workItemId)
        }
      }
    } else {
      console.log(`Work item not found for the provided id: ${workItemId}`)
    }
  }

  const updateWorkItemByPushEvent = async (
    workItemId: string,
    context: any
  ) => {
    console.log('Updating work item: ' + workItemId)

    const client = await getApiClient()

    const workItem: any = await client.getWorkItem(
      <number>(<unknown>workItemId)
    )

    if (workItem) {
      console.log('Work Item Type: ' + workItem.fields['System.WorkItemType'])

      // if (workItem.fields['System.State'] == env.closedMainState) {
      //   console.log('WorkItem is already closed and cannot be updated.')
      //   return
      // } else if (
      //   workItem.fields['System.State'] == env.openMainState &&
      //   pullRequest.status != '204'
      // ) {
      //   console.log(
      //     'WorkItem is already in a state of PR open, will not update.'
      //   )
      //   return
      // } else

      if (context.ref.includes('main')) {
        console.log('Updating by context: main')
        handleClosedMainPr(workItemId)
      } else if (context.ref.includes('pre-release')) {
        console.log('Updating by context: pre-release')
        handleClosedStagingPr(workItemId)
      }
    } else {
      console.log(`Work item not found for the provided id: ${workItemId}`)
    }
  }

  const setWorkItemState = async (workItemId: string, state: string) => {
    const client = await getApiClient()

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
    await setWorkItemState(workItemId, env.closedMainState)
  }

  const handleOpenedDevPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.openDevState)
  }

  const handleClosedDevPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.inProgressState)
  }

  const handleOpenedStagingPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.openStagingState)
  }

  const handleClosedStagingPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.closedStagingState)
  }

  const handleOpenedMainPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.openMainState)
  }

  const handleClosedMainPr = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.closedMainState)
  }

  const handleOpenBranch = async (workItemId: string) => {
    await setWorkItemState(workItemId, env.inProgressState)
  }

  return {
    getWorkItemIdsFromPullRequest,
    getWorkItemsFromText,
    getWorkItemIdFromBranchName,
    getWorkItemIdsFromContext,
    updateWorkItemByPushEvent,
    updateWorkItem
  }
}
