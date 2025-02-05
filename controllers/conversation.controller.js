const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const asyncHandler = require("express-async-handler");

const getAllConversations = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const queries = { ...req.query };
  const cursor = queries.cursor || null;
  const pageSize = 10;
  let queryString = JSON.stringify(queries);
  queryString = queryString.replace(
    /\b(gte|gt|lt|lte)\b/g,
    (macthedEl) => `$${macthedEl}`
  );

  const objectQueries = JSON.parse(queryString);
  if (cursor) {
    objectQueries._id = { $lte: cursor };
    objectQueries.participants = { $in: userId };
  } else objectQueries.participants = { $in: userId };
  if (req.query.q) {
    delete objectQueries.q;
    objectQueries["$or"] = [
      { nameConversation: { $regex: req.query.q, $options: "i" } },
    ];
  }

  const conversations = await Conversation.find(objectQueries)
    .populate([
      {
        path: "participants",
        select:
          "_id userName displayName avatarUrl status bio socketId status_expiry_time",
      },
      {
        path: "lastMessage.senderId",
        select:
          "_id userName displayName avatarUrl status bio socketId status_expiry_time",
      },
    ])
    .sort({ updatedAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const dataConversations = [];

  for (let conversation of conversations) {
    const countReadMessages = await Message.countDocuments({
      conversationId: conversation._id,
      senderId: { $ne: userId },
      read: false,
    });

    dataConversations.push({
      ...conversation._doc,
      unreadCount: countReadMessages,
    });
  }

  const nextCursor =
    dataConversations.length > pageSize
      ? dataConversations[pageSize]._id
      : null;

  res.status(dataConversations.length ? 200 : 404).json({
    success: !!dataConversations.length,
    mes: dataConversations.length
      ? undefined
      : "Không tìm thấy cuộc trò truyện nào.",
    data: dataConversations.length ? dataConversations : undefined,
    nextCursor,
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { userId: senderId } = req.user;

  const conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  }).populate([
    {
      path: "participants",
      select: "_id userName displayName avatarUrl status socketId",
    },
    { path: "lastMessage", select: "_id content" },
  ]);

  res.status(conversation ? 200 : 404).json({
    success: !!conversation,
    mes: conversation ? undefined : "Không tìm thấy cuộc trò truyện nào.",
    data: conversation ? conversation : undefined,
  });
});

const updateNameConversation = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { nameConversation } = req.body;

  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    { nameConversation },
    { new: true }
  ).populate([
    {
      path: "participants",
      select: "_id userName displayName avatarUrl status socketId",
    },
    { path: "lastMessage", select: "_id content" },
  ]);

  return res.status(conversation ? 200 : 404).json({
    success: !!conversation,
    mes: conversation ? undefined : "Không tìm thấy cuộc trò truyện nào.",
    data: conversation ? conversation : undefined,
  });
});

const updateParticipants = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { participants, isPush } = req.body;

  let conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Không tìm thấy cuộc trò truyện nào.");
  if (isPush)
    for (let participant of participants)
      conversation.participants.push(participant);
  else
    for (let participant of participants)
      conversation.participants = conversation.participants.filter(
        (item) => item._id !== participant
      );
  await conversation.save({ new: true, validateModifiedOnly: true });

  return res.status(200).json({
    success: true,
    mes: "Cập nhật thành viên thành công.",
    data: conversation,
  });
});

module.exports = {
  getAllConversations,
  getConversation,
  updateNameConversation,
  updateParticipants,
};
