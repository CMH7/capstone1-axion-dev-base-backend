const { log } = require("../../constants");
const { user, userFinal } = require("../user");

module.exports = {
  deleteAllNotification: async req => {
    log('--------------------------------')
    log("Deleting all notification");

    log('Getting user data')
    const userA = await user(req.body.userID);
    log(`Getting user ${userA.firstName} ${userA.lastName} data done`)

    log('Notification deleting')
		userA.notifications = [];
    log('Notification deleting done')

    await userFinal(userA);
    
    log("Deleted all notification")
    log("--------------------------------");
    
    return []
  }
}