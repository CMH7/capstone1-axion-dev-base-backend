const { newNotification } = require("../../../constants");
const { manyUserFinal } = require("../../user");
const { getAllMembers } = require("./listOfMembers");
const bcrypt = require('bcryptjs')

module.exports = {
  kickMember: async (req, pusher) => {
    console.log("--------------------------------");
		console.log("Removing a member");
		let workspaceName = "";

		const accs = await getAllMembers([
			req.body.ids.user,
			req.body.workspace.member.id,
		]);
		/** Owner or admin of the workspace */
		const userA = accs[0].id === req.body.ids.user ? accs[0] : accs[1];

		/** The member that will be removed */
		const userB = accs[0].id === userA.id ? accs[1] : accs[0];

		// get all members of the workspace except userA and userB
		// remove the userA on the list of the members
		let membersID = [];
		let workspaceMembers = [];
		console.log("Checking members");
		userA.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === req.body.workspace.id) {
						workspaceName = workspace.name;
						let temp = workspace.members.filter(
							(member) => member.id !== userA.id
						);
						temp = temp.filter((member) => member.id !== userB.id);
						membersID = [
							...membersID,
							...temp.map((member) => {
								return member.id;
							}),
						];
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
		});
		console.log("Checking members done");

		if (membersID.length != 0) {
			console.log("Getting members");
			workspaceMembers = await getAllMembers(membersID);
			console.log("Getting members done");
		}

		// building a new user-notification to notify all workspace members that a member is removed in the workspace
		console.log("Building notification");
		const newNotif = newNotification(
			`${req.body.workspace.member.name} is removed in ${workspaceName}`,
			false,
			false,
			"",
			"",
			"",
			"",
			true,
			userA.id
		);

		const newNotif2 = newNotification(
			`You are removed from ${workspaceName}`,
			false,
			false,
			"",
			"",
			"",
			"",
			true,
			userB.id
		);
		console.log("building notification done");

		// remove the member
		console.log("Removing member on the remover user");
		userA.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === req.body.workspace.id) {
						workspace.members = workspace.members.filter(
							(member) => member.id != req.body.workspace.member.id
						);
						workspace.admins = workspace.admins.filter(
							(admin) => admin.id !== req.body.workspace.member.id
						);
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
		});
		console.log("Removing member on the remover user done");

		console.log("Removing member on the other members");
		workspaceMembers.forEach((member) => {
			console.log(`Updating: ${member.firstName} ${member.lastName}`);
			member.subjects.every((subject) => {
				if (subject.id === req.body.ids.subject) {
					subject.workspaces.every((workspace) => {
						if (workspace.id === req.body.workspace.id) {
							workspace.members = workspace.members.filter(
								(member) => member.id !== req.body.workspace.member.id
							);
							workspace.admins = workspace.admins.filter(
								(admin) => admin.id !== req.body.workspace.member.id
							);
							return false;
						}
						return true;
					});
					return false;
				}
				return true;
			});
		});
		console.log("Removing member on the other members done");

		console.log("Removing the workspace on the removed member");
		userB.subjects.every((subject) => {
			if (subject.id === req.body.ids.subject) {
				subject.workspaces = subject.workspaces.filter(
					(workspace) => workspace.id !== req.body.workspace.id
				);
				if (subject.workspaces.length == 0) {
					subject.createdBy = `${userB.firstName} ${userB.lastName}`;
					subject.id = bcrypt.hashSync(
						`${subject.name}${userB.id}${new Date()}`
					);
					subject.owned = true;
					subject.workspaces = [];
				}
				return false;
			}
			return true;
		});
		console.log("Removing the workspace on the removed member done");

		console.log("Adding notification");
		userA.notifications.unshift(newNotif);
		userB.notifications.unshift(newNotif2);
		workspaceMembers.forEach((member) => {
			member.notifications.unshift(newNotif);
		});
		console.log("Adding notification done");

		if (membersID.length != 0) {
			console.log("Finalizing updates on all members");
			await manyUserFinal([userA, userB, ...workspaceMembers]);
		} else {
			console.log("Finalizing updates on the remover");
			await userFinal(userA);
		}
		console.log("Finalization complete");

		console.log("Notifying other members realtime");
		pusher.trigger(`${userB.id}`, "memberRemoved", {
			ids: {
				subject: req.body.ids.subject,
				workspace: req.body.workspace.id,
				member: req.body.workspace.member.id,
			},
			notification: newNotif2,
		});

		workspaceMembers.forEach((member) => {
			pusher.trigger(`${member.id}`, "memberRemoved", {
				ids: {
					subject: req.body.ids.subject,
					workspace: req.body.workspace.id,
					member: req.body.workspace.member.id,
				},
				notification: newNotif,
			});
		});
		console.log("Notifying other members realtime done");

		console.log("Removed member");
    console.log("--------------------------------");
    
    return {
			memberID: req.body.workspace.member.id,
		};
  }
}