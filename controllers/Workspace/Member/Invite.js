const { newNotification } = require("../../../constants");
const { user, userFinal, manyUserFinal } = require("../../user");
const { getAllMembers } = require("./listOfMembers");

module.exports = {
  invite: async (req, pusher) => {
		console.log("-------------------------------");
		console.log("creating an invitation");
    const invitation = req.body.invitation;
    
    console.log('Getting users data');
    const accs = await getAllMembers([invitation.from.id, invitation.to.id]);
    
    /** The inviter user*/
    const userA = accs[0].id === invitation.from.id ? accs[0] : accs[1];
    
    /** The invited user */
    const userB = accs[0].id === userA.id ? accs[1] : accs[0];
    console.log('Getting users data done');

    console.log('Adding a new invitation to each users');
		userA.invitations.unshift(req.body.invitation);
		userB.invitations.unshift(req.body.invitation);
    console.log('Adding a new invitation to each users done');

    console.log('Addding notification');
		const newNotif = newNotification(
			`${userA.firstName} ${userA.lastName} invites you to join '${req.body.invitation.workspace.name}'`,
			true,
			false,
			"",
			"Dashboard",
			"Subjects",
			"",
			true,
			userA.id
		);
    userB.notifications.unshift(newNotif);
    console.log('Adding notification done');

    console.log('Finalizing updates');
    await manyUserFinal([userA, userB])
    console.log('Finalizing updates done');

    console.log('Realtime notifying invited user');
		// push to userB about the new invitation
		pusher.trigger(`${userB.id}`, "newInvitation", {
      invitation: invitation,
			notification: newNotif,
    });
    console.log('Realtime notifying invited user done');
    
    console.log("created an invitation");
		console.log("-------------------------------");

    return invitation
	}
}
