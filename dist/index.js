import './sourcemap-register.cjs';/******/ "use strict";
/******/ /* webpack/runtime/compat */
/******/ 
/******/ if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = new URL('.', import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/) ? 1 : 0, -1) + "/";
/******/ 
/************************************************************************/
var __webpack_exports__ = {};

var __createBinding = (undefined && undefined.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (undefined && undefined.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (undefined && undefined.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const fetch = __importStar(require("node-fetch"));
const github = __importStar(require("@actions/github"));
const useGithub_1 = require("./useGithub");
const useAzureBoards_1 = require("./useAzureBoards");
const actionEnvModel_1 = require("./models/actionEnvModel");
const version = '1.0.0';
global.Headers = fetch.Headers;
function run() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('VERSION ' + version);
            const vm = getValuesFromPayload(github.context.payload);
            const { getPullRequest } = (0, useGithub_1.useGithub)();
            const pullRequest = yield getPullRequest(vm);
            console.log(console.log(`Pull Request object: ${pullRequest}`));
            const { getWorkItemsFromText, getWorkItemIdFromBranchName, updateWorkItem } = (0, useAzureBoards_1.useAzureBoards)(vm);
            if ((_b = (_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.GITHUB_EVENT_NAME) === null || _b === void 0 ? void 0 : _b.includes('pull_request')) {
                console.log('PR event');
                if (typeof pullRequest.title != 'undefined' &&
                    pullRequest.title.includes('bot')) {
                    console.log('Bot branches are not to be processed');
                    return;
                }
                try {
                    let workItemIds = getWorkItemsFromText(pullRequest.title);
                    if (workItemIds == null || workItemIds.length == 0) {
                        workItemIds = getWorkItemsFromText(pullRequest.body);
                    }
                    if (workItemIds != null && workItemIds.length > 0) {
                        workItemIds.forEach((workItemId) => __awaiter(this, void 0, void 0, function* () {
                            console.log(`Update work item: ${workItemId}`);
                            yield updateWorkItem(workItemId, pullRequest);
                        }));
                    }
                    else {
                        console.log(`No work items found to update.`);
                    }
                }
                catch (err) {
                    core.setFailed('Wrong PR title format. Make sure it includes AB#<ticket_number>.');
                    core.setFailed(err.toString());
                }
            }
            else {
                console.log('Branch event');
                if (vm.branchName.includes('master') || vm.branchName.includes('main')) {
                    console.log('Automation will not handle commits pushed to master');
                    return;
                }
                var workItemId = getWorkItemIdFromBranchName(vm.branchName);
                if (workItemId != null) {
                    yield updateWorkItem(workItemId, pullRequest);
                }
            }
            console.log('Work item ' + workItemId + ' was updated successfully');
        }
        catch (err) {
            core.setFailed(err.toString());
        }
    });
}
function getValuesFromPayload(payload) {
    return new actionEnvModel_1.actionEnvModel(payload.action, process.env.gh_token, process.env.ado_token, process.env.ado_project, process.env.ado_organization, `https://dev.azure.com/${process.env.ado_organization}`, process.env.ghrepo_owner, process.env.ghrepo, process.env.pull_number, process.env.branch_name, process.env.closedstate, process.env.propenstate, process.env.inprogressstate);
}
run();


//# sourceMappingURL=index.js.map