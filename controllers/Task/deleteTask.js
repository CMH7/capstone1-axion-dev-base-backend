const { log, newNotification } = require("../../constants")
const { user, userFinal, manyUserFinal } = require("../user")
const { getAllMembers } = require("../Workspace/Member")

module.exports = {
  deleteTask: async (req, pusher) => {
    log('----------------------------------')
    log('DELETING TASK')
    const ids = req.body.ids
    let membersID = []
    let workspaceMembers = []
    let userAName = ''
    let taskName = ''
    let workspaceName = ''
    
    log('Getting user data')
    const userA = await user(ids.user)
    userAName = `${userA.firstName} ${userA.lastName}`
    log(`Getting user ${userAName} data done`)

    if (userA.verified) {
      log('User is verified')
      log('Checking for workspace members')
      userA.subjects.every(subject => {
        if (subject.id === ids.subject) {
          subject.workspaces.every(workspace => {
            if (workspace.id === ids.workspace) {
              workspaceName = workspace.name
              workspace.boards.every(board => {
                if (board.id === ids.board) {
                  board.tasks.every((task) => {
										if (task.id === ids.task) {
											taskName = task.name;
											return false;
										}
										return true;
									});
                  return false
                }
                return true
              })

              let temp = workspace.members.filter(member => member.id !== ids.user)

              if (temp.length > 0) {
                log('Workspace member/s detected')
                temp.forEach(member => {
                  membersID = [...membersID, member.id]
                })
              } else {
                log('No workspace member/s detected')
              }
              return false
            }
            return true
          })
          return false
        }
        return true
      })

      if (membersID.length > 0) {
        log('Getting workspace member/s data')
        workspaceMembers = await getAllMembers(membersID)
        log('Getting workspace member/s data done')

        log("Building user-notification");
				const newNotif = newNotification(
					`${userAName} deleted task '${taskName}' in '${workspaceName}'`,
					false,
          false,
          '',
					"Dashboard",
					"Boards",
					"",
					true,
					userA.id
				);
				log("Building user-notification done");

        log('Deleting task')
        userA.subjects.every((subject) => {
					if (subject.id === ids.subject) {
						subject.workspaces.every((workspace) => {
							if (workspace.id === ids.workspace) {
								workspace.boards.every((board) => {
                  if (board.id === ids.board) {
										board.tasks = board.tasks.filter(
											(task) => task.id !== ids.task
										);
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
        })
        workspaceMembers.forEach(member => {
          member.subjects.every((subject) => {
						if (subject.id === ids.subject) {
							subject.workspaces.every((workspace) => {
								if (workspace.id === ids.workspace) {
									workspace.boards.every((board) => {
										if (board.id === ids.board) {
											board.tasks = board.tasks.filter(
												(task) => task.id !== ids.task
											);
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
          })
          log(`Adding notification to: ${member.firstName} ${member.lastName}`)
          member.notifications.unshift(newNotif)
          log(`Adding notification to: ${member.firstName} ${member.lastName} done`)
        })
        log('Deleting task done')

        log('Finalizing updates to all workspace member/s')
        const users = await manyUserFinal([userA, ...workspaceMembers])
        users.forEach(member => {
          log(`${member.firstName} ${member.lastName}`)
        })
        log("Finalizing updates to all workspace member/s done");

        log('Realtime updating workspace member/s')
        pusher.trigger(membersID, 'taskDeleted', {
          ids,
          newNotif
        })
      } else {
        log("Deleting task");
				userA.subjects.every((subject) => {
					if (subject.id === ids.subject) {
						subject.workspaces.every((workspace) => {
							if (workspace.id === ids.workspace) {
								workspace.boards.every((board) => {
									if (board.id === ids.board) {
										board.tasks = board.tasks.filter(
											(task) => task.id !== ids.task
										);
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
				log("Deleting task done");

				log("Finalizing userA data");
				await userFinal(userA);
				log("Finalizing userA data done");
      }
    } else {
      log('User is not verified')
      log('Deleting task')
      userA.subjects.every(subject => {
        if (subject.id === ids.subject) {
          subject.workspaces.every(workspace => {
            if (workspace.id === ids.workspace) {
              workspace.boards.every(board => {
                if (board.id === ids.board) {
                  board.tasks = board.tasks.filter(task => task.id !== ids.task)
                  return false
                }
                return true
              })
              return false
            }
            return true
          })
          return false
        }
        return true
      })
      log('Deleting task done')

      log('Finalizing userA data')
      await userFinal(userA)
      log('Finalizing userA data done')
    }

		log("DELETING TASK DONE");
    log("----------------------------------");

    return {
      taskID: ids.task
    }
  }
}