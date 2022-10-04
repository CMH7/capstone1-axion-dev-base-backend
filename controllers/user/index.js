const { newUser } = require('./createUser')
const { user } = require('./getUser')
const { userFinal } = require('./updateUser')

module.exports = {
  user,
  userFinal,
  newUser
}