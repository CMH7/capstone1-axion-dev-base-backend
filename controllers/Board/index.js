const { createBoard } = require("./createdBoard");

module.exports = {
  board: (color, createdBy, createdOn, id, name) => {
    return createBoard(color, createdBy, createdOn, id, name)
  }
}