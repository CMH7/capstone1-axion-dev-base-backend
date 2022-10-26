const { prisma } = require('../../../constants')

module.exports = {
  getAllMembers: async (/** @type string[] */ listID) => {
    let conditions = []
    listID.forEach(ida => {
      conditions = [
				...conditions,
				{
					id: ida,
				},
			];
    })

    const members = await prisma.accounts.findMany({
      where: {
        OR: conditions
      }
    })

    return members ? members : []
  }
}