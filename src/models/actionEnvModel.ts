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
  devBranchName: string
  stagingBranchName: string
  mainBranchName: string
  inProgressState: string
  openDevState: string
  closedDevState: string
  openStagingState: string
  closedStagingState: string
  openMainState: string
  closedMainState: string

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
    devBranchName: string | undefined,
    stagingBranchName: string | undefined,
    mainBranchName: string | undefined,
    inProgressState: string | undefined,
    openDevState: string | undefined,
    closedDevState: string | undefined,
    openStagingState: string | undefined,
    closedStagingState: string | undefined,
    openMainState: string | undefined,
    closedMainState: string | undefined
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
    this.devBranchName = devBranchName ?? ''
    this.stagingBranchName = stagingBranchName ?? ''
    this.mainBranchName = mainBranchName ?? ''
    this.inProgressState = inProgressState ?? ''
    this.openDevState = openDevState ?? ''
    this.closedDevState = closedDevState ?? ''
    this.openStagingState = openStagingState ?? ''
    this.closedStagingState = closedStagingState ?? ''
    this.openMainState = openMainState ?? ''
    this.closedMainState = closedMainState ?? ''
  }
}
