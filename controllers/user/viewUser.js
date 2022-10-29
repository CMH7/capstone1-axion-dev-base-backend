const { log } = require("../../constants");
const { user } = require("./getUser");

module.exports = {
  viewUser: async (req, prisma) => {
    log('------------------------------')
    log('Viewing user')
    const user = await prisma.accounts.findFirst({
      where: {
        email: {
          equals: req.query.email,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        age: true,
        school: true,
        course: true,
        gender: true,
        bio: true,
        email: true,
        profile: true
      }
    });
    log(`Viewing ${user.firstName} ${user.lastName}`)
    log("------------------------------");

    return {
      user
    }
  }
}