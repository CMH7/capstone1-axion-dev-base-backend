const { prisma } = require('../../constants')

module.exports = {
  userFinal: async (userCopy) => {
    const user = await prisma.accounts.update({
      where: {
        id: userCopy.id,
      },
      data: {
        invitations: userCopy.invitations,
        subjects: userCopy.subjects,
        notifications: userCopy.notifications,
        age: userCopy.age,
        course: userCopy.course,
        email: userCopy.email,
        firstName: userCopy.firstName,
        gender: userCopy.gender,
        lastName: userCopy.lastName,
        password: userCopy.password,
        profile: userCopy.profile,
        school: userCopy.school,
        useHint: userCopy.useHint,
        year: userCopy.year,
        lastActive: new Date(),
        bio: userCopy.bio,
        verified: userCopy.verified,
      },
    })
    return user;
  }
}