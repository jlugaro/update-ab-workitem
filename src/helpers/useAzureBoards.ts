import * as azureDevOpsHandler from 'azure-devops-node-api'
import { configurationModel } from '../models/configurationModel'

export function useAzureBoards(env: configurationModel, context: any) {
  const getWorkItemsFromText = (text: string) => {
    try {
      const idList: string[] = []
      const matches = text.match(/AB#[(0-9)]*/g)

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
      console.log('Wrong format. Make sure it includes AB#<ticket_number>')
    }
  }

  const getWorkItemIdFromBranchName = (branchName: string) => {
    try {
      const match: RegExpMatchArray | null = branchName.match(/AB#[(0-9)]*/g)

      if (match) {
        const id = match[0].replace(/[AB#]*/g, '')

        console.log('Found match on branch name: ' + branchName)

        console.log('Work item ID: ' + id)

        return id
      } else {
        console.log(
          'Did not found any Ids in the branch name, let`s continue...'
        )
      }
    } catch (err) {
      console.log(
        'Branch name format is wrong. Make sure it starts from AB#<ticket_number>'
      )
    }
  }

  const getWorkItemIdsFromPullRequest = (pullRequest: any, commits: any[]) => {
    let workItemIds = getWorkItemsFromText(pullRequest.title) ?? []

    if (workItemIds.length == 0) {
      workItemIds = getWorkItemsFromText(pullRequest.body) ?? []
    }

    const workItemsFromCommit = getWorkItemIdsFromCommits(commits) ?? []
    console.log(`workItemsFromCommit: ${workItemsFromCommit}`)
    console.log(`workItemsIds: ${workItemIds}`)

    workItemIds = workItemIds.concat(workItemsFromCommit)

    workItemIds = workItemIds.reduce((distinct: string[], id: string) => {
      if (!distinct.includes(id)) {
        distinct.push(id)
      }
      return distinct
    }, [])

    console.log(`reduced workitemsIds: ${workItemIds}`)

    return workItemIds
  }

  const getWorkItemIdsFromContext = (context: any) => {
    const workItemIds = getWorkItemsFromText(
      context?.payload?.head_commit?.message
    )
    return workItemIds
  }

  const getWorkItemIdsFromCommits = (commits: any[]) => {
    let workItemIds: string[] = []
    if (commits != null && commits.length) {
      commits.forEach((item: any) => {
        let ids: string[] = []
        if (item.commit) {
          ids = getWorkItemsFromText(item.commit.message) ?? []
        } else {
          ids = getWorkItemsFromText(item.message) ?? []
        }
        workItemIds = workItemIds.concat(ids)
      })
    }
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
    const client = await getApiClient()

    const workItem: any = await client.getWorkItem(
      <number>(<unknown>workItemId)
    )

    if (workItem) {
      const targetBranch = pullRequest ? pullRequest.base?.ref : null

      switch (env.githubEventName) {
        case 'pull_request':
          console.log(`updateWorkItem: pull_request into ${targetBranch}`)
          console.log(`action: ${env.action}`)
          
          if (canMoveOnPullRequest(workItem)) {
            console.log(`Updating work item AB#${workItemId} 's state to ${env.onPullRequestEvent}.`)
            await setWorkItemState(workItemId, env.onPullRequestEvent)
            return;
          }

          switch (env.action) {
            case 'opened':
            case 'edited':
              if (targetBranch == env.devBranchName && canMoveToInReview(workItem)) {
                console.log(
                  `Development Workflow: Moving work item ${workItemId} to ${env.inReviewState}`
                )
                await setWorkItemState(workItemId, env.inReviewState)
              }
              break

            case 'closed':
              if (context.payload.pull_request.merged == true) {
                switch (targetBranch) {
                  case env.devBranchName:
                    if (canMoveToMerged(workItem)) {
                      console.log(
                        `Development Workflow: Moving work item ${workItemId} to ${env.mergedState}`
                      )
                      await setWorkItemState(workItemId, env.mergedState)
                    }
                    break
                  case env.stagingBranchName:
                    if (canMoveToStaging(workItem)) {
                      console.log(
                        `Moving work item ${workItemId} to ${env.stagingState}`
                      )
                      await setWorkItemState(workItemId, env.stagingState)

                      if (workItem.fields['System.CreatedBy']) {
                        await setWorkItemAssignedTo(
                          workItemId,
                          workItem.fields['System.CreatedBy']
                        )
                      }
                    }
                    break
                  case env.mainBranchName:
                    break
                  default:
                    break
                }
              }
              break
            default:
              break
          }
          break
        case 'pull_request_review':
          if (canMoveOnPullRequest(workItem)) {
            console.log(`Updating work item AB#${workItemId} 's state to ${env.onPullRequestEvent}.`)
            await setWorkItemState(workItemId, env.onPullRequestEvent)
            return;
          }

          switch (env.action) {
            case 'submitted':
            case 'edited':
              //Any action regarding pull request reviews goes here...
              break
            default:
              break
          }
          break
        case 'push':
          if (canMoveOnPush(workItem)) {
            console.log(`Updating work item AB#${workItemId} 's state to ${env.onPushEvent}.`)
            await setWorkItemState(workItemId, env.onPushEvent)
            return;
          }

          switch (env.currentBranchName) {
            case env.devBranchName:
              if (canMoveToInProgress(workItem)) {
                console.log(
                  `Moving work item ${workItemId} to ${env.inProgressState}`
                )
                await setWorkItemState(workItemId, env.inProgressState)
              }
              break
            case env.stagingBranchName:
              if (canMoveToStaging(workItem)) {
                console.log(
                  `Moving work item ${workItemId} to ${env.stagingState}`
                )
                await setWorkItemState(workItemId, env.stagingState)

                if (workItem.fields['System.CreatedBy']) {
                  await setWorkItemAssignedTo(
                    workItemId,
                    workItem.fields['System.CreatedBy']
                  )
                }
              }
              break
            case env.mainBranchName:
              if (canMoveToClosed(workItem)) {
                console.log(
                  `Moving work item ${workItemId} to ${env.closedState}`
                )
                await setWorkItemState(workItemId, env.closedState)
              }
              break
            default:
              break
          }
          break
        default:
          break
      }
    } else {
      console.log(`Work item not found for the provided id: ${workItemId}`)
    }
  }

  const canMoveOnPush = (workItem: any): boolean => {
    const currentState = workItem.fields['System.State'];
    return currentState != env.onPullRequestEvent && !!env.onPushEvent;
  }

  const canMoveOnPullRequest = (workItem:any): boolean => {
    const currentState = workItem.fields['System.State'];
    return currentState != env.onPullRequestEvent && !!env.onPullRequestEvent;
  }

  const canMoveToInProgress = (workItem: any) => {
    return workItem.fields['System.State'] != env.inProgressState &&
      workItem.fields['System.State'] != env.inReviewState &&
      workItem.fields['System.State'] != env.mergedState &&
      workItem.fields['System.State'] != env.stagingState &&
      workItem.fields['System.State'] != env.approvedState &&
      workItem.fields['System.State'] != env.rejectedState &&
      workItem.fields['System.State'] != env.closedState
  }

  const canMoveToInReview = (workItem: any) => {
    return workItem.fields['System.State'] == env.inProgressState
  }

  const canMoveToMerged = (workItem: any) => {
    return workItem.fields['System.State'] == env.inReviewState
  }

  const canMoveToStaging = (workItem: any) => {
    return workItem.fields['System.State'] == env.mergedState
  }

  const canMoveToClosed = (workItem: any) => {
    return workItem.fields['System.State'] == env.stagingState ||
      workItem.fields['System.State'] == env.approvedState ||
      workItem.fields['System.State'] == env.rejectedState
  }

  const setWorkItemState = async (workItemId: string, state: string) => {
    console.log('Updating work item: ' + workItemId)
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

  const setWorkItemAssignedTo = async (
    workItemId: string,
    assignedTo: string
  ) => {

    console.log(`reassigning workitem id ${workItemId} to ${assignedTo}`)
    const client = await getApiClient()

    const patchDocument = [
      {
        op: 'add',
        path: '/fields/System.AssignedTo',
        value: assignedTo
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

  return {
    getWorkItemIdsFromPullRequest,
    getWorkItemIdsFromCommits,
    getWorkItemsFromText,
    getWorkItemIdFromBranchName,
    getWorkItemIdsFromContext,
    updateWorkItem
  }
}
