const { log } = require("../../constants");
const { notification } = require("../../models");
const { user, userFinal } = require("../user");

module.exports = {
  readNotification: async (req) => {
    log('--------------------------------')
    log('Reading notification')

    let notif = notification

    log('Getting user data')
    const userA = await user(req.query.user);
    log(`Getting user ${userA.firstName} ${userA.lastName}`)

    log('Notification reading')
    userA.notifications.every((notificationa) => {
      if (notificationa.id === req.query.notification) {
        notificationa.isRead = true;
        notif = notificationa
        return false;
      }
      return true;
    });
    log('Notification reading done')

    log('Finalizing updates on userA')
    const finalUser = await userFinal(userA);
    log('Finalizing updates on userA done')

		log("Reading notification done");
    log("--------------------------------");

    return notif
  }
}