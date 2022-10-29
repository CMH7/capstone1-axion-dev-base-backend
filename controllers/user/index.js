const { newUser } = require('./createUser')
const { user } = require('./getUser')
const { userFinal, updateUser } = require('./updateUser')
const { manyUserFinal } = require('./updateManyUser')
const { getProfile } = require('./getProfile')
const { viewUser } = require('./viewUser')

module.exports = {
  user,
  userFinal,
  newUser,
  manyUserFinal,
  getProfile,
  viewUser,
  updateUser
}