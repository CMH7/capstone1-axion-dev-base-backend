const {
	newNotification,
	newSubject,
	newWorkspace,
} = require("../../../constants");
const { manyUserFinal } = require("../../user");
const { getAllMembers } = require("./listOfMembers");

module.exports = {
  newAdmin: async (req, pusher) => {
    console.log('--------------------------------------------');
    console.log("Adding an admin");
    let membersID = []
    let workspaceMembers = []
    let workspaceName

		const accs = await getAllMembers([req.body.ids.userA, req.body.ids.userB]);
		/** userA is the user adding a new admin */
		const userA = accs[0].id === req.body.ids.userA ? accs[0] : accs[1];

		/** userB is the user being added as admin */
		const userB = userA.id === accs[0].id ? accs[1] : accs[0];

		// adding the userB to the workspace admins of the userA
		userA.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every((workspace) => {
          if (workspace.id === req.body.ids.workspace) {
						// removing the adder in the members first
						let temp = workspace.members.filter(member => member.id !== userA.id)

            temp = temp.filter(member => member.id !== userB.id)
            
            // setting the membersIS
            if (temp.length != 0) {
              temp.forEach((member) => {
                membersID = [...membersID, member.id];
              });
            }

            // add the userB to the admins of userA
						workspace.admins.push(req.body.admin)

            workspaceName = workspace.name
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
    });
    
    userB.subjects.every(subject => {
      if (subject.id === req.body.ids.subject) {
        subject.workspaces.every(workspace => {
          if (workspace.id === req.body.ids.workspace) {
            workspace.admins.push(req.body.admin)
            return false
          }
          return true
        })
        return false
      }
      return true
    })

		if (membersID.length != 0) {
			workspaceMembers = await getAllMembers(membersID);
		}

		// building a new user-notification for the adder and all workspace members to be notified that the userB promotion as an admin
		const newNotif = newNotification(
			`${userB.firstName} ${userB.lastName} promoted as admin in ${workspaceName}!`,
			true,
			false,
			"",
			"Dashboard",
			"Boards",
			"",
			true,
			userA.id
		);
		
    const newNotif2 = newNotification(
			`You're promoted as admin in ${workspaceName}!`,
			true,
			false,
			"",
			"Dashboard",
			"Boards",
			"",
			true,
			userB.id
		);

		// updating all workspace members list too
		workspaceMembers.forEach((member) => {
			console.log(`Updating ${member.firstName} ${member.lastName}`);
			member.subjects.every((subject) => {
				if (subject.id === req.body.ids.subject) {
					subject.workspaces.every((workspace) => {
						if (workspace.id === req.body.ids.workspace) {
							workspace.admins.push({
                email: req.body.admin.email,
                name: req.body.admin.name,
                id: req.body.admin.id
							});
							return false;
						}
						return true;
					});
					return false;
				}
				return true;
			});
    });
    
    console.log("adding notification to members: add admin");
		userB.notifications.unshift(newNotif2);
		workspaceMembers.forEach((member) => {
			member.notifications.unshift(newNotif);
		});
		console.log("adding notification to members: add admin done");

		if (workspaceMembers.length != 0) {
			console.log("Finalizing Updates on all members: add admin");
			await manyUserFinal([userA, userB, ...workspaceMembers]);
		} else {
			console.log("Finalizing Updates on adder and added: add admin");
			await manyUserFinal([userA, userB]);
		}

		pusher.trigger(`${userB.id}`, "newAdmin", {
			notification: newNotif2,
			subjectID: req.body.ids.subject,
			workspaceID: req.body.ids.workspace,
			admin: {
				email: userB.email,
				name: `${userB.firstName} ${userB.lastName}`,
				id: userB.id,
			},
		});

		if (membersID.length != 0) {
			workspaceMembers.forEach((member) => {
				pusher.trigger(`${member.id}`, "newAdmin", {
					notification: newNotif,
					subjectID: req.body.ids.subject,
					workspaceID: req.body.ids.workspace,
					admin: {
						email: userB.email,
						name: `${userB.firstName} ${userB.lastName}`,
						id: userB.id,
					},
				});
			});
		}
		console.log("adding an admin done");
    console.log("--------------------------------------------");

    return {
      admin: {
        email: req.body.admin.email,
        name: req.body.admin.name,
        id: req.body.admin.id
      }
		};
	},
};
