const { log } = require("../../constants")
const { user, userFinal } = require("../user")

module.exports = {
  deleteNotification: async (req) => {
    log('------------------------------------')
    log('Deleting notification')

    log('Getting user data')
    const userA = await user(req.body.ids.user)
    log(`Getting user ${userA.firstName} ${userA.lastName} data done`)

    log('Removing notification')
    userA.notifications = userA.notifications.filter(notif => notif.id !== req.body.ids.notification)
    log('Removing notification done')

    await userFinal(userA)

		log("Deleting notification done");
    log("------------------------------------");
    return {
			id: req.body.ids.notification
		};
  }
}