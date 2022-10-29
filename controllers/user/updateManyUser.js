const { prisma } = require('../../constants')

module.exports = {
  manyUserFinal: async (/** @type account[] */ accounts) => {
    let trs = []
		accounts.forEach(account => {
      trs = [
				...trs,
				prisma.accounts.update({
					where: {
						id: account.id,
					},
					data: {
						invitations: account.invitations,
						subjects: account.subjects,
						notifications: account.notifications,
						age: account.age,
						course: account.course,
						email: account.email,
						firstName: account.firstName,
						gender: account.gender,
						lastName: account.lastName,
						password: account.password,
						profile: account.profile,
						school: account.school,
						useHint: account.useHint,
						year: account.year,
						lastActive: new Date().toISOString(),
						bio: account.bio,
						verified: account.verified,
					},
				}),
			];
    })

    return await prisma.$transaction(trs)
  }
}