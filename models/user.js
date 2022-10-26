const { invitation } = require("./invitation")
const { notification } = require("./notification")
const { subject } = require("./subject")

module.exports = {
  account: {
    invitations: [invitation],
    subjects: [subject],
    notifications: [notification],
    id: '',
    age: 0,
    course: '',
    email: '',
    firstName: '',
    gender: '',
    lastName: '',
    password: '',
    profile: '',
    school: '',
    useHint: true,
    year: 0,
    lastActive: new Date(),
    bio: '',
    verified: false
  }
}