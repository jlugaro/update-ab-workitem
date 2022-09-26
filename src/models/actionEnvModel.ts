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
  currentBranchName: string
  devBranchName: string
  stagingBranchName: string
  mainBranchName: string
  inProgressState: string
  inReviewState: string
  mergedState: string
  stagingState: string
  approvedState: string
  rejectedState: string
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
    currentBranchName: string | undefined,
    devBranchName: string | undefined,
    stagingBranchName: string | undefined,
    mainBranchName: string | undefined,
    inProgressState: string | undefined,
    inReviewState: string | undefined,
    mergedState: string | undefined,
    stagingState: string | undefined,
    approvedState: string | undefined,
    rejectedState: string | undefined,
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
    this.currentBranchName = currentBranchName ?? ''
    this.devBranchName = devBranchName ?? ''
    this.stagingBranchName = stagingBranchName ?? ''
    this.mainBranchName = mainBranchName ?? ''
    this.inProgressState = inProgressState ?? ''
    this.inReviewState = inReviewState ?? ''
    this.mergedState = mergedState ?? ''
    this.stagingState = stagingState ?? ''
    this.approvedState = approvedState ?? ''
    this.rejectedState = rejectedState ?? ''
    this.closedState = closedState ?? ''
  }
}
