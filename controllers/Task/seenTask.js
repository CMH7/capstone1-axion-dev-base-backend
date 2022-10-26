const { manyUserFinal, user, userFinal } = require("../user")
const { getAllMembers } = require("../Workspace/Member")

module.exports = {
  addSeen: async (req, pusher) => {
    console.log('----------------------------------');
    console.log('task viewers entry');
    const ids = req.body.ids
    let membersID = []
    let workspaceMembers = []

    console.log('Getting user data');
    /** The task seener */
    const userA = await user(ids.userA)
    console.log(`Getting user ${userA.firstName} ${userA.lastName} data done`);

    console.log('Adding viewer');
    userA.subjects.every(subject => {
      if (subject.id === ids.subject) {
        subject.workspaces.every(workspace => {
          if (workspace.id === ids.workspace) {
            // Removing the viewer
            let temp = workspace.members.filter(member => member.id !== userA.id)

            if (temp.length != 0) {
              console.log('Workspace member/s detected');
              temp.forEach(member => {
                membersID = [...membersID, member.id]
              })
            } else {
              console.log('No workspace member/s detected');
            }

            workspace.boards.every(board => {
              if (board.id === ids.board) {
                board.tasks.every(task => {
                  if (task.id === ids.task) {
                    task.viewers.push(`${userA.firstName} ${userA.lastName}`);
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
        return false
      }
      return true
    })
    console.log('Added viewer');

    if (membersID.length != 0) {
      console.log('Getting other workspace members');
      workspaceMembers = await getAllMembers(membersID)
      console.log(('Getting other workspace members done'));

      workspaceMembers.forEach(member => {
        console.log(`Updating viewers of ${member.firstName} ${member.lastName}`);
				member.subjects.every((subject) => {
					if (subject.id === ids.subject) {
						subject.workspaces.every((workspace) => {
              if (workspace.id === ids.workspace) {
                workspace.boards.every((board) => {
									if (board.id === ids.board) {
										board.tasks.every((task) => {
											if (task.id === ids.task) {
												task.viewers.push(
													`${userA.firstName} ${userA.lastName}`
												);
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
						return false;
					}
					return true;
				});
      })
      console.log("Updated viewer");

      console.log('Finalizing updates');
      if (workspaceMembers.length != 0) {
        console.log('Finalizaing updates on all workspace members');
        let users = await manyUserFinal([userA, ...workspaceMembers])
        users.forEach(useraa => {
          console.log(`${useraa.firstName} ${useraa.lastName}`);
        })
      } else {
        console.log('Finalizing update on viewer');
        await userFinal(userA)
      }
      console.log('Finalizing updates done');

      if (workspaceMembers.length != 0) {
        console.log('Realtime update for others');
        workspaceMembers.forEach(member => {
          pusher.trigger(`${member.id}`, 'taskViewer', {
            subjectID: ids.subject,
            workspaceID: ids.workspace,
            boardID: ids.board,
            taskID: ids.task,
            viewer: `${userA.firstName} ${userA.lastName}`
          })
          console.log('Realtime update for others done');
        })

      }


			console.log("task viewers entry done");
      console.log("----------------------------------");

      return `${userA.firstName} ${userA.lastName}`
    }
  }
}