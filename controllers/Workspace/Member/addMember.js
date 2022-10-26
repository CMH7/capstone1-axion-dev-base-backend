const { newNotification, newSubject, newWorkspace, log } = require("../../../constants");
const { manyUserFinal } = require("../../user");
const { getAllMembers } = require("./listOfMembers")


module.exports = {
	newMember: async (req, pusher) => {
		console.log("----------------------------");
		console.log("accepting an invitation");
		const ids = req.body.ids;
		let subjectToSend;
		let workspaceToSend;
		let subjectb;
		let workspacea;
		let membersID = [];
		let workspaceMembers = [];

		console.log("Getting users data");
		const accs = await getAllMembers([ids.userA, ids.userB]);
		/** userA is the user being invited */
		const userA = accs[0].id === ids.userA ? accs[0] : accs[1];

		/** userB is the inviter */
		const userB = userA.id === accs[0].id ? accs[1] : accs[0];
		console.log("Getting users data done");

		console.log("Removing the invitation on invited and inviter");
		let invitationa;
		userA.invitations = userA.invitations.filter(
			(invitation) => invitation.id !== ids.invitation
		);
		userB.invitations.every((invitation) => {
			if (invitation.id === ids.invitation) {
				invitation.status = "accepted";
				invitationa = invitation;
				return false;
			}
			return true;
		});
		console.log("Removing the invitation on invited and inviter don");

		// building a new user-notification for the owner and all workspace members to be notified that the invited user accepted the invitation
		console.log('Building a new notification');
		const newNotif = newNotification(
			`${userA.firstName} ${userA.lastName} joined in ${invitationa.workspace.name}!`,
			true,
			false,
			"",
			"Dashboard",
			"Boards",
			"",
			true,
			userA.id
		);
		userB.notifications.unshift(newNotif);
		console.log("Building a new notification done");

		// adding the invited user to the workspace members of the inviter user
		console.log("Adding the userA to the workspace members of the userB");
		userB.subjects.every((subject) => {
			if (subject.id === ids.subject) {
				subject.workspaces.every((workspace) => {
					if (workspace.id === ids.workspace) {
						workspace.members.push(req.body.workspace.member);

						// removing the owner/admin in the members first
						let temp = workspace.members.filter(
							(member) => member.id !== userB.id
						);

						// removing the newly added member
						console.log("Checking workspace members");
						temp = temp.filter((member) => member.id !== userA.id);

						if (temp.length != 0) {
							console.log("Workspace member/s detected");
							temp.forEach((member) => {
								membersID = [...membersID, member.id];
							});
						} else {
							console.log("No workspace member/s detected");
						}

						workspacea = workspace;
						subjectb = subject;
						return false;
					}
					return true;
				});
				return false;
			}
			return true;
		});

		if (membersID.length != 0) {
			console.log("Getting workpsace member/s data");
			workspaceMembers = await getAllMembers(membersID);
			console.log("Getting workpsace member/s data done");

			console.log("adding notification to members");
			workspaceMembers.forEach((member) => {
				console.log(member.firstName);
				member.notifications.unshift(newNotif);
			});
			console.log("adding notification to members done");
		}


		if (workspaceMembers.length != 0) {
			// updating all workspace members list too
			console.log("Updating members");
			workspaceMembers.forEach((member) => {
				console.log(`Updating: ${member.firstName} ${member.lastName}`);
				member.subjects.every((subject) => {
					if (subject.id === req.body.ids.subject) {
						subject.workspaces.every((workspace) => {
							if (workspace.id === req.body.ids.workspace) {
								workspace.members.push(req.body.workspace.member);
								return false;
							}
							return true;
						});
						return false;
					}
					return true;
				});
			});
			console.log("Updating members done");
		}

		// Check if the subject is already existing
		console.log("Checking subject existence");
		let existing = false;
		userA.subjects.every((subject) => {
			if (subject.id === subjectb.id) {
				console.log("Subject existing");
				existing = true;
				return false;
			}
			return true;
		});

		// if existing just add the new workspace else create and add the new workspace
		if (existing) {
			userA.subjects.every((subjecta) => {
				if (subjecta.id === subjectb.id) {
					workspaceToSend = {
						members: workspacea.members,
						boards: workspacea.boards,
						admins: workspacea.admins,
						color: workspacea.color,
						id: workspacea.id,
						isFavorite: workspacea.isFavorite,
						name: workspacea.name,
						owned: false,
						createdBy: workspacea.createdBy
					}
					subjecta.workspaces.push(workspaceToSend);
					subjectToSend = {
						name: subjecta.name,
						id: subjecta.id,
						color: subjecta.color,
						createdBy: subjecta.createdBy,
						owned: subjecta.owned,
						isFavorite: subjecta.isFavorite,
					};
					return false;
				}
				return true;
			});
		} else {
			log('Subject not existing: Creating Subject')
			userA.subjects.push(
				newSubject(
					subjectb.color,
					subjectb.id,
					subjectb.name,
					false,
					subjectb.createdBy
				)
			);
			log('Creating subject done')
			userA.subjects.every((subjecta) => {
				if (subjecta.id === subjectb.id) {
					workspaceToSend = {
						members: workspacea.members,
						boards: workspacea.boards,
						admins: workspacea.admins,
						color: workspacea.color,
						id: workspacea.id,
						isFavorite: workspacea.isFavorite,
						name: workspacea.name,
						owned: false,
						createdBy: workspacea.createdBy,
					};
					subjecta.workspaces.push(workspaceToSend);
					subjectToSend = {
						name: subjecta.name,
						id: subjecta.id,
						color: subjecta.color,
						createdBy: subjecta.createdBy,
						owned: subjecta.owned,
						isFavorite: subjecta.isFavorite,
					};
					return false;
				}
				return true;
			});
		}

		console.log("Finalizing updates");
		if (workspaceMembers.length != 0) {
			console.log(
				"Finalizing updates in all members: add member/ accept invitation"
			);
			let users = await manyUserFinal([userA, userB, ...workspaceMembers]);
			users.forEach((useraa) => {
				console.log(`${useraa.firstName} ${useraa.lastName}`);
			});
		} else {
			console.log("Finalizing updates in the invited user and inviter user");
			await manyUserFinal([userA, userB]);
		}

		console.log("Realtime updating inviter");
		pusher.trigger(`${userB.id}`, "invitationAccepted", {
			notification: newNotif,
			invitationID: ids.invitation,
			subjectID: ids.subject,
			workspaceID: ids.workspace,
			member: {
				email: userA.email,
				name: `${userA.firstName} ${userA.lastName}`,
				profile: userA.profile,
				id: userA.id,
			},
		});
		console.log("Realtime updating inviter done");

		if (workspaceMembers.length != 0) {
			console.log("Realtime updating other members");
			pusher.trigger(membersID, "newMember", {
				notification: newNotif,
				subjectID: ids.subject,
				workspaceID: ids.workspace,
				member: {
					email: userA.email,
					name: `${userA.firstName} ${userA.lastName}`,
					profile: userA.profile,
					id: userA.id,
				},
			});
			console.log("Realtime updating other members done");
		}

		console.log("accepted an invitation");
		console.log("----------------------------");

		return {
			subjectToSend,
			workspaceToSend,
			invitationID: req.body.ids.invitation,
		};
	}
}