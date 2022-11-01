const { user, manyUserFinal, userFinal } = require("../user");
const { getAllMembers } = require("../Workspace/Member");

module.exports = {
  createTask: async (req, pusher) => {
    console.log('--------------------------------');
    console.log('CREATING TASK');

    let membersID = []
    let workspaceMembers = []
    let newTask = {
			members: req.body.task.member,
			subtasks: [],
			conversations: [],
			viewers: [],
			createdBy: req.body.task.createdBy,
			createdOn: new Date(),
			description: req.body.task.description,
			dueDateTime: req.body.task.dueDateTime,
			id: req.body.task.id,
			isFavorite: false,
			isSubtask: req.body.task.isSubtask,
			level: req.body.task.level,
			name: req.body.task.name,
			status: "Todo",
		};

    const ids = req.body.ids

    console.log('Getting user data');
    /** The creator of the task */
    const userA = await user(ids.user);
    newTask.viewers.unshift(`${userA.firstName} ${userA.lastName}`)
    console.log('Getting user data done');

    // check if the workspace has members
    console.log('Checking of workspace members and adding the task');
    userA.subjects.every(subject => {
      if (subject.id === ids.subject) {
        subject.workspaces.every(async workspace => {
          if (workspace.id === ids.workspace) {
            // removing the creator
            let temp = workspace.members.filter(member => member.id !== userA.id)

            if (temp.length != 0) {
              console.log('Workspace member/s detected');
              temp.forEach(member => {
                membersID = [...membersID, member.id]
              })
            }

            console.log('Adding the created task');
            workspace.boards.every(board => {
              if (board.name === "Todo") {
                board.tasks.unshift(newTask)
                return false
              }
              return true
            })
            console.log('Added the created task')
            return false
          }
          return true
        })
        return false
      }
      return true
    })

    if (membersID.length != 0) {
      console.log("Getting workspace member/s data");
			workspaceMembers = await getAllMembers(membersID);
			console.log("Getting workspace member/s data done");
    
      console.log('Adding the created task to other members');
      workspaceMembers.forEach(member => {
        console.log(`Adding task to: ${member.firstName} ${member.lastName}`);
        member.subjects.every(subject => {
          if (subject.id === ids.subject) {
            subject.workspaces.every(workspace => {
              if (workspace.id === ids.workspace) {
                workspace.boards.every((board) => {
									if (board.name === "Todo") {
										board.tasks.unshift(newTask);
										return false;
									}
									return true;
								});
                return false
              }
              return true
            })
            return false
          }
          return true
        })
      })
      console.log('Adding the created task to other members done');
    }

    console.log('Finalizing updates');
    if (workspaceMembers.length != 0) {
      console.log('Finalizing updates to all members: create task');
      let users = await manyUserFinal([userA, ...workspaceMembers])
      users.forEach(useraa => {
        console.log(`${useraa.firstName} ${useraa.lastName}`);
      })
    } else {
      console.log('Finalizing update to userA: create task');
      await userFinal(userA)
    }
    console.log('Finalizing updates done');

    if (workspaceMembers.length != 0) {
      console.log('Realtime update on other users');
      membersID.forEach(memberID => {
        pusher.trigger(`${memberID}`, 'newTask', {
          subjectID: ids.subject,
          workspaceID: ids.workspace,
          task: newTask
        })
      })
      console.log('Realtime update on other users done');
    }

		console.log("CREATING TASK DONE");
    console.log("--------------------------------");

    return newTask
  }
}