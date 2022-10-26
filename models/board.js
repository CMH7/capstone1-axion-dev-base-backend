const { task } = require("./task")

module.exports = {
  board: {
    tasks: [task],
    color: '',
    createdBy: '',
    createdOn: new Date().toISOString(),
    id: '',
    name: ''
  }
}