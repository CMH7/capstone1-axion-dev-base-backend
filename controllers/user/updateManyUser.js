const { prisma } = require('../../constants')

module.exports = {
  manyUserFinal: async (/** @type account[] */ accounts) => {
    let trs = []
    accounts.forEach((a, i) => {
      trs = [
				...trs,
				prisma.accounts.update({
					where: {
						id: accounts[i].id,
					},
					data: {
						invitations: accounts[i].invitations,
						subjects: accounts[i].subjects,
						notifications: accounts[i].notifications,
						age: accounts[i].age,
						course: accounts[i].course,
						email: accounts[i].email,
						firstName: accounts[i].firstName,
						gender: accounts[i].gender,
						lastName: accounts[i].lastName,
						password: accounts[i].password,
						profile: accounts[i].profile,
						school: accounts[i].school,
						useHint: accounts[i].useHint,
						year: accounts[i].year,
						lastActive: new Date(),
						bio: accounts[i].bio,
						verified: accounts[i].verified,
					},
				}),
			];
    })

    return await prisma.$transaction(trs)
  }
}