import * as core from '@actions/core'
import {actionEnvModel} from './models/actionEnvModel'
import fetch from 'node-fetch'

export function useGithub() {
  const getRequestHeaders = (token: string) => {
    const h = new Headers()
    const auth = 'token ' + token
    h.append('Authorization', auth)
    return h
  }

  const getPullRequest = async (env: actionEnvModel): Promise<any> => {
    try {
      console.log('Getting pull request')

      const requestUrl = `https://api.github.com/repos/${env.repoOwner}/${env.repoName}/pulls/${env.pullRequestNumber}`

      console.log(`Pull Request URL: ${requestUrl}`)
      console.log(env.githubPAT)

      await fetch(requestUrl, {
        method: 'GET',
        headers: getRequestHeaders(env.githubPAT)
      }).then(response => {
        return response.json()
      })
    } catch (err: any) {
      core.setFailed(err.toString())
    }
  }

  return {
    getPullRequest
  }
}
