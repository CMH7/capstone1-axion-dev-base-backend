module.exports = {
  createBoard: (color, createdBy, createdOn, id, name) => {
    return {
      color,
      createdBy,
      createdOn,
      id,
      name,
      tasks: []
    }
  }
}