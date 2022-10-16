const { prisma } = require('../../../constants')

module.exports = {
  getAllMembers: async (/** @type array */ listID) => {
    const conditions = []
    for (let i = 0; i < listID.length; i++) {
      conditions.push({
        id: listID[i]
      })
    }

    const members = await prisma.accounts.findMany({
      where: {
        OR: conditions
      }
    })

    return members ? members : []
  }
}