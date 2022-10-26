const { board } = require("./board")
const { conversation } = require("./conversation")
const { notification } = require("./notification")
const { subject } = require("./subject")
const { subtask } = require("./subtask")
const { task } = require("./task")
const { account } = require("./user")
const { workspace } = require("./workspace")
const { workspaceAdmin } = require("./workspaceAdmin")
const { workspaceMember } = require("./workspaceMember")

module.exports = {
  account,
  notification,
  subject,
  workspace,
  board,
  workspaceAdmin,
  workspaceMember,
  task,
  subtask,
  conversation
}