const { log } = require("../../../constants")
const { user, manyUserFinal, userFinal } = require("../../user")
const { getAllMembers } = require("../../Workspace/Member")

module.exports = {
  /** Send a chat to the task and notify it to all members*/
  sendChat: async (req, pusher) => {
    log('----------------------------------')
    log('Sending a chat')

    const ids = req.body.ids
    let membersID = []
    let workspaceMembers = []

    log('Getting user data')
    const userA = await user(ids.user)
    log(`${userA.firstName} ${userA.lastName}'s data is fetched`)

    userA.subjects.every(subject => {
      if (subject.id === ids.subject) {
        subject.workspaces.every(workspace => {
          if (workspace.id === ids.workspace) {
            log("Checking for workspace members")
            let temp = workspace.members.filter(member => member.id !== userA.id)
            if (temp.length != 0) {
              log('Workspace member/s detected')
              temp.forEach(member => {
                membersID = [...membersID, member.id]
              })
            } else {
              log('No detected workspace member/s')
            }

            log('Partial sending of chat')
            workspace.boards.every(board => {
              if (board.id === ids.board) {
                board.tasks.every(task => {
                  if (task.id === ids.task) {
                    task.conversations.push(req.body.chat)
                    return false
                  }
                  return true
                })
                return false
              }
              return true
            })
            log('Partial sending of chat done')
            return false
          }
          return true
        })
        return false
      }
      return true
    })

    if (membersID.length != 0) {
      log('Getting workspace member/s data')
      workspaceMembers = await getAllMembers(membersID)
      workspaceMembers.forEach(member => {
        log(`${member.firstName} ${member.lastName}`)
      })
      log('Getting workspace member/s data done')
    }

    if (workspaceMembers.length != 0) {
      log('Sending chat to all workspace member/s')
      workspaceMembers.forEach(member => {
        log(`Sending chat to: ${member.firstName} ${member.lastName}`);
        member.subjects.every((subject) => {
					if (subject.id === ids.subject) {
						subject.workspaces.every((workspace) => {
							if (workspace.id === ids.workspace) {
								workspace.boards.every((board) => {
									if (board.id === ids.board) {
										board.tasks.every((task) => {
											if (task.id === ids.task) {
												task.conversations.push(req.body.chat);
												return false;
											}
											return true;
										})
										return false;
									}
									return true;
								})
								return false;
							}
							return true;
						})
						return false;
					}
					return true;
				});
      })
      log('Sending chat to all workspace member/s done')
    }

    log('Finalizing updates')
    if (workspaceMembers.length != 0) {
      log('Finalizing updates to all workspace member/s: send chat')
      let users = await manyUserFinal([userA, ...workspaceMembers])
      users.forEach(useraa => {
        log(`${useraa.firstName} ${useraa.lastName}`)
      })
    } else {
      log('Finalizing update to the userA')
      await userFinal(userA)
    }
    log('Finalization updates done')

    if (workspaceMembers.length != 0) {
      log('Realtime updating of other member/s')
      pusher.trigger([...membersID], 'newChat', {
        subjectID: ids.subject,
        workspaceID: ids.workspace,
        boardID: ids.board,
        task: ids.task,
        conversation: req.body.chat
      })
      log('Realtime updating of other member/s done')
    }

		log("Chat sent!");
    log("----------------------------------");
    
    return req.body.chat
  }
}