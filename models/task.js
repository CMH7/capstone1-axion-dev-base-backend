
const { conversation } = require("./conversation")
const { subtask } = require("./subtask")
const { workspaceMember } = require("./workspaceMember")

module.exports = {
  task: {
    members: [workspaceMember],
	  subtasks: [subtask],
	  conversations: [conversation],
	  viewers: [''],
	  createdBy: '',
	  createdOn: new Date().toISOString(),
	  description: '',
	  dueDateTime: new Date().toISOString(),
	  id: '',
	  isFavorite: false,
	  isSubtask: false,
	  level: 1,
	  name: '',
    status: 'Todo'
  } 
}