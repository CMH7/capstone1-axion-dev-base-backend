const axios = require('axios')
const express = require("express")
const cors = require('cors')
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const Pusher = require("pusher")

const pusher = new Pusher({
	appId: "1483141",
	key: "8e02120d4843c3a07489",
	secret: "9162ab2d1aecdb36eef8",
	cluster: "ap1",
	useTLS: true,
})

var app = express()
app.use(cors())

// use JSON
app.use(bodyParser.json());

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
await prisma.$connect()

// Keeps the server up by waking this server every 20 min.
const wake = () => {
  setInterval(async () => {
    await axios.get('https://axion-back.herokuapp.com/').then(res => {
      console.log(`Waked the system!, ${res.status}`)
    }).catch(err => {
      console.log(`Waked system but error in fetch!, ${err}`)
    })
  }, 20 * 60 * 1000)
}
wake()

// creates new notification
const newNotification = (
	/** @type string */ message,
	/** @type boolean */ anInvitation,
	/** @type boolean */ aMention,
	/** @type string */ conversationID,
	/** @type string */ interf,
	/** @type string */ subInterface,
	/** @type string */ fromTask,
	/** @type boolean */ self,
	/** @type string */ userID
) => {
	return {
		id: bcrypt.hashSync(message, 13),
		message,
		isRead: false,
		anInvitation,
		aMention,
		conversationID,
		fromInterface: {
			interf,
			subInterface,
		},
		fromTask,
		for: {
			self,
			userID,
		},
	};
};

/** Creates a new subject @return AccountsSubject */
const newSubject = (
  /**@type string */ color,
  /**@type string */ id,
  /**@type string */ name,
  /**@type boolean */ owned,
  /**@type string */ createdBy
) => {
  return {
    color,
    id,
    isFavorite: false,
    name,
    workspaces: [],
    owned,
    createdBy,
  }
}

/** Creates a new workspace @return AccountsSubjectsWorkspace */
const newWorkspace = (
  /** @type AccountsWorkspaceMembers */ members,
  /** @type AccountsBoards */ boards,
  /** @type string[] */ admins,
  /** @type string */ color,
  /** @type string */ id,
  /** @type string */ name,
  /** @type boolean */ owned,
  /** @type boolean */ createdBy
) => {
  return {
    members,
    boards,
    admins,
    color,
    id,
    isFavorite: false,
    name,
    owned,
    createdBy
  }
}

// PORT
const port = process.env.PORT || 8080

const user = async (id) => {
  const SUPuser = await prisma.accounts.findFirst({
    where: {
      id: {
        equals: id
      }
    }
  })
  return SUPuser
}

const userFinal = async (userCopy) => {
  const user = await prisma.accounts.update({
    where: {
      id: userCopy.id
    },
    data: {
      invitations: userCopy.invitations,
      subjects: userCopy.subjects,
      notifications: userCopy.notifications,
      age: userCopy.age,
      course: userCopy.course,
      email: userCopy.email,
      firstName: userCopy.firstName,
      gender: userCopy.gender,
      lastName: userCopy.lastName,
      password: userCopy.password,
      profile: userCopy.profile,
      school: userCopy.school,
      useHint: userCopy.useHint,
      year: userCopy.year,
      lastActive: new Date(),
      bio: userCopy.bio
    }
  })
  return user
}

// === SERVER ===
// ##########################3 POST ROUTES ########################

// Create new user
app.post('/Signup', async (req, res) => {
  const newUser = await prisma.accounts.create({
    data: req.body
  })
  res.send({valid: newUser ? true : false})
})

// Creates a new subject
app.post('/MainApp/dashboard/create/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  const subjectToSend = {
		color: req.body.subject.color,
		id: req.body.ids.subject,
		isFavorite: false,
		name: req.body.subject.name,
		workspaces: [],
		owned: req.body.subject.owned,
		createdBy: req.body.subject.createdBy,
  }
  userA.subjects.unshift(subjectToSend)
  await userFinal(userA)
  res.send({
    subject: subjectToSend
  })
})

// Creates a new workspace
app.post('/MainApp/dashboard/subject/create/workspace', async (req, res) => {
  const userA = await user(req.body.ids.user)
  const workspaceToSend = {
		boards: [
			{
				color: "grey",
				createdBy: req.body.workspace.board.createdBy,
				createdOn: req.body.workspace.board.createdOn,
				id: req.body.ids.todo,
				name: "Todo",
				tasks: [],
			},
			{
				color: "info",
				createdBy: req.body.workspace.board.createdBy,
				createdOn: req.body.workspace.board.createdOn,
				id: req.body.ids.inprog,
				name: "In progress",
				tasks: [],
			},
			{
				color: "success",
				createdBy: req.body.workspace.board.createdBy,
				createdOn: req.body.workspace.board.createdOn,
				id: req.body.ids.done,
				name: "Done",
				tasks: [],
			},
		],
		members: [
			{
				email: userA.email,
				name: `${userA.firstName} ${userA.lastName}`,
				profile: `${userA.profile}`,
			},
		],
		admins: [`${userA.firstName} ${userA.lastName} (${userA.email})`],
		color: req.body.workspace.color,
		id: req.body.ids.workspace,
		isFavorite: false,
		name: req.body.workspace.name,
		owned: true,
		createdBy: req.body.workspace.createdBy,
  }
  
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.unshift(workspaceToSend)
      return false
    }
    return true
  })
  await userFinal(userA)

  res.send({
    workspace: workspaceToSend
  })
})

// Invite a member to the workspace
app.post('/MainApp/subject/workspace/invite', async (req, res) => {
  console.log('creating an invitation')

	const userA = await user(req.body.invitation.from.id)
	const userB = await user(req.body.invitation.to.id)

  // check if the user being invited is existing in the workspace if not add else return existing is true
  let existing = false
  userA.subjects.every(subject => {
    if (subject.id == req.body.invitation.subjectID) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.invitation.workspace.id) {
          workspace.members.every(member => {
            if (member.id === req.body.invitation.to.id) {
              existing = true
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

  if (!existing) {
    
    userA.invitations.unshift(req.body.invitation)
    userB.invitations.unshift(req.body.invitation)
  
    const newNotif = newNotification(
			`${userA.firstName} ${userA.lastName} invites you to join '${req.body.invitation.workspace.name}'`,
      true,
      false,
      '',
      'Dashboard',
      'Subjects',
      '',
      true,
      userB.id
		);
  
    userB.notifications.unshift(newNotif)
  
    await userFinal(userA);
    await userFinal(userB);
  
    // push to userB about the new invitation
    pusher.trigger(`${userB.id}`, "newInvitation", {
      invitation: req.body.invitation,
      notification: newNotif
    })
  }

  console.log("created an invitation");
  res.send({
    existing,
    invitation: req.body.invitation
  })
})

// Create new or Add new member to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/member', async (req, res) => {
  console.log('accepting an invitation')

  /** userB is the inviter */
  const userB = await user(req.body.ids.userB)

  /** userA is the user being invited */
  const userA = await user(req.body.ids.userA)

  let invitationa
  userA.invitations = userA.invitations.filter(invitation => invitation.id !== req.body.ids.invitation)
  userB.invitations.every(invitation => {
    if (invitation.id === req.body.ids.invitation) {
      invitation.status = 'accepted'
      invitationa = invitation
      return false
    }
    return true
  })

  // add user-notification for userB to be notified that the userA accepted the invitation
  const newNotif = newNotification(
    `${userA.firstName} ${userA.lastName} joined in ${invitationa.workspace.name}!`,
    true,
		false,
		"",
		"Dashboard",
		"Boards",
		"",
		true,
		userB.id
	);
  userB.notifications.unshift(newNotif)

  let subjectToSend
  let subjectb
  let workspacea

  // adding the invited user to the workspace members of the inviter user
  userB.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.members.unshift({
            email: req.body.workspace.member.email,
            name: req.body.workspace.member.name,
            profile: req.body.workspace.member.profile
          })
          workspacea = workspace
          return false
        }
        return true
      })
      subjectb = subject
      return false
    }
    return true
    }
  )

  // Check if the subject is already existing
  let existing = false
  userA.subjects.every(subject => {
    if (subject.id === subjectb.id) {
      existing = true
      return false
    }
    return true
  })

  // if existing just add the new workspace else create and add the new workspace
  if (existing) {

    // Check if the workspace is existing
    let wexisting = false
    userA.subjects.every(subjecta => {
      if (subjecta.id === subjectb.id) {
        subjecta.workspaces.every(workspace => {
          if (workspace.id === workspacea.id) {
            wexisting = true
            return false
          }
          return true
        })

        if (!wexisting) {
          subjecta.workspaces.push(newWorkspace(workspacea.members, workspacea.boards, workspacea.admins, workspacea.color, workspacea.id, workspacea.name, false, workspacea.createdBy))
        } else {
          subjecta.workspaces.push(workspacea)
        }
        subjectToSend = subjecta
        return false
      }
      return true
    })
  } else {
    userA.subjects.push(newSubject(subjectb.color, subjectb.id, subjectb.name, false, subjectb.createdBy))
    userA.subjects.every(subjecta => {
      if (subjecta.id === subjectb.id) {
        subjecta.workspaces.push(newWorkspace(workspacea.members, workspacea.boards, workspacea.admins, workspacea.color, workspacea.id, workspacea.name, false, workspacea.createdBy))
        subjectToSend = subjecta
        return false
      }
      return true
    })
  }

  await userFinal(userA)
  await userFinal(userB)

  pusher.trigger(`${userB.id}`, 'invitationAccepted', {
    notification: newNotif,
    invitationID: req.body.ids.invitation,
    subjectID: req.body.ids.subject,
    workspaceID: req.body.ids.workspace,
    member: {
      email: userA.email,
      name: `${userA.firstName} ${userA.lastName}`,
      profile: userA.profile
    }
  })

  console.log("accepting an invitation");
  res.send({
    subject: subjectToSend,
    workspaceID: workspacea.id,
    invitationID: req.body.ids.invitation
  })
})

// Create new or Add new board to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/board', async (req, res) => {
  const userA = await user(req.body.ids.user)
  const boardToSend = {
		tasks: [],
		color: req.body.board.color,
		createdBy: req.body.board.createdBy,
		createdOn: new Date().toISOString(),
		id: req.body.board.id,
		name: req.body.board.name,
	}
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.unshift(boardToSend)
        }
      })
    }
  })
  await userFinal(userA);
  res.send({
    board: boardToSend
  })
})

// Create new or Add new Admin to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/admin', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.admins.unshift(`${req.body.email}`)
        }
      })
    }
  })
  await userFinal(userA)
  res.send({
    admin: req.body.email
  })
})

// Create new or Add new Task to the board
app.post('/MainApp/dashboard/subject/workspace/board/create/task', async (req, res) => {
  const userA = await user(req.body.ids.user)
  let toSend = {}
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === "Todo") {
              toSend = {
                members: req.body.task.member,
                subtasks: [],
                conversations: [],
                viewers: [`${userA.firstName} ${userA.lastName}`],
                createdBy: req.body.task.createdBy,
                createdOn: new Date(),
                description: req.body.task.description,
                dueDateTime: req.body.task.dueDateTime, 
                id: req.body.task.id,
                isFavorite: false,
                isSubtask: req.body.task.isSubtask,
                level: req.body.task.level,
                name: req.body.task.name,
                status: 'Todo'
              }
              board.tasks.unshift(toSend)
            }
          })
        }
      })
    }
  })
  await userFinal(userA)
  res.send({
    task: toSend
  })
})

// Create new or Add new member to the task
app.post('/MainApp/dashboard/subject/workspace/board/task/create/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                if (task.id === req.body.task.id) {
                  task.members.unshift(
                    {
                      email: req.body.task.member.email,
                      name: req.body.task.member.name,
                      profile: req.body.task.member.profile
                    }
                  )
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new subtask to the task
app.post('/MainApp/dashboard/subject/workspace/board/task/create/subtask', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === "Todo") {
              board.tasks.unshift(
                {
                  members: req.body.task.subtask.members,
                  subtasks: [],
                  conversations: [],
                  viewers: [`${userA.firstName} ${userA.lastName}`],
                  createdBy: req.body.task.subtask.createdBy,
                  createdOn: req.body.task.subtask.createdOn,
                  description: req.body.task.subtask.description,
                  dueDateTime: req.body.task.subtask.dueDateTime,
                  id: req.body.task.subtask.id,
                  isFavorite: false,
                  isSubtask: true,
                  level: req.body.task.subtask.level,
                  name: req.body.task.subtask.name,
                  status: 'Todo'
                }
              )
            }

            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                if (task.id === req.body.task.id) {
                  task.subtasks.unshift(
                    {
                      members: req.body.task.subtask.members,
                      createdBy: req.body.task.subtask.createdBy,
                      createdOn: req.body.task.subtask.createdOn,
                      description: req.body.task.subtask.description,
                      dueDateTime: req.body.task.subtask.dueDateTime,
                      id: req.body.task.subtask.id,
                      isFavorite: false,
                      name: req.body.task.subtask.name,
                      status: "Todo",
                      level: req.body.task.subtask.level
                    }
                  )
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new member to the subtask
app.post('/MainApp/dashboard/subject/workspace/board/task/subtask/create/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                // task id === subtask id
                if (task.id === req.body.task.subtask.id) {
                  task.members.unshift(
                    {
                      email: req.body.task.subtask.member.email,
                      name: req.body.task.subtask.member.name,
                      profile: req.body.task.subtask.member.profile
                    }
                  )
                }
                
                // Handle subtask in task
                if (task.id === req.body.task.id) {
                  task.subtasks.map(subtask => {
                    if (subtask.id === req.body.task.subtask.id) {
                      subtask.members.unshift(
                        {
                          email: req.body.task.subtask.member.email,
                          name: req.body.task.subtask.member.name,
                          profile: req.body.task.subtask.member.profile
                        }
                      )
                    }
                  })
                }

              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new chat to the task
app.post('/MainApp/dashboard/subject/workspace/board/task/create/chat', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                if (task.id === req.body.task.id) {
                  task.conversations.unshift(
                    {
                      sender: {
                        email: req.body.task.conversation.sender.email,
                        name: req.body.task.conversation.sender.name,
                        profile: req.body.task.conversation.sender.profile
                      },
                      message: req.body.task.conversation.message,
                      sendAt: new Date(),
                      id: req.body.task.conversation.id
                    }
                  )
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new viewer to the task
app.post('/MainApp/dashboard/subject/workspace/board/task/create/viewer', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                if (task.id === req.body.task.id) {
                  task.viewers.unshift(req.body.task.viewer.name)
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new notification to the user or send a notification to another user
app.post('/User/create/notification', async (req, res) => {
  if (req.body.notification.for.self) {
    const userA = await user(req.body.notification.for.userID)
    userA.notifications.unshift(
      {
        id: req.body.notification.id,
        message: req.body.notification.message,
        isRead: false,
        anInvitation: req.body.notification.anInvitation,
        aMention: req.body.notification.aMention,
        conversationID: req.body.notification.conversationID,
        fromInterface: req.body.notification.fromInterface,
        fromTask: req.body.notification.fromTask,
        for: req.body.notification.for
      }
    )
    await userFinal(userA)
    res.send({
      notification: {
        id: req.body.notification.id,
        message: req.body.notification.message,
        isRead: false,
        anInvitation: req.body.notification.anInvitation,
        aMention: req.body.notification.aMention,
        conversationID: req.body.notification.conversationID,
        fromInterface: req.body.notification.fromInterface,
        fromTask: req.body.notification.fromTask,
        for: req.body.notification.for
      }
    })
  } else {
    const userA = await user(req.body.notification.for.userID)
    userA.notifications.unshift(
      {
        id: req.body.notification.id,
        message: req.body.notification.message,
        isRead: false,
        anInvitation: req.body.notification.anInvitation,
        aMention: req.body.notification.aMention,
        conversationID: req.body.notification.conversationID,
        fromInterface: req.body.notification.fromInterface,
        fromTask: req.body.notification.fromTask,
        for: {
          self: true,
          userID: userA.id
        }
      }
    )
    res.send({sent: true})
  }
})

// ######################## GET ROUTES #########################
// Gets all user from database
app.get('/', async (req, res) => {
  res.send(await prisma.accounts.findMany())
})

// Get all the user's notifications
app.get('/:id/notifications', async (req, res) => {
  const userA = await user(req.params.id)
  res.send({
    notifications: userA.notifications
  })
})

// Get the user and then update its lastActive to the current DateTime
app.get('/Signin/active', async (req, res) => {
  const userA = await prisma.accounts.findFirst(
    {
      where: {
        email: {
          equals: req.query.email
        }
      }
    }
  )
  userA.lastActive = new Date()
  userFinal(userA)
  res.send({updated: true})
})

// Gets only password to sign in
app.get('/Signin', async (req, res) => {
  const pass = await prisma.accounts.findFirst({
    select: {
      password: true
    },
    where: {
      email: {
        equals: req.query.email
      }
    }
  })
  res.send(pass ? pass : {password: ''})
})

// Gets the user based on the email
app.post('/validUser', async (req, res) => {
	const user = await prisma.accounts.findFirst({
		where: {
			email: {
				equals: req.body.email,
			},
		},
	})
  res.send({
    user
  })
})

// Set the notification isRead to true and return it
app.get('/User/notification', async (req, res) => {
  const userA = await user(req.query.user)
  userA.notifications.every(notification => {
    if (notification.id === req.query.notification) {
      notification.isRead = true
      return false
    }
    return true
  })
  const finalUser = await userFinal(userA)
  res.send({
    notifications: finalUser.notifications
  })
})

// get a single user-notification
app.get('/:userID/notification', async (req, res) => {
  console.log('getting single notification')
  const userA = await user(req.params.userID)
  let notif
  userA.notifications.every(notification => {
    if (notification.id === req.query.notifID) {
      notif = notification
      return false
    }
    return true
  })

  console.log('fetched single notification')
  res.send({
    notification: notif
  })
})

// Get the metadata of the workspace member
// if the current profile pic is not equal to the database then the current profile pic will be overwritten
app.get('/MainApp/subject/workspace/member/:email', async (req, res) => {
  const member = await prisma.accounts.findFirst({
    select: {
      firstName: true,
      lastName: true,
      profile: true
    },
    where: {
      email: {
        equals: req.params.email
      }
    }
  })

  res.send({member})
})


// Get the specific task
app.get('/User/:id', async (req, res) => {
  const userA = await user(req.params.id)
  const subject = userA.subjects.filter(subject => subject.id === req.query.subjectID)
  const workspace = subject[0].workspaces.filter(workspace => workspace.id === req.query.workspaceID)
  const board = workspace[0].boards.filter(status => status.id === req.query.statusID)
  const task = board[0].tasks.filter(task => task.id === req.query.taskID)
  res.send({task: task[0]})
})

// ###################### PUT ROUTES #####################
// Update the profile pic 
app.put('/validUser/edit/profile', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.profile = req.body.user.profile
  const userFinalCopy = await userFinal(userA)
  res.send({
    profile: userFinalCopy.profile
  })
})

// Update the age of the user
app.put('/User/edit/age', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.age = req.body.age
  const finalUser = await userFinal(userA)
  res.send({
    age: req.body.age
  })
})

// Update the year of the user
app.put('/User/edit/year', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.year = req.body.year
  const finalUser = await userFinal(userA)
  res.send({
    year: req.body.year
  })
})

// Update the useHint setting of the user
app.put('/User/edit/useHint', async (req, res) =>{
  const userA = await user(req.body.ids.user)
  userA.useHint = req.body.useHint
  const finalUser = await userFinal(userA)
  res.send({
    useHint: req.body.useHint
  })
})

// Update the school of the user
app.put('/User/edit/school', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.school = req.body.school
  const finalUser = await userFinal(userA)
  res.send({
    school: req.body.school
  })
})

// Update the course of the user
app.put('/User/edit/course', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.course = req.body.course
  const finalUser = await userFinal(userA)
  res.send({
    course: req.body.course
  })
})

// Update the bio of the user
app.put('/User/edit/bio', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.bio = req.body.bio
  const finalUser = await userFinal(userA)
  res.send({
    bio: req.body.bio
  })
})

// Update the subject's meta data based on the subjectID
app.put('/MainApp/edit/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.notifications.unshift(req.body.notification)
  userA.subjects.every(subject => {
    if (subject.id === req.body.subject.id) {
      subject.color = req.body.subject.color
      subject.isFavorite = req.body.subject.isFavorite
      subject.name = req.body.subject.name
      return false
    }
    return true
  })
  const finalUser = await userFinal(userA)
  res.send({
    subject: req.body.subject
  })
})

// Update the subject a TRUNCATION of the subject
app.put('/MainApp/truncate/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  let subjectToSend = {}
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces = []
      subjectToSend = subject
      return false
    }
    return true
  })
  const finalUser = await userFinal(userA)
  res.send({
    subject: subjectToSend
  })
})

// update the workspace by userID, subjectID, workspaceID
app.put('/MainApp/subject/workspace/edit', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.workspace.id) {
          workspace.color = req.body.workspace.color
          workspace.isFavorite = req.body.workspace.isFavorite
          workspace.name = req.body.workspace.name
          return false
        }
        return true
      })
      return false
    }
    return true
  })

  await userFinal(userA)
  res.send({
    workspace: {
      color: req.body.workspace.color,
      isFavorite: req.body.workspace.isFavorite,
      name: req.body.workspace.name
    }
  })
})

// update the board by userID, subjectID, workspaceID, and boardID
app.put('/MainApp/subject/workspace/board/edit', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.every(board => {
            if (board.id === req.body.board.id) {
              board.color = req.body.board.color
              board.name = req.body.board.name
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
  await userFinal(userA)
  res.send({
    board: {
      name: req.body.board.name,
      color: req.body.board.color
    }
  })
})

// Update the task status based on the subjectID, workspaceID and boardID and taskID
app.put('/MainApp/edit/subject/workspace/board/task/status', async (req, res) => {
  const userA = await user(req.body.ids.user)

  // change the status of the task and remove it on its previous board
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.every(board => {
            if (board.id === req.body.ids.board) {
              board.tasks.every(task => {
                if (task.id === req.body.task.id) {
                  board.tasks = board.tasks.filter(task2 => task2.id !== task.id)
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

  // add the task on the selected board name (board name cannot be repeated on same workspace)
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.every(board => {
            if (board.name === req.body.task.status) {
              board.tasks.unshift(req.body.task)
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
  await userFinal(userA)
  res.send({
    task: req.body.task
  })
})

// ###################### DELETE ROUTES ##################
// Remove or delete a notification in user
app.delete('/User/delete/notification', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.notifications = userA.notifications.filter(notif => notif.id != req.body.ids.notification)
  const finalUser = await userFinal(userA)
  res.send({
    notifications: finalUser.notifications
  })
})

// Remove or delete all notification in user
app.delete('/User/delete/all/notification', async (req, res) => {
  console.log('deleting all notification')
  const userA = await user(req.body.userID)
  userA.notifications = []
  const finalUser = await userFinal(userA)
  console.log('deleted all notification')
  res.send({
    notifications: []
  })
})

// Remove or delete a member in subtask and in task with isSubtask true and task id equals subtask id
app.delete('/MainApp/subject/workspace/board/task/subtask/delete/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                // handle subtask as task
                if (task.id === req.body.task.subtask.id) {
                  task.members = task.members.filter(member => member.email !== req.body.task.subtask.member.email)
                }

                // handle subtask in task
                if (task.id === req.body.task.id) {
                  task.subtasks.map(subtask => {
                    if (subtask.id === req.body.task.subtask.id) {
                      subtask.members = subtask.members.filter(member => member.email !== req.body.task.subtask.member.email)
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete a subtask and in task with same subtask id
app.delete('/MainApp/subject/workspace/board/task/delete/subtask', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            // Remove task with task.id === subtask.id
            board.tasks = board.tasks.filter(task => task.id != req.body.task.subtask.id)
            // Remove subtask by id
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                if (task.id === req.body.task.id) {
                  task.subtasks = task.subtasks.filter(subtask => subtask.id != req.body.task.subtask.id)
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete a task (parent)
app.delete('/MainApp/subject/workspace/board/delete/task', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            // Remove task with task by id
            board.tasks = board.tasks.filter(task => task.id != req.body.task.id)
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete a member in task
app.delete('/MainApp/subject/workspace/board/task/delete/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {                
                if (task.id === req.body.task.id && !task.isSubtask) {
                  task.members = task.members.filter(member => member.email !== req.body.task.member.email)
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete a chat in task
app.delete('/MainApp/subject/workspace/board/task/delete/chat', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === req.body.task.status) {
              board.tasks.map(task => {
                // handle subtask as task
                if (task.id === req.body.task.id) {
                  task.conversations = task.conversations.filter(convo => convo.id !== req.body.task.conversation.id)
                }
              })
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Cancel an invitation
app.delete('/MainApp/subject/workspace/invitation/cancel', async (req, res) => {
  console.log('canceling an invitation')

  /** The inviter user */
  const userA = await user(req.body.ids.user)

  /** The invited user */
  const userB = await user(req.body.ids.toUser)

  // remove the invitation in both user
  userA.invitations = userA.invitations.filter(invitation => invitation.id !== req.body.ids.invitation)
  userB.invitations = userB.invitations.filter(invitation => invitation.id !== req.body.ids.invitation)

  let invitationa = {
    id: '',
    workspaceName: ''
  }
  userB.invitations.every(invitation => {
    if (invitation.id === req.body.ids.invitation) {
      invitationa = {
        id: invitation.id,
        workspaceName: invitation.workspace.name
      }
      return false
    }
    return true
  })

  // add new user-notification for the invited user about invitation canceled
  const newNotif = newNotification(
    `${userA.firstName} ${userA.lastName} invitatio to '${invitationa.workspaceName}' is canceled`,
    true,
    false,
    "",
    "Dashboard",
    "Subjects",
    "",
    true,
    userB.id
  )
  userB.notifications.unshift(newNotif);


  await userFinal(userA)
  await userFinal(userB)
  
  pusher.trigger(`${userB.id}`, 'invitationCanceled', {
    invitation: invitationa,
    notification: newNotif
  })

  console.log("canceled an invitation");

  res.send({
    invitationID: invitationa.id
  })
})

// Remove the accepted/rejected invitation
app.delete('/MainApp/subject/workspace/invitation/remove', async (req, res) => {
  console.log('invitation removing')
  const userA = await user(req.body.ids.user)
  userA.invitations = userA.invitations.filter(invitation => invitation.id !== req.body.ids.invitation)
  await userFinal(userA)
  console.log('invitation removed')
  res.send({
    invitationID: req.body.ids.invitation
  })
})

// Reject and delete the invitation
app.delete('/MainApp/subject/workspace/invitation/reject', async (req, res) => {
  console.log('rejecting an invitation')

  /** The invited user */
  const userA = await user(req.body.ids.userA)

  /** The inviter user */
  const userB = await user(req.body.ids.userB)

  // update status of the invitation into rejected in userB
  let invitationa
  userB.invitations.every(invitation => {
    if (invitation.id === req.body.ids.invitation) {
      invitation.status = 'rejected'
      invitationa = invitation
      return false
    }
    return true
  })

  // remove or delete the invitation in the userA
  userA.invitations = userA.invitations.filter(invitation => invitation.id !== req.body.ids.invitation)

  // add notification for the inviter that the invitation is rejected
  const newNotif = newNotification(
		`${userA.firstName} ${userA.lastName} rejected to join '${invitationa.workspace.name}'`,
		true,
		false,
		"",
		"Dashboard",
		"Subjects",
		"",
		true,
		userB.id
  );
  userB.notifications.unshift(newNotif)

  await userFinal(userA)
  await userFinal(userB)

  // push event to userB
  pusher.trigger(`${userB.id}`, 'invitationRejected', {
    invitationID: req.body.ids.invitation,
    notification: newNotif
  })

  console.log("rejecting an invitation");

  res.send({
    invitationID: req.body.ids.invitation
  })
})

// Remove or delete a member in workspace
app.delete('/MainApp/subject/workspace/member/delete', async (req, res) => {
  const userA = await user(req.body.ids.user)
  let members = []
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.workspace.id) {
          workspace.members = workspace.members.filter(member => member.email != req.body.workspace.member.email)
          members = workspace.members
          return false
        }
        return true
      })
      return false
    }
    return true
  })
  await userFinal(userA)
  res.send({
    members
  })
})

// Remove or delete a board (customed) in workspace
// Todo, In progress and Done cannot be deleted
app.delete('/MainApp/subject/workspace/delete/board', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards = workspace.boards.filter(board => board.id !== req.body.ids.board)
          return false
        }
        return true
      })
      return false
    }
    return true
  })
  await userFinal(userA)
  res.send({
		id: req.body.ids.board
	});
})

// Remove or delete an admin in workspace
app.delete('/MainApp/subject/workspace/delete/admin', async (req, res) => {
  const userA = await user(req.body.ids.user)
  let admins = []
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.every(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.admins = workspace.admins.filter(admin => admin != req.body.admin)
          admins = workspace.admins
          return false
        }
        return true
      })
      return false
    }
    return true
  })
  await userFinal(userA)
  res.send({
    admins
  })
})

// Remove or delete workspace in subject
app.delete('/MainApp/subject/workspace/delete', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.every(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces = subject.workspaces.filter(workspace => workspace.id !== req.body.ids.workspace)
      return false
    }
    return true
  })
  await userFinal(userA)
  res.send({
    id: req.body.ids.workspace
  })
})

// Remove or delete subject in account
app.delete('/MainApp/delete/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects = userA.subjects.filter(subject => subject.id != req.body.ids.subject)
  userA.notifications.unshift(req.body.notification)
  await userFinal(userA)
  res.send({
    error: false
  })
})


// TESTS
app.get('/MainApp/:SubjectName', (req, res) => {
  res.send({
    data: req.params.SubjectName,
    error: false,
    message: 'OK'
  })
})

app.listen(port, function () {
  console.log("Started application backend on port %d", port);
});