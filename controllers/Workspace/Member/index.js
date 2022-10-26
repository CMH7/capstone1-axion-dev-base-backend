const { invite } = require("./Invite");
const { getAllMembers } = require("./listOfMembers");
const { newMember } = require('./addMember');
const { kickMember } = require("./removeMember");
const { demoteAdmin } = require("./removeAdmin");


module.exports = {
  invite,
  getAllMembers,
  newMember,
  kickMember,
  demoteAdmin
}