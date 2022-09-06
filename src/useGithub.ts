import * as core from '@actions/core'

export async function useGithub(env: actionEnvModel): Promise<any> {
  let pullRequest: any = null

  const getRequestHeaders = () => {
    let h = new Headers()
    let auth = 'token ' + env.githubPAT
    h.append('Authorization', auth)
    return h
  }

  const init = async () => {
    try {
      console.log('Getting pull request')

      const requestUrl = `https://api.github.com/repos/${env.repoOwner}/${env.repoName}/pulls/${env.pullRequestNumber}`

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: getRequestHeaders()
      })

      pullRequest = await response.json()
    } catch (err: any) {
      core.setFailed(err.toString())
    }
  }

  init()

  return {
    pullRequest
  }
}
