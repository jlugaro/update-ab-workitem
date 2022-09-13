import {actionEnvModel} from '../models/actionEnvModel'

export function useValidators(env: actionEnvModel) {
  const isPullRequestEvent = () => {
    return env.githubEventName?.toLowerCase() == 'pull_request'
  }

  const isBranchEvent = () => {
    return env.githubEventName?.toLowerCase() == 'push'
  }

  const isReviewEvent = () => {
    return env.githubEventName?.toLowerCase() == 'pull_request_review'
  }

  const isBotEvent = (pullRequest: any) => {
    return (
      pullRequest.title != null &&
      (pullRequest.title.includes('dependabot') ||
        pullRequest.title.includes('bot'))
    )
  }

  const isProtectedBranch = () => {
    return (
      env.currentBranchName.includes('master') ||
      env.currentBranchName.includes('main')
    )
  }

  return {
    isPullRequestEvent,
    isBranchEvent,
    isReviewEvent,
    isBotEvent,
    isProtectedBranch
  }
}
