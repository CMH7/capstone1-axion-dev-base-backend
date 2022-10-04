const { prisma } = require("../../constants");

module.exports = {
  newUser: async req => {
    return await prisma.accounts.create({data: req.body,})
  }
}