import {actionEnvModel} from '../models/actionEnvModel'

export function useValidators(env: actionEnvModel) {
  const isPullRequest = () => {
    return env.githubEventName?.includes('pull_request')
  }

  const isBranchEvent = () => {
    return env.githubEventName?.includes('push')
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
    isPullRequest,
    isBranchEvent,
    isBotEvent,
    isProtectedBranch
  }
}
