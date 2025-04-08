// services/supportTeamService.js
const Ticket = require("./Ticket");
const User = require("./Users");

async function getSupportTeamMembers() {
  const ticket = await Ticket.findOne({}).populate("supportTeam.members", "fullname jobTitle avatarUrl");
  if (!ticket) throw new Error("Chưa có ticket nào!");

  const membersWithStats = [];

  for (const member of ticket.supportTeam.members) {
    const tickets = await Ticket.find({
      assignedTo: member._id,
      "feedback.rating": { $exists: true },
    });

    let sumRating = 0;
    let totalFeedbacks = 0;
    const badgesCount = {};

    tickets.forEach(t => {
      if (t.feedback?.rating) {
        sumRating += t.feedback.rating;
        totalFeedbacks += 1;
      }
      (t.feedback?.badges || []).forEach(badge => {
        badgesCount[badge] = (badgesCount[badge] || 0) + 1;
      });
    });

    membersWithStats.push({
      _id: member._id,
      fullname: member.fullname,
      jobTitle: member.jobTitle,
      avatarUrl: member.avatarUrl,
      averageRating: totalFeedbacks ? sumRating / totalFeedbacks : 0,
      badgesCount,
    });
  }

  return {
    teamName: ticket.supportTeam.name,
    members: membersWithStats,
  };
}

async function addMemberToSupportTeam(userId) {
  if (!userId) throw new Error("Thiếu thông tin userId");

  const ticket = await Ticket.findOne({});
  if (!ticket) throw new Error("Chưa có ticket nào!");

  const user = await User.findById(userId);
  if (!user) throw new Error("User không tồn tại!");

  if (ticket.supportTeam.members.some((m) => m.toString() === userId)) {
    throw new Error("User đã có trong team!");
  }

  ticket.supportTeam.members.push(userId);
  await ticket.save();

  return "Đã thêm user vào supportTeam";
}

async function removeMemberFromSupportTeam(userId, reqUser) {
  const ticket = await Ticket.findOne({});
  if (!ticket) throw new Error("Chưa có ticket nào!");

  const removedUser = await User.findById(userId);

  ticket.supportTeam.members = ticket.supportTeam.members.filter(
    (m) => m.toString() !== userId
  );

  ticket.history.push({
    timestamp: new Date(),
    action: `Người dùng ${reqUser.fullname} đã xoá ${removedUser.fullname} khỏi nhóm hỗ trợ`,
    user: reqUser._id,
  });

  await ticket.save();
  return "Đã xoá user khỏi team";
}

module.exports = {
  getSupportTeamMembers,
  addMemberToSupportTeam,
  removeMemberFromSupportTeam,
};