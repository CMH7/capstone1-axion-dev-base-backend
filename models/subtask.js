const { workspaceMember } = require('./workspaceMember')

module.exports = {
  subtask: {
    members: [workspaceMember],
	  createdBy: '',
	  createdOn: '',
	  description: '',
	  dueDateTime: '',
	  id: '',
	  isFavorite: false,
	  name: '',
	  status: '',
    level: 1
  }
}