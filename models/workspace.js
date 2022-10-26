const { board } = require("./board")
const { workspaceAdmins } = require("./workspaceAdmin")
const { workspaceMember } = require("./workspaceMember")

module.exports = {
  workspace: {
    members: [workspaceMember],
    boards: [board],
    admins: [workspaceAdmins],
    color: '',
    id: '',
    isFavorite: false,
    name: '',
    owned: true,
    createdBy: ''
  }
}