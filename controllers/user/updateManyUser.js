const { prisma } = require('../../constants')

module.exports = {
  manyUserFinal: async (/** @type string[] */ listID, /** @type account[] */ datalist) => {
    let trs = []
    listID.forEach((a, i) => {
      trs = [
				...trs,
				prisma.accounts.update({
					where: {
						id: a,
					},
					data: {
						invitations: datalist[i].invitations,
						subjects: datalist[i].subjects,
						notifications: datalist[i].notifications,
						age: datalist[i].age,
						course: datalist[i].course,
						email: datalist[i].email,
						firstName: datalist[i].firstName,
						gender: datalist[i].gender,
						lastName: datalist[i].lastName,
						password: datalist[i].password,
						profile: datalist[i].profile,
						school: datalist[i].school,
						useHint: datalist[i].useHint,
						year: datalist[i].year,
						lastActive: new Date(),
						bio: datalist[i].bio,
						verified: datalist[i].verified,
					},
				}),
			];
    })

    return await prisma.$transaction(trs)
  }
}