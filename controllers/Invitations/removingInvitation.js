const { user, userFinal } = require("../user");

module.exports = {
  removeInvitation: async (req) => {
    console.log("-----------------------------------");
    console.log("invitation removing")

		const userA = await user(req.body.ids.user);
		userA.invitations = userA.invitations.filter(
			(invitation) => invitation.id !== req.body.ids.invitation
		);
    await userFinal(userA);
    
    console.log("invitation removed");
    console.log("-----------------------------------");

    return req.body.ids.invitation
  }
}