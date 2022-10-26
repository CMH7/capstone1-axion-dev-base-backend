const { deleteAllNotification } = require("./deleteAllNotification");
const { deleteNotification } = require("./deleteNotification");
const { readNotification } = require("./readNotification");

module.exports = {
  readNotification: readNotification,
  deleteNotification: deleteNotification,
  deleteAllNotification: deleteAllNotification
}