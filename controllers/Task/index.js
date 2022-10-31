const { sendChat } = require("./Chat");
const { createTask } = require("./createTask");
const { deleteTask } = require("./deleteTask");
const { addSeen } = require("./seenTask");
const { updateTask } = require("./updateTask");

module.exports = {
  addSeen,
  createTask,
  sendChat,
  updateTask,
  deleteTask
}