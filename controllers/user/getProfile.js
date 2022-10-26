const { log, prisma } = require("../../constants")
const { user } = require("./getUser")

module.exports = {
  getProfile: async req => {
    log('---------------------------------------')
    log('Getting profile picture')

    const profile = await prisma.accounts.findFirst({
      where: {
        id: {
          equals: req.query.id
        }
      },
      select: {
        profile: true
      }
    })

    log('Getting profile picture done')
    log("---------------------------------------");

    return profile.profile
  }
}