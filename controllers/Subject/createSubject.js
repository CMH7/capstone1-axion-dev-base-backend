module.exports = {
  createSubject: (req, user) => {
		const subjectToSend = {
			color: req.body.subject.color,
			id: req.body.ids.subject,
			isFavorite: false,
			name: req.body.subject.name,
			workspaces: [],
			owned: req.body.subject.owned,
			createdBy: req.body.subject.createdBy
		}
		user.subjects.unshift(subjectToSend)
    return {
      user,
      subjectToSend
    }
	}
}