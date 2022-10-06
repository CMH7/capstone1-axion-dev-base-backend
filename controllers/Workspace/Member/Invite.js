const { newNotification } = require("../../../constants");
const { user, userFinal } = require("../../user")

module.exports = {
  invite: async (req) => {
    const userA = await user(req.body.invitation.from.id);
    const userB = await user(req.body.invitation.to.id);

    // check if the user being invited is existing in the workspace if not add else return existing is true
    let existing = false;
    userA.subjects.every((subject) => {
      if (subject.id == req.body.invitation.subjectID) {
        subject.workspaces.every((workspace) => {
          if (workspace.id === req.body.invitation.workspace.id) {
            workspace.members.every((member) => {
              if (member.id === req.body.invitation.to.id) {
                existing = true;
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
    
    if (!existing) {
      userA.invitations.unshift(req.body.invitation);
      userB.invitations.unshift(req.body.invitation);
    
      const newNotif = newNotification(
        `${userA.firstName} ${userA.lastName} invites you to join '${req.body.invitation.workspace.name}'`,
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
    
      const userAFinal = await userFinal(userA)
      const userBFinal = await userFinal(userB)

      return {
        userAFinal,
        userBFinal,
        newNotif,
        existing
      }
    }
  }
}
