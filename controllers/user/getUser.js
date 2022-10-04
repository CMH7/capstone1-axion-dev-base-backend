const { prisma } = require('../../constants')

module.exports = {
  user: async (id) => {
    const SUPuser = await prisma.accounts.findFirst({
      where: {
        id: {
          equals: id,
        },
      },
    });
    return SUPuser;
  }
}