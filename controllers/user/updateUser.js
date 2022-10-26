const { prisma } = require('../../constants')

module.exports = {
  userFinal: async (userCopy) => {
    console.log(`Final update for: ${userCopy.firstName} ${userCopy.lastName}`);
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

    user
			? console.log(
					`Final update for: ${userCopy.firstName} ${userCopy.lastName} done`
			  )
			: console.log(
					`Final update for: ${userCopy.firstName} ${userCopy.lastName} failed`
			  );
    return user;
  }
}