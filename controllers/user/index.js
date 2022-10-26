const { newUser } = require('./createUser')
const { user } = require('./getUser')
const { userFinal } = require('./updateUser')
const { manyUserFinal } = require('./updateManyUser')
const { getProfile } = require('./getProfile')

module.exports = {
  user,
  userFinal,
  newUser,
  manyUserFinal,
  getProfile
}