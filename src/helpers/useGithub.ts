import * as core from '@actions/core'
import {actionEnvModel} from '../models/actionEnvModel'
import fetch from 'node-fetch'

export function useGithub(env: actionEnvModel, context: any) {
  const getRequestHeaders = (token: string) => {
    const h = new Headers()
    const auth = 'token ' + token
    h.append('Authorization', auth)
    return h
  }

  const getPullRequest = async (): Promise<any> => {
    try {
      console.log('Getting pull request')

      console.log(`env.pullRequestNumber: ${env.pullRequestNumber}`)

      let prNumber = env.pullRequestNumber

      if (prNumber == null) {
        if (context.payload.pull_request) {
          prNumber = context.payload.pull_request.number
        }
      }

      console.log(`prNumber: ${prNumber}`)

      const requestUrl = `https://api.github.com/repos/${env.repoOwner}/${env.repoName}/pulls/${prNumber}`

      console.log(`Pull Request URL: ${requestUrl}`)

      const res = await fetch(requestUrl, {
        method: 'GET',
        headers: getRequestHeaders(env.githubPAT)
      })

      return res.json()
    } catch (err: any) {
      core.setFailed(err.toString())
    }
  }

  return {
    getPullRequest
  }
}
