import * as core from '@actions/core'
import * as azureDevOpsHandler from 'azure-devops-node-api'
import {WorkItem} from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces'
import {actionEnvModel} from '../models/actionEnvModel'

export function useAzureBoards(env: actionEnvModel, context: any) {
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

      if (foundMatches) {
        console.log('Found matches on branch name ' + foundMatches)

        const workItemId = foundMatches && foundMatches[4]

        console.log('Work item ID: ' + workItemId)

        return workItemId
      } else {
        console.log(
          'Did not found any Ids in the branch name, let`s continue...'
        )
      }
    } catch (err) {
      core.setFailed(
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
    console.log('Updating work item: ' + workItemId)

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
          switch (env.action) {
            case 'opened':
            case 'edited':
              console.log(
                `Moving work item ${workItemId} to ${env.inReviewState}`
              )
              await setWorkItemState(workItemId, env.inReviewState)
              break
            case 'closed':
              switch (targetBranch) {
                case env.devBranchName:
                case env.stagingBranchName:
                case env.mainBranchName:
                  console.log(
                    `Moving work item ${workItemId} to ${env.mergedState}`
                  )
                  await setWorkItemState(workItemId, env.mergedState)
                  break
                default:
                  //do nothin
                  break
              }
              break
            default:
              break
          }
          break
        case 'pull_request_review':
          console.log('updateWorkItem: Is pull_request_review')
          console.log(`pr review action: ${env.action}`)
          switch (env.action) {
            case 'submitted':
            case 'edited':
              console.log(
                `Moving work item ${workItemId} to ${env.inProgressState}`
              )
              await setWorkItemState(workItemId, env.inProgressState)
              break
            case 'closed':
              //await setWorkItemState(workItemId, env.inReviewState)
              break
            default:
              break
          }
          break
        case 'push':
          console.log(
            `pushed to ${env.currentBranchName}. action: ${env.githubEventName}`
          )
          switch (env.currentBranchName) {
            case env.devBranchName:
              if (
                await updateIfAlreadyHasPullRequest(
                  workItemId,
                  env.inReviewState
                )
              ) {
                break
              }

              console.log(
                `Moving work item ${workItemId} to ${env.inProgressState}`
              )
              await setWorkItemState(workItemId, env.inProgressState)
              break
            case env.stagingBranchName:
              if (
                await updateIfAlreadyHasPullRequest(workItemId, env.mergedState)
              ) {
                break
              }
              console.log(
                `Moving work item ${workItemId} to ${env.stagingState}`
              )
              await setWorkItemState(workItemId, env.stagingState)
              break
            case env.mainBranchName:
              if (
                await updateIfAlreadyHasPullRequest(workItemId, env.mergedState)
              ) {
                break
              }
              console.log(
                `Moving work item ${workItemId} to ${env.closedState}`
              )
              await setWorkItemState(workItemId, env.closedState)
              break
            default:
              //do nothin
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

  const updateIfAlreadyHasPullRequest = async (
    workItemId: string,
    state: string
  ): Promise<boolean> => {
    const headCommitMessage = context.payload?.head_commit?.message
    if (headCommitMessage) {
      if (headCommitMessage.includes('pull request')) {
        console.log(`Moving work item ${workItemId} to ${state}`)
        await setWorkItemState(workItemId, state)
        return true
      }
    }
    return false
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

  // const handleMergedPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.closedMainState)
  // }

  // const handleOpenedDevPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.openDevState)
  // }

  // const handleClosedDevPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.inProgressState)
  // }

  // const handleOpenedStagingPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.openStagingState)
  // }

  // const handleClosedStagingPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.closedStagingState)
  // }

  // const handleOpenedMainPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.openMainState)
  // }

  // const handleClosedMainPr = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.closedMainState)
  // }

  // const handleOpenBranch = async (workItemId: string) => {
  //   await setWorkItemState(workItemId, env.inProgressState)
  // }

  return {
    getWorkItemIdsFromPullRequest,
    getWorkItemIdsFromCommits,
    getWorkItemsFromText,
    getWorkItemIdFromBranchName,
    getWorkItemIdsFromContext,
    updateWorkItem
  }
}
