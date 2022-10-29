const { log } = require("../../../constants")
const subject = require("../../../models/subject")
const { user } = require("../../user")

module.exports = {
  getUpdateMembersData: async (req, prisma) => {
    log('---------------------------------')
    log('Getting updates on members')
    let conditions = []

    req.body.ids.members.forEach(memberID => {
      conditions = [...conditions, {
        id: memberID
      }]
    })

    const membersa = await prisma.accounts.findMany({
      where: {
        OR: conditions
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profile: true
      }
    })

    let members = []
    membersa.forEach(member => {
      members = [...members, {
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        id: member.id,
        profile: member.profile
      }]
    })

    log('Getting user data')
    const userA = await user(req.body.ids.user)
    log(`Getting user ${userA.firstName} ${userA.lastName}`)

    log('Updating userA copy of members')
    userA.subjects.every(subject => {
      if (subject.id === req.body.ids.subject) {
        subject.workspaces.every(workspace => {
          if (workspace.id === req.body.ids.workspace) {
            workspace.members = members
            return false
          }
          return true
        })
        return false
      }
      return true
    })


		log("Getting updates on members done");
    log("---------------------------------");

    return {
      members
    }
  }
}