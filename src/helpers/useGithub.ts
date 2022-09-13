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

  const getCommits = async (pullRequest: any): Promise<any> => {
    if (pullRequest.commits_url) {
      return fetch(pullRequest.commits_url, {
        method: 'GET',
        headers: getRequestHeaders(env.githubPAT)
      })
    }
  }

  const getPullRequest = async (): Promise<any> => {
    try {
      console.log('Getting pull request')

      let prNumber = env.pullRequestNumber

      if (!prNumber) {
        if (context.payload.pull_request) {
          prNumber = context.payload.pull_request.number
        }
      }

      console.log(`PR number: ${prNumber}`)

      const requestUrl = `https://api.github.com/repos/${env.repoOwner}/${env.repoName}/pulls/${prNumber}`

      console.log(`Pull Request URL: ${requestUrl}`)

      const res = await fetch(requestUrl, {
        method: 'GET',
        headers: getRequestHeaders(env.githubPAT)
      })

      let pr: any = await res.json()
      pr.commits = await getCommits(pr)
    } catch (err: any) {
      core.setFailed(err.toString())
    }
  }

  return {
    getPullRequest
  }
}
