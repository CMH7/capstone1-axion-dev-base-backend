const {
	newNotification,
} = require("../../../constants");
const { manyUserFinal } = require("../../user");
const { getAllMembers } = require("./listOfMembers");

module.exports = {
	demoteAdmin: async (req, pusher) => {
		console.log("--------------------------------------------");
    console.log("Demoting an admin");
    const ids = req.body.ids
		let membersID = [];
		let workspaceMembers = [];
		let workspaceName;

		const accs = await getAllMembers([ids.userA, ids.userB]);
		/** userA is the user demoting an admin */
		const userA = accs[0].id === ids.userA ? accs[0] : accs[1];

		/** userB is the user being demoted as a member */
		const userB = userA.id === accs[0].id ? accs[1] : accs[0];

		// removing the userB to the workspace admins of the userA
		userA.subjects.every((subject) => {
			if (subject.id === ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === ids.workspace) {
						// removing the demoter in the members first
						let temp = workspace.members.filter(
							(member) => member.id !== userA.id
						);

            // removing the demoted admin
						temp = temp.filter((member) => member.id !== userB.id);

						// setting the membersID
						if (temp.length != 0) {
							temp.forEach((member) => {
								membersID = [...membersID, member.id];
							});
						}

						// add the userB to the admins of userA
						workspace.admins = workspace.admins.filter(admin => admin.id !== userB.id )

						workspaceName = workspace.name;
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
		});

		userB.subjects.every((subject) => {
			if (subject.id === ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === ids.workspace) {
						workspace.admins = workspace.admins.filter(admin => admin.id !== userB.id)
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
		});

		if (membersID.length != 0) {
			workspaceMembers = await getAllMembers(membersID);
		}

		// building a new user-notification for the adder and all workspace members to be notified that the userB promotion as an admin
		const newNotif = newNotification(
			`${userB.firstName} ${userB.lastName} is removed as admin by ${userA.firstName} ${userA.lastName} in ${workspaceName}!`,
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
			`You're removed as admin by ${userA.firstName} ${userA.lastName} in ${workspaceName}!`,
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
				if (subject.id === ids.subject) {
					subject.workspaces.every((workspace) => {
						if (workspace.id === ids.workspace) {
							workspace.admins = workspace.admins.filter(admin => admin.id !== userB.id)
							return false;
						}
						return true;
					});
					return false;
				}
				return true;
			});
		});

		console.log("adding notification to members: remove admin");
		userB.notifications.unshift(newNotif2);
		workspaceMembers.forEach((member) => {
			member.notifications.unshift(newNotif);
		});
		console.log("adding notification to members: remove admin done");

		if (workspaceMembers.length != 0) {
			console.log("Finalizing Updates on all members: remove admin");
			await manyUserFinal([userA, userB, ...workspaceMembers]);
		} else {
			console.log("Finalizing Updates on remover and removed member: remove admin");
			await manyUserFinal([userA, userB]);
		}

		pusher.trigger(`${userB.id}`, "adminRemoved", {
			notification: newNotif2,
			subjectID: ids.subject,
			workspaceID: ids.workspace,
			adminID: userB.id,
		});

		if (membersID.length != 0) {
			workspaceMembers.forEach((member) => {
				pusher.trigger(`${member.id}`, "adminRemoved", {
					notification: newNotif,
					subjectID: ids.subject,
					workspaceID: ids.workspace,
					adminID: userB.id,
				});
			});
		}
		console.log("Demoting an admin done");
		console.log("--------------------------------------------");

		return {
			adminID: userB.id,
		};
	},
};
