const { newNotification, log } = require("../../constants");
const { user, userFinal, manyUserFinal } = require("../user");
const { getAllMembers } = require("./Member");
const bcrypt = require("bcryptjs");

module.exports = {
	deleteWorkspace2: async (userID, verified, subjectID, pusher) => {
		console.log("#####");
		console.log("Deleting a workspace/s (sub process)");

		if (verified) {
			// get all members
			let membersID = []
      let workspaceMembers = []
			let workspaceOwnership = []
			let subjectName = ''

			console.log("Checking for workspace members");
			const userA = await user(userID);
			userA.subjects.every((subject) => {
				if (subject.id === subjectID) {
					subjectName = subject.name
          subject.workspaces.forEach(workspace => {
            log(`Processing: ${workspace.name}`)
            // remove the owner
            let temp = workspace.members.filter(member => member.id !== userA.id);

            if (temp.length != 0) {
              log(`Workspace ${workspace.name} member/s detected`)
              temp.forEach((member) => {
                if (!membersID.includes(member.id)) {
                  log(`Member: ${member.name}`)
                  membersID = [...membersID, member.id]
                }
              });
            } else {
              log('No workspace member/s detected')
            }
					});
					return false;
				}
				return true;
      });
      console.log("Checking for workspace members done");

			if (membersID.length != 0) {
				console.log("Fetching workspace members");
				workspaceMembers = await getAllMembers(membersID);
				console.log("Fetching workspace members done");

				// build a new user-notification for all members to be notified that the workspace they are part of is deleted
        log('Building user-notification')
        let newNotif = newNotification(
					`${userA.firstName} ${userA.lastName} (owner) deleted the subject '${subjectName}'`,
					false,
					false,
					"",
					"Dashboard",
					"workspaces",
					"",
					true,
					userA.id
				)
        log("Building user-notification done");

				console.log("Updating member:");
				workspaceMembers.forEach((member) => {
					console.log("===");
					console.log(`${member.firstName} ${member.lastName}`);
					member.subjects.every((subject) => {
						if (subject.id === subjectID) {
							let subjectIDOld = subject.id;
							log('Workspace/s deleted')
							subject.workspaces = []

							console.log("setting subject ownership");
							subject.owned = true;
							subject.id = bcrypt.hashSync(`${subject.name}${member.id}${new Date()}`,13)
							subject.createdBy = `${member.firstName} ${member.lastName}`;
							console.log("setting subject ownership: owned");

							workspaceOwnership = [
								...workspaceOwnership,
								{
									id: member.id,
									subjectID: {
										old: subjectIDOld,
										new: subject.id,
									}
								},
							];
							return false;
						}
						return true;
					})

					console.log("Adding notification");
					member.notifications.unshift(newNotif);
          console.log("Adding notification done");
          log('===')
				});
				console.log("Updating members done");

				console.log("Final updating");
				if (membersID.length != 0) {
					console.log("Finalizing updates to all workspace members");
					await manyUserFinal(workspaceMembers);
				}
				console.log("Finalizing updates done");

				console.log("Notifying workspace members");
				workspaceOwnership.forEach((member) => {
					pusher.trigger(`${member.id}`, "workspaceOwnerDeletedSubject", {
						subjectID: member.subjectID,
						notification: newNotif,
					});
				});
				console.log("Notifying workspace members done");
			}
		}
		console.log("Deleting a workspace/s done (sub process)");
		console.log("#####");
	},
};
