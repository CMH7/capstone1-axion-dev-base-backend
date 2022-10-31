const { prisma, log } = require('../../constants');
const { user } = require('./getUser');

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
        lastActive: new Date().toISOString(),
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
  },
  updateUser: async (req) => {
    log('------------------------------------------')
    log('Updating basic info of user')

    log('Getting user data')
    const userA = await user(req.body.user.id)
    log(`Getting user ${userA.firstName} ${userA.lastName} data done`)

    log('Updating name')
    userA.firstName = req.body.user.firstName
    userA.lastName = req.body.user.lastName
    log('Updating name done')

    log('Updating age')
    userA.age = req.body.user.age
    log('Updating age done')
    
    log('Updating school')
    userA.school = req.body.user.school
    log('Updating school done')
    
    log('Updating course')
    userA.course = req.body.user.course
    log('Updating course done')

    log('Updating year')
    userA.year = req.body.user.year
    log('Updating year done')
    
    log('Updating bio')
    userA.bio = req.body.user.bio
    log('Updating bio done')

    log('Finalizing update on user')
    console.log(`Final update for: ${userA.firstName} ${userA.lastName}`);
		const userB = await prisma.accounts.update({
			where: {
				id: userA.id,
			},
			data: {
				invitations: userA.invitations,
				subjects: userA.subjects,
				notifications: userA.notifications,
				age: userA.age,
				course: userA.course,
				email: userA.email,
				firstName: userA.firstName,
				gender: userA.gender,
				lastName: userA.lastName,
				password: userA.password,
				profile: userA.profile,
				school: userA.school,
				useHint: userA.useHint,
				year: userA.year,
				lastActive: new Date().toISOString(),
				bio: userA.bio,
				verified: userA.verified,
			},
		});

		user
			? console.log(
					`Final update for: ${userA.firstName} ${userA.lastName} done`
			  )
			: console.log(
					`Final update for: ${userA.firstName} ${userA.lastName} failed`
			  );
    log('Finalizing update on user done')

		log("Updating basic info of user done");
    log("------------------------------------------");

    return {
      firstName: req.body.user.firstName,
      lastName: req.body.user.lastName,
      age: req.body.user.age,
      school: req.body.user.school,
      course: req.body.user.course,
      bio: req.body.user.bio,
      year: req.body.user.year
    }
  }
}