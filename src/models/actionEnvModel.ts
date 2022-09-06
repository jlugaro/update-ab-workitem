export class actionEnvModel {
  action: string
  githubPAT: string
  adoPAT: string
  adoProject: string
  adoOrganization: string
  adoOrganizationUrl: string
  repoOwner: string
  repoName: string
  pullRequestNumber: string
  branchName: string
  closedState: string
  openState: string
  inProgressState: string

  constructor(
    action: string | undefined,
    githubPAT: string | undefined,
    adoPAT: string | undefined,
    adoProject: string | undefined,
    adoOrganization: string | undefined,
    adoOrganizationUrl: string | undefined,
    repoOwner: string | undefined,
    repoName: string | undefined,
    pullRequestNumber: string | undefined,
    branchName: string | undefined,
    closedState: string | undefined,
    openState: string | undefined,
    inProgressState: string | undefined
  ) {
    this.action = action ?? ''
    this.githubPAT = githubPAT ?? ''
    this.adoPAT = adoPAT ?? ''
    this.adoProject = adoProject ?? ''
    this.adoOrganization = adoOrganization ?? ''
    this.adoOrganizationUrl = adoOrganizationUrl ?? ''
    this.repoOwner = repoOwner ?? ''
    this.repoName = repoName ?? ''
    this.pullRequestNumber = pullRequestNumber ?? ''
    this.branchName = branchName ?? ''
    this.closedState = closedState ?? ''
    this.openState = openState ?? ''
    this.inProgressState = inProgressState ?? ''
  }
}
