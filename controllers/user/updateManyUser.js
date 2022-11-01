const { prisma, log } = require('../../constants')

const manyUserFinal = async accounts => {
	let trs = [];
	accounts.forEach((account) => {
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
	});

	return await prisma.$transaction(trs);
}

module.exports = {
	manyUserFinal: async (/** @type account[] */ accounts) => {
		try {
			const result = await manyUserFinal(accounts)
			log('% many user final updates done %')
			return result
		} catch (e) {
			log('!!! Retrying finalization updates')
			const result = await manyUserFinal(accounts)
			log('!!! Retrying finalization updates done')
			return result
		}
  }
}