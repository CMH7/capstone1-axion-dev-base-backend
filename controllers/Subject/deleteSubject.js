const { log } = require("../../constants");
const { user, userFinal } = require("../user")
const { deleteWorkspace2 } = require("../Workspace/deleteWorkspaceFromSubjectDelete");

module.exports = {
  deleteSubject: async (req, pusher) => {
    console.log("----------------------");
    console.log("Removing subject");

    const ids = req.body.ids
    const userA = await user(ids.user)

    const subjectToRemove = userA.subjects.filter(subject => subject.id === ids.subject)
    // check if the subject contains workspaces
    console.log('Checking workspaces');
    if (subjectToRemove[0].workspaces.length != 0) {
      console.log(`${subjectToRemove[0].workspaces.length} Workspace/s detected`);
      await deleteWorkspace2(userA.id, userA.verified, subjectToRemove[0].id, pusher)
    } else {
      console.log('No workspace/s detected');
    }
    console.log('Checking workspaces done');

    // empty workspaces
    console.log('Deleting subject');
    userA.subjects = userA.subjects.filter(subject => subject.id !== ids.subject)
    console.log('Deleting subject done');

    console.log('Finalizing updates to all affected users: subject delete');
    await userFinal(userA)
    console.log('Finalizing updates to all affected users: subject delete done');

    console.log('Removing subject done');
    console.log("----------------------");

    return ids.subject
  }
}