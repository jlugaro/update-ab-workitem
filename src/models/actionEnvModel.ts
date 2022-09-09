export class actionEnvModel {
  action: string
  githubEventName: string
  githubPAT: string
  adoPAT: string
  adoProject: string
  adoOrganization: string
  adoOrganizationUrl: string
  repoOwner: string
  repoName: string
  pullRequestNumber: string
  branchName: string
  openState: string
  openDevState: string
  inProgressState: string
  closedState: string

  constructor(
    action: string | undefined,
    githubEventName: string | undefined,
    githubPAT: string | undefined,
    adoPAT: string | undefined,
    adoProject: string | undefined,
    adoOrganization: string | undefined,
    adoOrganizationUrl: string | undefined,
    repoOwner: string | undefined,
    repoName: string | undefined,
    pullRequestNumber: string | undefined,
    branchName: string | undefined,
    openState: string | undefined,
    openDevState: string | undefined,
    inProgressState: string | undefined,
    closedState: string | undefined
  ) {
    this.action = action ?? ''
    this.githubEventName = githubEventName ?? ''
    this.githubPAT = githubPAT ?? ''
    this.adoPAT = adoPAT ?? ''
    this.adoProject = adoProject ?? ''
    this.adoOrganization = adoOrganization ?? ''
    this.adoOrganizationUrl = adoOrganizationUrl ?? ''
    this.repoOwner = repoOwner ?? ''
    this.repoName = repoName ?? ''
    this.pullRequestNumber = pullRequestNumber ?? ''
    this.branchName = branchName ?? ''
    this.openState = openState ?? ''
    this.openDevState = openDevState ?? ''
    this.inProgressState = inProgressState ?? ''
    this.closedState = closedState ?? ''
  }
}
