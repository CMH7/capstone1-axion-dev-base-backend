const axios = require("axios")
const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const sgMail = require("@sendgrid/mail");
require("dotenv").config({ path: "./vars/.env" });
const bcrypt = require('bcryptjs')


const {
	newMsg,
	newNotification,
  backURI,
  prisma,
	resetMsg,
	backURIfront,
	log
} = require("./constants");
const { wake } = require('./wake')
const { createSubject, deleteSubject } = require("./controllers/Subject")
const { user, userFinal, newUser, manyUserFinal, getProfile, viewUser, updateUser } = require("./controllers/user")
const { createWorkspace, deleteWorkspace } = require("./controllers/Workspace")
const { invite, getAllMembers, newMember, kickMember, demoteAdmin, getUpdateMembersData } = require("./controllers/Workspace/Member")
const { notification } = require("./models")
const { newAdmin } = require("./controllers/Workspace/Member/addAdmin")
const { rejectInvitation, removeInvitation } = require("./controllers/Invitations")
const { addBoard } = require("./controllers/Workspace/Board")
const { addSeen, createTask, sendChat, updateTask, deleteTask } = require("./controllers/Task")
const Pusher = require("pusher");
const { readNotification, deleteNotification, deleteAllNotification } = require("./controllers/Notification");

const pusher = new Pusher({
	appId: process.env.pusher_appId3,
	key: process.env.pusher_key3,
	secret: process.env.pusher_secret3,
	cluster: process.env.pusher_cluster3,
	useTLS: true,
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.set("view engine", "ejs");

const startPrisma = async () => {
  await prisma.$connect()
  console.log('Connection to DB opened')
}
startPrisma()

// wake the system
wake()

// PORT
const port = process.env.PORT || 8080;

// === SERVER ===
// wake
app.get('/wake', (req, res) => {
  res.send({})
}) 

// ########################## POST ROUTES ########################

// Create new user
app.post("/Signup", async (req, res) => {
  console.log('Creating new user')
	const user = await newUser(req)
	sgMail.send(newMsg(user.email,`${user.firstName} ${user.lastName}`,`${backURI}/verification/${user.id}?email=${user.email}`))
		.then((res) => {
			console.log(`Email verification sent to ${user.email}, ${res}`);
		})
		.catch((err) => {
			console.error(err);
    })
  console.log("Created new user");
	res.send({ valid: user ? true : false });
});

// Creates a new subject
app.post("/MainApp/dashboard/create/subject", async (req, res) => {
  console.log('creating subject')
  const userA = await user(req.body.ids.user)
  const result = createSubject(req, userA)
  await userFinal(result.user)
  console.log('created subject')
  res.send({subject: result.subjectToSend})
})

// Creates a new workspace
app.post("/MainApp/dashboard/subject/create/workspace", async (req, res) => {
  console.log('creating workspace')
	const userA = await user(req.body.ids.user)
	const result = createWorkspace(req, userA)
  await userFinal(result.user);
  console.log("created workspace");
	res.send({workspace: result.workspaceToSend,})
});

// Invite a member to the workspace
app.post("/MainApp/subject/workspace/invite", async (req, res) => {
  const result = await invite(req, pusher)
	res.send({
		invitation: result,
	})
})

// Create new or Add new member to the workspace
app.post(
	"/MainApp/dashboard/subject/workspace/create/member",
	async (req, res) => {
		const result = await newMember(req, pusher)
		res.send({
			subject: result.subjectToSend,
			workspace: result.workspaceToSend,
			invitationID: result.invitationID,
		});
	}
)

// Create new or Add new board to the workspace
app.post("/MainApp/dashboard/subject/workspace/create/board", async (req, res) => {
		const result = await addBoard(req, pusher)
		res.send({
			board: result,
		});
	}
);

// Create new or Add new Admin to the workspace
app.post(
	"/MainApp/dashboard/subject/workspace/admin/add",
	async (req, res) => {
		const result = await newAdmin(req, pusher)
		res.send({
			admin: result.admin,
		});
	}
);

// Create new or Add new Task to the board
app.post("/MainApp/dashboard/subject/workspace/board/task/create", async (req, res) => {
		const result = await createTask(req, pusher)
		res.send({
			task: result,
		});
	}
);

// Create new or Add new subtask to the task
app.post(
	"/MainApp/dashboard/subject/workspace/board/task/create/subtask",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							if (board.name === "Todo") {
								board.tasks.unshift({
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
									status: "Todo",
								});
							}

							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									if (task.id === req.body.task.id) {
										task.subtasks.unshift({
											members: req.body.task.subtask.members,
											createdBy: req.body.task.subtask.createdBy,
											createdOn: req.body.task.subtask.createdOn,
											description: req.body.task.subtask.description,
											dueDateTime: req.body.task.subtask.dueDateTime,
											id: req.body.task.subtask.id,
											isFavorite: false,
											name: req.body.task.subtask.name,
											status: "Todo",
											level: req.body.task.subtask.level,
										});
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Create new or Add new member to the subtask
app.post(
	"/MainApp/dashboard/subject/workspace/board/task/subtask/create/member",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									// task id === subtask id
									if (task.id === req.body.task.subtask.id) {
										task.members.unshift({
											email: req.body.task.subtask.member.email,
											name: req.body.task.subtask.member.name,
											profile: req.body.task.subtask.member.profile,
										});
									}

									// Handle subtask in task
									if (task.id === req.body.task.id) {
										task.subtasks.map((subtask) => {
											if (subtask.id === req.body.task.subtask.id) {
												subtask.members.unshift({
													email: req.body.task.subtask.member.email,
													name: req.body.task.subtask.member.name,
													profile: req.body.task.subtask.member.profile,
												});
											}
										});
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Create new or Add new chat to the task
app.post("/MainApp/dashboard/subject/workspace/board/task/chat/send", async (req, res) => {
		const result = await sendChat(req, pusher)
		res.send({
			chat: result
		});
	}
);

// Create new or Add new viewer to the task
app.post("/MainApp/dashboard/subject/workspace/board/task/viewer/add",
	async (req, res) => {
		const result = await addSeen(req, pusher)
		res.send({
			viewer: result
		});
	}
);

// ######################## GET ROUTES #########################
// Gets all user
app.get("/", async (req, res) => {
	res.send(await prisma.accounts.findMany());
});

// Get all verified users
app.get("/verifiedUsers", async (req, res) => {
	log(`Getting ${req.query.count} verified users`)
	const result = await prisma.accounts.findMany({
		where: {
			verified: {
				equals: true,
			},
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			profile: true
		},
		take: parseInt(req.query.count)
	})
	log(`Sending ${result.length} verified users`)
	res.send(result);
});

// verify email of user
app.get("/verification/:id", async (req, res) => {
	const userA = await user(req.params.id);
	if (userA.verified) {
		res.render("verified");
	} else {
		pusher.trigger(`${userA.id}`, "emailVerified", {
			verified: true,
		});

		userA.verified = true;
		await userFinal(userA);
		res.render("verification");
	}
});

// resend verification mail to user email
app.get("/reverify/:id", async (req, res) => {
	const userA = await user(req.params.id);
	let resend = true;
	sgMail
		.send(
			newMsg(
				userA.email,
				`${userA.firstName} ${userA.lastName}`,
				`${backURI}/verification/${userA.id}?email=${userA.email}`
			)
		)
		.then((res) => {
			console.log(`Email verification sent to ${userA.email}, ${res}`);
		})
		.catch((err) => {
			console.error(err);
			resend = false;
		});
	res.send({
		resend,
	});
});

// get only the profile based on the id of the user
app.get('/profile', async (req, res) => {
	const profile = await getProfile(req)
	res.send({
		profile
	})
})

// Get all the user's notifications
app.get("/:id/notifications", async (req, res) => {
	const userA = await user(req.params.id);
	res.send({
		notifications: userA.notifications,
	});
});

// Get the user and then update its lastActive to the current DateTime
app.get("/Signin/active", async (req, res) => {
	const userA = await prisma.accounts.findFirst({
		where: {
			email: {
				equals: req.query.email,
			},
		},
	});
	userA.lastActive = new Date();
	userFinal(userA);
	res.send({ updated: true });
});

// Gets only password to sign in
app.get("/Signin", async (req, res) => {
	const pass = await prisma.accounts.findFirst({
		select: {
			password: true,
		},
		where: {
			email: {
				equals: req.query.email,
			},
		},
	});
	res.send(pass ? pass : { password: "" });
});

// Gets the user based on the email
app.post("/validUser", async (req, res) => {
	const user = await prisma.accounts.findFirst({
		where: {
			email: {
				equals: req.body.email,
			},
		},
	});
	res.send({
		user,
	});
});

// Get the metadata of the workspace member
app.post("/MainApp/subject/workspace/member/updates", async (req, res) => {
	const result = await getUpdateMembersData(req, prisma)
	res.send({
		members: result.members
	});
});

// Gets the user based on the email and send all information except subjects, notification, invitations, lastActive
app.get("/viewUser", async (req, res) => {
	const resut = await viewUser(req, prisma)
	res.send({
		user: resut.user
	});
});

// Set the notification isRead to true and return it
app.get("/User/notification", async (req, res) => {
	const result = await readNotification(req)
	res.send({
		id: result.id,
	});
});

// ###################### PUT ROUTES #####################
// Update the profile pic
app.put("/validUser/edit/profile", async (req, res) => {
	const userA = await user(req.body.ids.user);
	userA.profile = req.body.user.profile;
	const userFinalCopy = await userFinal(userA);
	res.send({
		profile: userFinalCopy.profile,
	});
});

// Update user basic information
app.put('/MainApp/myprofile/basic/edit', async (req, res) => {
	const result = await updateUser(req)
	res.send({
		userData: result
	})
})

// Update the useHint setting of the user
app.put("/User/edit/useHint", async (req, res) => {
	const userA = await user(req.body.ids.user);
	userA.useHint = req.body.useHint;
	const finalUser = await userFinal(userA);
	res.send({
		useHint: req.body.useHint,
	});
});

// Update the password of the user
app.put('/User/edit/password', async (req, res) => {
	console.log('Changing password')
	const userA = await user(req.body.ids.user)
	userA.password = req.body.password
	const finalUser = await userFinal(userA)
	console.log("Changed password");
	res.send({
		password: finalUser.password ? finalUser.password : ''
	})
})

// Update the subject's meta data based on the subjectID
app.put("/MainApp/edit/subject", async (req, res) => {
	console.log('Editing subject')
	const userA = await user(req.body.ids.user)
	userA.notifications.unshift(req.body.notification);
	userA.subjects.every((subject) => {
		if (subject.id === req.body.subject.id) {
			subject.color = req.body.subject.color;
			subject.isFavorite = req.body.subject.isFavorite;
			subject.name = req.body.subject.name;
			return false;
		}
		return true;
	});
	const finalUser = await userFinal(userA)
	console.log("Edited subject")
	res.send({
		subject: req.body.subject,
	});
});

// Update the subject a TRUNCATION of the subject
app.put("/MainApp/truncate/subject", async (req, res) => {
	const userA = await user(req.body.ids.user);
	let subjectToSend = {};
	userA.subjects.every((subject) => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces = [];
			subjectToSend = subject;
			return false;
		}
		return true;
	});
	const finalUser = await userFinal(userA);
	res.send({
		subject: subjectToSend,
	});
});

// update the workspace by userID, subjectID, workspaceID
app.put("/MainApp/subject/workspace/edit", async (req, res) => {
	console.log('Editing workspace')
	const userA = await user(req.body.ids.user);
	userA.subjects.every((subject) => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces.every((workspace) => {
				if (workspace.id === req.body.workspace.id) {
					workspace.color = req.body.workspace.color;
					workspace.isFavorite = req.body.workspace.isFavorite;
					workspace.name = req.body.workspace.name;
					return false;
				}
				return true;
			});
			return false;
		}
		return true;
	});

	await userFinal(userA)
	console.log("Edited workspace")
	res.send({
		workspace: {
			color: req.body.workspace.color,
			isFavorite: req.body.workspace.isFavorite,
			name: req.body.workspace.name,
		},
	});
});

// update the board by userID, subjectID, workspaceID, and boardID
app.put("/MainApp/subject/workspace/board/edit", async (req, res) => {
	const userA = await user(req.body.ids.user);
	userA.subjects.every((subject) => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces.every((workspace) => {
				if (workspace.id === req.body.ids.workspace) {
					workspace.boards.every((board) => {
						if (board.id === req.body.board.id) {
							board.color = req.body.board.color;
							board.name = req.body.board.name;
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
	await userFinal(userA);
	res.send({
		board: {
			name: req.body.board.name,
			color: req.body.board.color,
		},
	});
});

// Update a task
app.put('/MainApp/dashboard/subject/workspace/board/task/edit', async (req, res) => {
	const result = await updateTask(req, pusher)
	res.send({
		task: result.task
	})
})

// Leave the workspace
app.put('/MainApp/subject/workspace/leave', async (req, res) => {
	console.log('leaving the workspace')
	let empty = false
	let subjectToSend

	const accs = await getAllMembers([req.body.ids.userA, req.body.ids.userB])

	/** The user */
	const userA = accs[0].id === req.body.ids.userA ? accs[0] : accs[1]

	/** The owner of the workspace */
	const userB = userA.id === accs[0].id ? accs[1] : accs[0]

	// check if when the workspace is deleted if the subject is empty or not, if empty make it owned else let it be
	if (userA.subjects.filter(subject => subject.id !== req.body.ids.subject).length == 0) {
		empty = true
		userA.subjects.every(subject => { 
			if (subject.id === req.body.ids.subject) {
				subject.owned = true
				subject.createdBy = `${userA.firstName} ${userA.lastName}`
				subject.isFavorite = false
				subject.workspaces = []
				subject.id = bcrypt.hashSync(`${subject.name}${userA.id}${new Date()}`, 13)
				subjectToSend = subject
				return false
			}
			return true
		})
	} else {
		// if not empty then just remove the workspace
		userA.subjects.every(subject => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces = subject.workspaces.filter(workspace => workspace.id !== req.body.ids.workspace)
				return false
			}
			return true
		})
	}

	let workspaceName = ""
	let membersID = []

	// update the workspace members and admins of the owner of the workspace
	userB.subjects.every((subject) => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces.every((workspace) => {
				if (workspace.id === req.body.ids.workspace) {
					workspaceName = workspace.name

					// removing the user in the workspace members of the w-owner
					workspace.members = workspace.members.filter((member) => {
						if (member.email !== userA.email) {
							return member;
						}
					})
					// removing the user in the workspace admins of the w-owner
					workspace.admins = workspace.admins.filter(admin => admin.id !== userA.id)

					workspace.boards.forEach(board => {
						board.tasks.forEach(task => {
							// remove the the leaving user as an assignee on the tasks
							task.members = task.members.filter(member => member.id !== userA.id)

							task.subtasks.forEach(subtask => {
								// remove the tleaving user as an assignee on the subtasks
								subtask.members = subtask.members.filter(member => member.id !== userA.id)
							})
						})
					})

					workspaceToSend = workspace

					// remove temporarily the owner
					let temp = workspace.members.filter(member => member.id !== userB.id)

					if (temp.length != 0) {
						temp.forEach(member => {
							membersID = [...membersID, member.id]
						})
					}
					return false;
				}
				return true;
			});
			return false;
		}
		return true;
	})

	let workspaceMembers = []
	if (membersID.length != 0) {
		workspaceMembers = await getAllMembers(membersID)
	}

	// add new user-notification for all members of the workspace user about leaving
	const newNotif = newNotification(
		`${userA.firstName} ${userA.lastName} leaved ${workspaceName}`,
		false,
		false,
		"",
		"Dashboard",
		"Subjects",
		"",
		true,
		userB.id
	);
	userB.notifications.unshift(newNotif)

	console.log('adding notification to members')
	workspaceMembers.forEach(member => {
		member.notifications.unshift(newNotif)
	})
	console.log('adding notification to members done')

	// updating all workspaces of other members too
	workspaceMembers.forEach(member => {
		console.log(`Updating ${member.firstName} ${member.lastName}`);
		member.subjects.every(subject => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every(workspace => {
					if(workspace.id === req.body.ids.workspace) {
						// remove the leaving user on the workspace members
						workspace.members = workspace.members.filter(member => member.id !== userA.id)

						//remove the leaving user on the workspace admins
						workspace.admins = workspace.admins.filter(admin => admin.id !== userA.id)

						workspace.boards.forEach(board => {
							board.tasks.forEach(task => {
								// remove the leaving user as an assignee on the tasks
								task.members = task.members.filter(member => member.id !== userA.id)

								task.subtasks.forEach(subtask => {
									// remove the leaving user as an assignee on the subtasks
									subtask.members = subtask.members.filter(member => member.id !== userA.id)
								})
							})
						})
						return false
					}
					return true
				})
				return false
			}
			return true
		})
	})

	// finalize changes
	if (workspaceMembers.length != 0) {
		console.log('Finalizing updates to all members')
		await manyUserFinal([userA, userB, ...workspaceMembers])
	} else {
		console.log('Finalizing updates on the owner and leaver')
		await manyUserFinal([userA, userB])
	}

	pusher.trigger(`${userB.id}`, "memberLeaved", {
		workspace: {
			id: req.body.ids.workspace,
			member: {
				id: userA.id
			}
		},
		notification: newNotif,
	})

	if (membersID.length != 0) {
		workspaceMembers.forEach(member => {
			pusher.trigger(`${member.id}`, "memberLeaved", {
				workspace: {
					id: req.body.ids.workspace,
					member: {
						id: userA.id
					},
				},
				notification: newNotif,
			});
		})
	}

	console.log('leaved workspace');

	res.send({
		empty,
		subject: subjectToSend,
		workspaceID: req.body.ids.workspace
	});
})

// Update the task based on SID, WID, BID and TID
app.put('/MainApp/subject/workspace/board/task/edit', async (req, res) => {
	console.log('Editing task')
	const userA = await user(req.body.ids.user)
	let taskToSend
	userA.subjects.every(subject => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces.every(workspace => {
				if (workspace.id === req.body.ids.workspace) {
					workspace.boards.every(board => {
						if (board.id === req.body.ids.board) {
							board.tasks.every(task => {
								if (task.id === req.body.task.id) {
									task.name = req.body.task.name
									task.isFavorite = req.body.task.isFavorite
									task.level = req.body.task.level
									taskToSend = task
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
	await userFinal(userA)
	console.log('Edited Task')
	res.send({
		error: taskToSend ? false : true,
		task: taskToSend
	})
})

// Update the task status based on the subjectID, workspaceID and boardID and taskID
app.put(
	"/MainApp/edit/subject/workspace/board/task/status",
	async (req, res) => {
		const userA = await user(req.body.ids.user);

		// change the status of the task and remove it on its previous board
		userA.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.every((board) => {
							if (board.id === req.body.ids.board) {
								board.tasks.every((task) => {
									if (task.id === req.body.task.id) {
										board.tasks = board.tasks.filter(
											(task2) => task2.id !== task.id
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
				return false;
			}
			return true;
		});

		// add the task on the selected board name (board name cannot be repeated on same workspace)
		userA.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.every((board) => {
							if (board.name === req.body.task.status) {
								board.tasks.unshift(req.body.task);
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
		await userFinal(userA);
		res.send({
			task: req.body.task,
		});
	}
);

// ###################### DELETE ROUTES ##################
// Remove or delete a notification in user
app.delete("/User/delete/notification", async (req, res) => {
	const result = await deleteNotification(req)
	res.send({
		id: result.id
	});
});

// Remove or delete all notification in user
app.delete("/User/delete/all/notification", async (req, res) => {
	const result = await deleteAllNotification(req)
	res.send({
		notifications: result,
	});
});

// Remove or delete a member in subtask and in task with isSubtask true and task id equals subtask id
app.delete(
	"/MainApp/subject/workspace/board/task/subtask/delete/member",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									// handle subtask as task
									if (task.id === req.body.task.subtask.id) {
										task.members = task.members.filter(
											(member) =>
												member.email !== req.body.task.subtask.member.email
										);
									}

									// handle subtask in task
									if (task.id === req.body.task.id) {
										task.subtasks.map((subtask) => {
											if (subtask.id === req.body.task.subtask.id) {
												subtask.members = subtask.members.filter(
													(member) =>
														member.email !== req.body.task.subtask.member.email
												);
											}
										});
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Remove or delete a subtask and in task with same subtask id
app.delete(
	"/MainApp/subject/workspace/board/task/delete/subtask",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							// Remove task with task.id === subtask.id
							board.tasks = board.tasks.filter(
								(task) => task.id != req.body.task.subtask.id
							);
							// Remove subtask by id
							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									if (task.id === req.body.task.id) {
										task.subtasks = task.subtasks.filter(
											(subtask) => subtask.id != req.body.task.subtask.id
										);
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Remove or delete a task (parent)
app.delete("/MainApp/subject/workspace/board/task/delete", async (req, res) => {
	const result = await deleteTask(req, pusher)
	res.send({
		taskID: result.taskID
	});
});

// Remove or delete a member in task
app.delete(
	"/MainApp/subject/workspace/board/task/delete/member",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									if (task.id === req.body.task.id && !task.isSubtask) {
										task.members = task.members.filter(
											(member) => member.email !== req.body.task.member.email
										);
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Remove or delete a chat in task
app.delete(
	"/MainApp/subject/workspace/board/task/delete/chat",
	async (req, res) => {
		const userA = await user(req.body.ids.user);
		userA.subjects.map((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.map((workspace) => {
					if (workspace.id === req.body.ids.workspace) {
						workspace.boards.map((board) => {
							if (board.name === req.body.task.status) {
								board.tasks.map((task) => {
									// handle subtask as task
									if (task.id === req.body.task.id) {
										task.conversations = task.conversations.filter(
											(convo) => convo.id !== req.body.task.conversation.id
										);
									}
								});
							}
						});
					}
				});
			}
		});
		res.send(await userFinal(userA));
	}
);

// Cancel an invitation
app.delete("/MainApp/subject/workspace/invitation/cancel", async (req, res) => {
	console.log("canceling an invitation");
	const accs = await getAllMembers([req.body.ids.userA, req.body.ids.userB]);

	/** The inviter user */
	const userA = accs[0].id === req.body.ids.userA ? accs[0] : accs[1]

	/** The invited user */
	const userB = accs[0].id === userA.id ? accs[1] : accs[0]

	let invitationa = {
		id: "",
		workspaceName: "",
	};
	userB.invitations.every((invitation) => {
		if (invitation.id === req.body.ids.invitation) {
			invitationa = {
				id: invitation.id,
				workspaceName: invitation.workspace.name,
			};
			return false;
		}
		return true;
	});

	// remove the invitation in both user
	userA.invitations = userA.invitations.filter(
		(invitation) => invitation.id !== req.body.ids.invitation
	);
	userB.invitations = userB.invitations.filter(
		(invitation) => invitation.id !== req.body.ids.invitation
	);

	// add new user-notification for the invited user about invitation canceled
	const newNotif = newNotification(
		`${userA.firstName} ${userA.lastName} invitation to '${invitationa.workspaceName}' is canceled`,
		true,
		false,
		"",
		"Dashboard",
		"Subjects",
		"",
		true,
		userB.id
	);
	userB.notifications.unshift(newNotif);

	await manyUserFinal([userA, userB])

	pusher.trigger(`${userB.id}`, "invitationCanceled", {
		invitation: invitationa,
		notification: newNotif,
	});

	console.log("canceled an invitation");

	res.send({
		invitationID: invitationa.id,
	});
});

// Remove the accepted/rejected invitation
app.delete("/MainApp/subject/workspace/invitation/remove", async (req, res) => {
	const result = await removeInvitation(req)
	res.send({
		invitationID: result
	});
});

// Reject and delete the invitation
app.delete("/MainApp/subject/workspace/invitation/reject", async (req, res) => {
	const result = await rejectInvitation(req, pusher)
	res.send({
		invitationID: result.invitationID
	});
});

// Remove or delete a member in workspace
app.delete("/MainApp/subject/workspace/member/delete", async (req, res) => {
	const result = await kickMember(req, pusher)
	res.send({
		memberID: result.memberID
	});
});

// Remove or delete a board (customed) in workspace
// Todo, In progress and Done cannot be deleted
app.delete("/MainApp/subject/workspace/delete/board", async (req, res) => {
	const userA = await user(req.body.ids.user);
	userA.subjects.every((subject) => {
		if (subject.id === req.body.ids.subject) {
			subject.workspaces.every((workspace) => {
				if (workspace.id === req.body.ids.workspace) {
					workspace.boards = workspace.boards.filter(
						(board) => board.id !== req.body.ids.board
					);
					return false;
				}
				return true;
			});
			return false;
		}
		return true;
	});
	await userFinal(userA);
	res.send({
		id: req.body.ids.board,
	});
});

// Remove or delete an admin in workspace
app.delete("/MainApp/subject/workspace/admin/remove", async (req, res) => {
	const result = await demoteAdmin(req, pusher)
	res.send({
		adminID: result.adminID
	});
});

// Remove or delete workspace in subject
app.delete("/MainApp/subject/workspace/delete", async (req, res) => {
	const result = await deleteWorkspace(req, pusher)
	res.send({
		id: result
	});
});

// Remove or delete subject in account
app.delete("/MainApp/dashboard/subject/delete", async (req, res) => {
	const result = await deleteSubject(req, pusher)
	res.send({
		subjectID: result
	});
});

app.get('/reset/password/check', async (req, res) => {
	console.log('Check email for reseting')
	const userA = await prisma.accounts.findFirst({
		select: {
			id: true,
			email: true
		},
		where: {
			email: {
				equals: req.query.email,
			},
		},
	})
	sgMail.send(resetMsg(userA.email, '', `${backURI}/reset/password/confirm?id=${userA.id}`))
		.then((res) => {
			console.log(`Reset password email sent to ${userA.email}, ${res}`);
		})
		.catch((err) => {
			console.error(err);
    })

	console.log("Checked email for reseting")
	res.send(userA ? userA : { id: '', email: '' });
})

app.get('/reset/password/confirm', (req, res, next) => {
	pusher.trigger(`${req.query.id}`, "resetPasswordConfirm", {})
	res.redirect(301, `${backURIfront}/reset?id=${req.query.id}`)
	next()
})

// TESTS
app.put('/tester/updatemany', async (req, res) => {
	res.send(await getAllMembers([req.body.ids.userA, req.body.ids.userB]))
})

app.get("/MainApp/:SubjectName", (req, res) => {
	res.send({
		data: req.params.SubjectName,
		error: false,
		message: "OK",
	});
});

app.listen(port, function () {
	console.log("Started application backend on port %d", port);
});