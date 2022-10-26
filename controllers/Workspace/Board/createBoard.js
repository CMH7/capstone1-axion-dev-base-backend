const { log, newNotification } = require("../../../constants");
const { user, userFinal, manyUserFinal } = require("../../user");
const { getAllMembers } = require("../Member");

module.exports = {
  addBoard: async (req, pusher) => {
    log('-------------------------------')
    log('Adding a board')
    const ids = req.body.ids
    const board = req.body.board
    let membersID = []
    let workspaceMembers = []

    log('Getting user data')
    const userA = await user(ids.user)
    log(`Getting user ${userA.firstName} ${userA.lastName} data done`)

		const boardToSend = {
			tasks: [],
			color: board.color,
			createdBy: board.createdBy,
			createdOn: new Date().toISOString(),
			id: board.id,
			name: board.name,
    };

		userA.subjects.every((subject) => {
			if (subject.id === ids.subject) {
				subject.workspaces.every((workspace) => {
          if (workspace.id === ids.workspace) {
            log('Checking workspace member/s')
            let temp = workspace.members.filter(member => member.id !== userA.id)

            if (temp.length != 0) {
              log('Workspace member/s detected')
              temp.forEach(member => {
                membersID = [...membersID, member.id]
              })
            } else {
              log('No workspace member/s detected')
            }

            log('Inserting new board')
            workspace.boards.every((boarda, i) => {
              if (boarda.name.toLowerCase() === 'done') {
                workspace.boards.splice(i, 0, boardToSend)
                log('Board inserted')
                return false
              }
              return true
            })
            return false
          }
          return true
        });
        return false
      }
      return true
    });
    
    if (membersID.length != 0) {
      log('Getting workspace member/s data')
      workspaceMembers = await getAllMembers(membersID)

      if (workspaceMembers.length != 0) {
        let workspaceName = ''
        log('Getting workspace member/s data done')

        log("Building user-notification");
				const newNotif = newNotification(
					`${userA.firstName} ${userA.lastName} added new board/status \'${boardToSend.name}\' in \'${workspaceName}\'`,
					false,
					false,
					"",
					"Dashboard",
					"Boards",
					"",
					true,
					userA.id
				);
				log("Building user-notification done");

        log('Updating data')
        workspaceMembers.forEach(member => {
          log('===')
          log(`Updating: ${member.firstName} ${member.lastName}`)
          log('Adding notification for userA')
          member.notifications.unshift(newNotif)
          log('Adding notification for userA done')

          member.subjects.every((subject) => {
						if (subject.id === ids.subject) {
							subject.workspaces.every((workspace) => {
                if (workspace.id === ids.workspace) {
                  workspaceName = workspace.name
									log("Inserting new board");
									workspace.boards.every((boarda, i) => {
										if (boarda.name.toLowerCase() === "done") {
											workspace.boards.splice(i, 0, boardToSend);
											log("Board inserted");
											return false;
										}
										return true;
									});
									return false;
								}
								return true;
							});
							return false;
						}
						return true;
          });
          log("===");
        })

        log('Finalizing updates to all workspace member/s')
        const useraa = await manyUserFinal([userA, ...workspaceMembers])
        useraa.forEach(member => {
          log(`${member.firstName} ${member.lastName}`)
        })
        log('Finalizing updates to all workspace member/s done')

        log('Realtime updating and notifying workspace users')
        pusher.trigger(membersID, 'newBoard', {
          ids,
          notification: newNotif,
          board: boardToSend
        })
        log('Realtime updating and notifying workspace users done')
        
      } else {
        log('Error in getting all workspace members data')
        log('Continuing to Finalizing updates for userA only')
        await userFinal(userA);
				log("Finalizing update for userA done");
      }
    } else {
      log('Finalizing update for userA')
      await userFinal(userA);
      log('Finalizing update for userA done')
    }

		log("Adding a board done");
    log("-------------------------------");

    return boardToSend
  }
}