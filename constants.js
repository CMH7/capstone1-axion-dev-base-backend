const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient()

module.exports = {
	prisma,
	/** Creates a new subject
	 * @return AccountsSubject */
	newSubject: (
		/**@type string */ color,
		/**@type string */ id,
		/**@type string */ name,
		/**@type boolean */ owned,
		/**@type string */ createdBy
	) => {
		return {
			color,
			id,
			isFavorite: false,
			name,
			workspaces: [],
			owned,
			createdBy,
		};
	},
	/** Creates a new workspace
	 * @return AccountsSubjectWorkspace */
	newWorkspace: (
		/** @type AccountsWorkspaceMembers */ members,
		/** @type AccountsBoards */ boards,
		/** @type string[] */ admins,
		/** @type string */ color,
		/** @type string */ id,
		/** @type string */ name,
		/** @type boolean */ owned,
		/** @type boolean */ createdBy
	) => {
		return {
			members,
			boards,
			admins,
			color,
			id,
			isFavorite: false,
			name,
			owned,
			createdBy,
		};
	},
	/** Creates a new notification
	 * @return AccountsNotification */
	newNotification: (
		/** @type string */ message,
		/** @type boolean */ anInvitation,
		/** @type boolean */ aMention,
		/** @type string */ conversationID,
		/** @type string */ interf,
		/** @type string */ subInterface,
		/** @type string */ fromTask,
		/** @type boolean */ self,
		/** @type string */ userID
	) => {
		return {
			id: bcrypt.hashSync(message, 13),
			message,
			isRead: false,
			anInvitation,
			aMention,
			conversationID,
			fromInterface: {
				interf,
				subInterface,
			},
			fromTask,
			for: {
				self,
				userID,
			},
		};
	},
	newMsg: (to, fullName, link) => {
		return {
			to,
			from: "axionwebdev22@gmail.com",
			template_id: "d-ea2d8bc359bb4b18ab371717cd69864b",
			dynamic_template_data: {
				fullName,
				link,
			},
		};
	},
	backURI: "https://axion-back.herokuapp.com",
};
