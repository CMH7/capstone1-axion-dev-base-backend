/* eslint-disable no-unused-vars */
const express = require("express");
const cors = require('cors');
const bodyParser = require('body-parser');

const corsOption = {
  origin: '*',
  preflightContinue: true
}

var app = express()
app.use(cors(corsOption))
app.options('*', cors(corsOption))

// use JSON
app.use(bodyParser.json());

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// connect to the database
async function conn() {
  await prisma.$connect();
}

// disconnects to the database
async function disconn() {
  await prisma.$disconnect();
}

// PORT
const port = process.env.PORT || 8080

const user = async (id) => {
  conn()
  const SUPuser = await prisma.accounts.findFirst({
    where: {
      id: {
        equals: id
      }
    }
  })
  disconn()
  return SUPuser
}

const userFinal = async (userCopy) => {
  conn()
  const user = await prisma.accounts.update({
    where: {
      id: userCopy.id
    },
    data: {
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
      lastActive: new Date()
    }
  })
  disconn()
  return user
}

// === SERVER ===
// ##########################3 POST ROUTES ########################

// Create new user
app.post('/Signup', async (req, res) => {
  conn()
  const newUser = await prisma.accounts.create({
    data: req.body
  })
  disconn()
  res.send({valid: true})
})

// Creates a new subject
app.post('/MainApp/dashboard/create/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.push(
    {
      color: req.body.subject.color,
      id: req.body.ids.subject,
      isFavorite: false,
      name: req.body.subject.name,
      workspaces: [],
      owned: req.body.subject.owned,
      createdBy: req.body.subject.createdBy
    }
  )
  res.send(await userFinal(userA))
})

// Creates a new workspace
app.post('/MainApp/dashboard/subject/create/workspace', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.push(
        {
          boards: [
            {
              color: "grey",
              createdBy: req.body.workspace.board.createdBy,
              createdOn: req.body.workspace.board.createdOn,
              id: req.body.ids.todo,
              name: "Todo",
              tasks: []
            },
            {
              color: "info",
              createdBy: req.body.workspace.board.createdBy,
              createdOn: req.body.workspace.board.createdOn,
              id: req.body.ids.inprog,
              name: "In progress",
              tasks: []
            },
            {
              color: "success",
              createdBy: req.body.workspace.board.createdBy,
              createdOn: req.body.workspace.board.createdOn,
              id: req.body.ids.done,
              name: "Done",
              tasks: []
            },
          ],
          members: [],
          admins: [],
          color: req.body.workspace.color,
          id: req.body.ids.workspace,
          isFavorite: false,
          name: req.body.workspace.name,
          owned: subject.owned,
          createdBy: req.body.workspace.createdBy
        }
      )
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new member to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.members.push(
                {
                  email: req.body.workspace.member.email,
                  name: req.body.workspace.member.name,
                  profile: req.body.workspace.member.profile
                }
              )
            }
          }
        )
      }
    }
  )
  res.send(await userFinal(userA))
})

// Create new or Add new board to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/board', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.push(
            {
              tasks: [],
              color: req.body.board.color,
              createdBy: req.body.board.createdBy,
              createdOn: req.body.board.createdOn,
              id: req.body.ids.board,
              name: req.body.board.name
            }
          )
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new Admin to the workspace
app.post('/MainApp/dashboard/subject/workspace/create/admin', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.admins.push(`${req.body.admin.email}`)
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Create new or Add new Task to the board
app.post('/MainApp/dashboard/subject/workspace/board/create/task', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards.map(board => {
            if (board.name === "Todo") {
              board.tasks.push(
                {
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
                  status: 'Todo'
                }
              )
            }
          })
        }
      })
    }
  })
  res.send(await userFinal(userA))
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
                  task.members.push(
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
              board.tasks.push(
                {
                  members: req.body.task.subtask.members,
                  subtasks: [],
                  conversations: [],
                  viewers: [],
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
                  task.subtasks.push(
                    {
                      members: req.body.task.subtask.members,
                      createdBy: req.body.task.subtask.createdBy,
                      createdOn: req.body.task.subtask.createdOn,
                      description: req.body.task.subtask.description,
                      dueDateTime: req.body.task.subtask.dueDateTime,
                      id: req.body.task.subtask.id,
                      isFavorite: false,
                      name: req.body.task.subtask.name,
                      status: "Todo"
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
                  task.members.push(
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
                      subtask.members.push(
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
                  task.conversations.push(
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
                  task.viewers.push(req.body.task.viewer.name)
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
    userA.notifications.push(
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
    res.send(await userFinal(userA))
  } else {
    const userA = await user(req.body.notification.for.userID)
    userA.notifications.push(
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
  conn()
  res.send(await prisma.accounts.findMany())
  disconn()
})

// Get the user and then update its lastActive to the current DateTime
app.get('/Signin/active', async (req, res) => {
  conn()
  const userA = await prisma.accounts.findFirst(
    {
      where: {
        email: {
          equals: req.query.email
        }
      }
    }
  )
  disconn()
  userA.lastActive = new Date()
  userFinal(userA)
  res.send({updated: true})
})

// Gets only password to sign in
app.get('/Signin', async (req, res) => {
  conn()
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
  disconn()
  res.send(pass)
})

// Gets the user based on the email
app.post('/validUser', async (req, res) => {
  conn()
  const user = await prisma.accounts.findFirst({
    where: {
      email: {
        equals: req.body.email
      }
    }
  })
  disconn()
  res.send(user)
})

// ###################### PUT ROUTES #####################

// ###################### DELETE ROUTES ##################
// Remove or delete a notification in user
app.delete('/User/delete/notification', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.notifications = userA.notifications.filter(notif => notif.id != req.body.ids.notification)
  res.send(await userFinal(userA))
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

// Remove or delete a member in workspace
app.delete('/MainApp/subject/workspace/delete/member', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.workspace.id) {
          workspace.members = workspace.members.filter(member => member.email != req.body.workspace.member.email)
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete a board (customed) in workspace
// Todo, In progress and Done cannot be deleted
app.delete('/MainApp/subject/workspace/delete/board', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.ids.workspace) {
          workspace.boards = workspace.boards.filter(board => board.id != req.body.workspace.board.id)
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete an admin in workspace
app.delete('/MainApp/subject/workspace/delete/admin', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces.map(workspace => {
        if (workspace.id === req.body.workspace.id) {
          workspace.admins = workspace.admins.filter(admin => admin != req.body.workspace.admin)
        }
      })
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete workspace in subject
app.delete('/MainApp/subject/delete/workspace', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects.map(subject => {
    if (subject.id === req.body.ids.subject) {
      subject.workspaces = subject.workspaces.filter(workspace => workspace.id != req.body.ids.workspace)
    }
  })
  res.send(await userFinal(userA))
})

// Remove or delete subject in account
app.delete('/MainApp/delete/subject', async (req, res) => {
  const userA = await user(req.body.ids.user)
  userA.subjects = userA.subjects.filter(subject => subject.id != req.body.ids.subject)
  res.send(await userFinal(userA))
})

app.listen(port, function () {
  console.log("Started application backend on port %d", port);
});