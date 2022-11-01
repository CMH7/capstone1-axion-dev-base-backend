const { prisma } = require("../../constants");

module.exports = {
  newUser: async req => {
    return await prisma.accounts.create({
      data: {
        invitations: [],
        subjects: [],
        notifications: [],
        age: parseInt(req.body.age),
        course: req.body.course,
        email: req.body.email,
        firstName: req.body.firstName,
        gender: req.body.gender,
        lastName: req.body.lastName,
        password: req.body.password,
        profile: req.body.profile,
        school: req.body.school,
        useHint: req.body.useHint,
        year: parseInt(req.body.year),
        lastActive: req.body.lastActive,
        bio: req.body.bio,
        verified: req.body.verified
      },
    })
  }
}