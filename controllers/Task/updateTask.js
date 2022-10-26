const { log, newNotification } = require("../../constants")
const { account } = require("../../models")
const { user, manyUserFinal, userFinal } = require("../user")
const { getAllMembers } = require("../Workspace/Member")


module.exports = {
  /** Updates the task */
  updateTask: async (req, pusher) => {
    log('-----------------------------------')
    log('Updating a task')

    const ids = req.body.ids
    const reqTask = req.body.task
    const mode = req.body.mode

    log('Getting data of user')
    const userA = await user(ids.user)
    log(`Getting data of ${userA.firstName} ${userA.lastName} done`)

    if (userA.verified) {
      log('Verified user')
      log('Updating task')

      let membersID = []
      let workspaceMembers = [account]
      let taskName = ''

      userA.subjects.every(subject => {
        if (subject.id === ids.subject) {
          subject.workspaces.every(workspace => {
            if (workspace.id === ids.workspace) {
              log('Checking workspace member/s')
              let temp = workspace.members.filter(member => member.id !== userA.id)

              if (temp.length != 0) {
                console.log('Workspace member/s detected');
                temp.forEach(member => {
                  membersID = [...membersID, member.id]
                })
              } else {
                log('No workspace meber/s detected')
              }

              workspace.boards.every(board => {
                if (board.id === ids.board) {
                  board.tasks.every(task => {
                    if (task.id === ids.task) {
                      taskName = task.name

                      log('Updating task name')
                      task.name = reqTask.name

                      log('Updating task description')
                      task.description = reqTask.description

                      log('Updating task assignees')
                      if (mode === 'memberRemove') {
                        log('Removing assignment of member')
                        task.members = task.members.filter(member => member.id !== reqTask.members[0].id)
                        log('Removing assignment of member done')
                      } else {
                        log('Assigning a member/s')
                        task.members = [...task.members, ...reqTask.members]
                        log('Assigning a member/s done')
                      }

                      log('Updating task level or priority')
                      task.level = reqTask.level

                      log('Updating task status')
                      task.status = reqTask.status

                      if (mode === 'status') {
                        log('Removing task in the old board')
                        board.tasks = board.tasks.filter(taska => taska.id !== ids.task)
                        log('Removing task in the old board done')

                        log('Moving task to new board')
                        workspace.boards.every(board => {
                          if (board.name.split(' ').join('').toLowerCase() === reqTask.status.split(' ').join('').toLowerCase()) {
                            board.tasks.push(task)
                            return false
                          }
                          return true
                        })
                        log('Moving task to new board done')
                      }
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
      log('Task Updated')

      if (membersID.length != 0) {
        log('Getting workspace members\' data')
        workspaceMembers = await getAllMembers(membersID)

        if (workspaceMembers.length != 0) {
          log('Getting workspace member/s\' data done')

          log("Building user-notification for other members");
					const newNotif = newNotification(
            `${userA.firstName} ${userA.lastName} ${mode === 'rename' ? 'renamed' : mode === 'status' ? 'changed status of': mode === 'level' ? 'changed the priority level of' : mode === 'description' ? 'changed/updated the description of' : mode === 'members' ? 'updated assignee/s to the' : ''} task \'${taskName}\' ${req.body.mode === 'rename' ? `to \'${reqTask.name}\'` : mode === 'status' ? `to ${reqTask.status}` : mode === 'level' ? `to ${reqTask.level}` : ''}`,
            false,
            false,
            '',
            'Dashboard',
            'Boards',
            ids.task,
            true,
            userA.id
					);
					log("Building user-notification for other members done");

          log("Updating workspace member/s data");
          workspaceMembers.forEach(member => {
            log('===')
            log(`Updating: ${member.firstName} ${member.lastName}`)
            log('Adding user-notification')
            member.notifications.unshift(newNotif)
            log('Adding user-notification done')
            member.subjects.every((subject) => {
							if (subject.id === ids.subject) {
								subject.workspaces.every((workspace) => {
									if (workspace.id === ids.workspace) {
										workspace.boards.every((board) => {
											if (board.id === ids.board) {
												board.tasks.every((task) => {
                          if (task.id === ids.task) {
                            log('Updating task')
														task.name = reqTask.name
														task.description = reqTask.description
														if (mode === "memberRemove") {
															task.members = task.members.filter(member => member.id !== reqTask.members[0].id)
														} else {
															task.members = [...task.members, ...reqTask.members];
														}
                            task.level = reqTask.level;
                            task.status = reqTask.status

                            if (mode === "status") {
															board.tasks = board.tasks.filter(
																(taska) => taska.id !== ids.task
															);
															workspace.boards.every((board) => {
																if (board.name.split(' ').join('').toLowerCase() === reqTask.status.split(' ').join('').toLowerCase()) {
																	board.tasks.push(task);
																	return false;
																}
																return true;
															});
														}
                            log('Updating task done')
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
								return false;
							}
							return true;
            })
            log('===')
          })
          log('Updating workspace members data done')

          log('Finalizing updates to all workspace member/s')
          const useraa = await manyUserFinal([userA, ...workspaceMembers])
          useraa.forEach(u => log(`${u.firstName} ${u.lastName}`))
          log('Finalizing updates to all workspace member/s done')

          log('Realtime Updating member/s')
          if (mode === "rename") {
						pusher.trigger(membersID, "taskRename", {
							ids: ids,
							task: {
								name: reqTask.name,
							},
							notification: newNotif,
						});
					} else if (mode === "status") {
						pusher.trigger(membersID, "taskStatus", {
							ids: ids,
							task: {
								status: reqTask.status,
							},
							notification: newNotif,
						});
					} else if (mode === "level") {
						pusher.trigger(membersID, "taskLevel", {
							ids: ids,
							task: {
								level: reqTask.level,
							},
							notification: newNotif,
						});
					} else if (mode === "description") {
						pusher.trigger(membersID, "taskDescription", {
							ids: ids,
							task: {
								description: reqTask.description,
							},
							notification: newNotif,
						});
          } else if(mode === 'members') {
            pusher.trigger(membersID, "taskMembers", {
							ids: ids,
							task: {
								members: reqTask.members,
							},
							notification: newNotif,
						});
          } else {
            pusher.trigger(membersID, "taskRemoveMember", {
							ids: ids,
							task: {
								member: reqTask.members[0],
							},
							notification: newNotif,
						});
          }
          
          log('Realtime updating member/s done')

          log('Task updated!')
          log('------------------------------------------')

          return {
						task: reqTask
					};
        } else {
          log('Getting workspace member/s\' data error')

          log("Finalizing updates on userA");
					await userFinal(userA);
          log("Finalizing updates on userA done");
          
          log("Task updated!");
					log("------------------------------------------");
          return {
            task: reqTask
          }
        }
      } else {
        log('Finalizing updates on userA')
        await userFinal(userA)
        log('Finalizing updates on userA done')

        log("Task updated!");
        log("------------------------------------------");
        
        return {
          task: reqTask
        }
      }
    } else {
      log('User is not verified')
      userA.subjects.every((subject) => {
        if (subject.id === ids.subject) {
          subject.workspaces.every((workspace) => {
            if (workspace.id === ids.workspace) {
              workspace.boards.every((board) => {
                if (board.id === ids.board) {
                  board.tasks.every((task) => {
                    if (task.id === ids.task) {
                      log('Updating task')
                      task.name = reqTask.name
											task.description = reqTask.description
											task.members = [
											...task.members,
											...reqTask.members,
											];
                      task.level = reqTask.level;
                      task.status = reqTask.status
                      log('Updating task done')
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
          return false;
        }
        return true;
      })

      log('Finalizing updates on userA')
      await userFinal(userA)
      log('Finalizing updates on userA done')


      log("Task updated!");
			log("------------------------------------------");
      return {
        task: reqTask
      }
    }
  }
}