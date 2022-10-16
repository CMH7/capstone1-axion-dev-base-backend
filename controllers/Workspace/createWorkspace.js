const { board } = require("../Board")

module.exports = {
  createWorkspace: (req, user) => {
    const workspaceToSend = {
      boards: [
        board("grey", req.body.workspace.board.createdBy, req.body.workspace.board.createdOn, req.body.ids.todo, "Todo"),
        board("info", req.body.workspace.board.createdBy, req.body.workspace.board.createdOn, req.body.ids.inprog, "In progress"),
        board("success", req.body.workspace.board.createdBy, req.body.workspace.board.createdOn, req.body.ids.done, "Done"),
			],
			members: [
				{
					email: user.email,
					name: `${user.firstName} ${user.lastName}`,
					profile: user.profile,
					id: user.id
				},
			],
			admins: [{
				email: user.email,
				name: `${user.firstName} ${user.lastName}`,
				id: user.id
			}],
			color: req.body.workspace.color,
			id: req.body.ids.workspace,
			isFavorite: false,
			name: req.body.workspace.name,
			owned: true,
			createdBy: req.body.workspace.createdBy,
    }
    
    user.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.unshift(workspaceToSend);
				return false
			}
			return true
    })
    
    return {
      user,
      workspaceToSend
    }
  }
}