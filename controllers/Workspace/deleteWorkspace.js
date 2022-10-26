const { newNotification } = require("../../constants");
const { user, userFinal, manyUserFinal } = require("../user");
const { getAllMembers } = require("./Member");
const bcrypt = require('bcryptjs')

module.exports = {
  deleteWorkspace: async (req, pusher) => {
    console.log('-------------------------------');
    console.log('Deleting a workspace');

    const ids = req.body.ids

    if (!req.body.verified) {
      const userA = await user(ids.userA);
			userA.subjects.every((subject) => {
				if (subject.id === ids.subject) {
					subject.workspaces = subject.workspaces.filter(
						(workspace) => workspace.id !== ids.workspace
					);
					return false;
				}
				return true;
			});
      await userFinal(userA);
      console.log('Deleting a workspace done');
      console.log("-------------------------------");
      
    } else {
      // get all members
      let membersID = []
      let workspaceMembers = []
      let workspaceOwnership = []
      let workspaceName = ''

      console.log('Checking for workspace members');
      const userA = await user(ids.userA);
      userA.subjects.every(subject => {
        if (subject.id === ids.subject) {
          subject.workspaces.every(workspace => {
            if (workspace.id === ids.workspace) {
              workspaceName = workspace.name
              // remove the owner
              let temp = workspace.members.filter(member => member.id !== userA.id)

              temp.forEach(member => {
                membersID = [...membersID, member.id]
              })
              console.log("Checking for workspace members done");
              return false
            }
            return true
          })

          // remove the workspace in the userA
          console.log('Removing the workspace');
          subject.workspaces = subject.workspaces.filter(workspace => workspace.id !== ids.workspace)
          console.log('Removing the workspace done');
          return false
        }
        return true
      })

      if (membersID.length != 0) {
        console.log('Fetching workspace members')
        workspaceMembers = await getAllMembers(membersID)
        console.log('Fetching workspace members done')

        // build a new user-notification for all members to be notified that the workspace they are part of is deleted
        const newNotif = newNotification(
          `${userA.firstName} ${userA.lastName} (owner) deleted the workspace '${workspaceName}'`,
          false,
          false,
          '',
          'Dashboard',
          'workspaces',
          '',
          true,
          userA.id
        )

        console.log('Updating member:');
        workspaceMembers.forEach(member => {
          console.log('###');
          console.log(`${member.firstName} ${member.lastName}`);
          member.subjects.every(subject => {
            if (subject.id === ids.subject) {
              let subjectIDOld = subject.id
              subject.workspaces = subject.workspaces.filter(workspace => workspace.id !== ids.workspace)

              console.log('checking for subject ownership');
              if (subject.workspaces.length == 0) {
                subject.owned = true
                subject.id = bcrypt.hashSync(`${subject.name}${member.id}${new Date()}`, 13)
                subject.workspaces = []
                subject.createdBy = `${member.firstName} ${member.lastName}`
                console.log('Subject owned');
              }

              workspaceOwnership = [...workspaceOwnership, {
                id: member.id,
                subjectID: {
                  old: subjectIDOld,
                  new: subject.id
                },
                owned: subject.owned,
                name: `${member.firstName} ${member.lastName}`
              }]
              console.log('checking for subject ownership done');
              return false
            }
            return true
          })
          console.log('Adding notification');
          member.notifications.unshift(newNotif)
          console.log('Adding notification done');
        })
        console.log('Updating members done');

        console.log('Final updating');
        if (membersID.length != 0) {
          console.log('Finalizing updates to all workspace members');
          await manyUserFinal([userA, ...workspaceMembers])
        } else {
          console.log('Finalizing update to the user');
          await userFinal(userA)
        }
        console.log('Finalizing updates done')

        console.log('Notifying workspace members');
        workspaceOwnership.forEach(member => {
          console.log('===');
          console.log(`Notifying ${member.name}`);
          pusher.trigger(`${member.id}`, 'workspaceOwnerDeletedWorkspace', {
            subjectID: member.subjectID,
            owned: member.owned,
            workspaceID: ids.workspace,
            notification: newNotif
          })
        })
        console.log("Notifying workspace members done");

      }
      
    }
    console.log("Deleting a workspace done");
    console.log("-------------------------------");

    return ids.workspace;
  }
}