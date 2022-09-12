import {actionEnvModel} from '../models/actionEnvModel'

export function useValidators(env: actionEnvModel) {
  const isPullRequestEvent = () => {
    return env.githubEventName?.includes('pull_request')
  }

  const isBranchEvent = () => {
    return env.githubEventName?.includes('push')
  }

  const isReviewEvent = () => {
    return env.githubEventName?.includes('pull_request_review')
  }

  const isBotEvent = (pullRequest: any) => {
    return (
      pullRequest.title != null &&
      (pullRequest.title.includes('dependabot') ||
        pullRequest.title.includes('bot'))
    )
  }

  const isProtectedBranch = () => {
    return env.branchName.includes('master') || env.branchName.includes('main')
  }

  return {
    isPullRequestEvent,
    isBranchEvent,
    isReviewEvent,
    isBotEvent,
    isProtectedBranch
  }
}
