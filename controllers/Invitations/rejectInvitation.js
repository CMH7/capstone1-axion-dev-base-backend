const { newNotification } = require("../../constants");
const { manyUserFinal } = require("../user");
const { getAllMembers } = require("../Workspace/Member");


module.exports = {
  rejectInvitation: async (req, pusher) => {
    console.log('-----------------------------------')
    console.log("rejecting an invitation");
    let ids = req.body.ids

    const accs = await getAllMembers([ids.userA, ids.userB])

		/** The invited user */
		const userA = ids.userA === accs[0].id ? accs[0] : accs[1]

		/** The inviter user */
		const userB = userA.id === accs[0].id ? accs[1] : accs[0]

		// update status of the invitation into rejected in userB
		let invitationa;
		userB.invitations.every((invitation) => {
			if (invitation.id === req.body.ids.invitation) {
				invitation.status = "rejected";
				invitationa = invitation;
				return false;
			}
			return true;
		});

		// remove or delete the invitation in the userA
		userA.invitations = userA.invitations.filter(
			(invitation) => invitation.id !== req.body.ids.invitation
		);

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
		userB.notifications.unshift(newNotif);

		await manyUserFinal([userA, userB]);

		// push event to userB
		pusher.trigger(`${userB.id}`, "invitationRejected", {
			invitationID: req.body.ids.invitation,
			notification: newNotif,
		});

    console.log("rejecting an invitation");
    console.log("-----------------------------------");
    
    return {
      invitationID: ids.invitation
    }
  }
}