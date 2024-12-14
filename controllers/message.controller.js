const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const User = require("../models/user.model");
const asyncHandler = require("express-async-handler");
const { getIo } = require("../lib/socket");

const typeDisplayName = (displayName) => displayName.split(/[-_.\s]+/)[0];

const sendMessage = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { content, nameConversation } = req.body;
  const { id: senderId } = req.user;
  const io = getIo();

  if (!content) throw new Error("Missing content.");

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  if (!conversation) {
    const typeConversation = `${typeDisplayName(
      senderUser.displayName
    )}, ${typeDisplayName(recipientUser.displayName)}`;

    conversation = await Conversation.create({
      nameConversation: nameConversation ? nameConversation : typeConversation,
      participants: [senderId, recipientId],
    });
  }

  const newMessage = await Message.create({
    content,
    senderId,
    conversationId: conversation._id,
  });

  if (newMessage) {
    const message = await Message.findById(newMessage._id).populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    });

    conversation.lastMessage = {
      type: newMessage.type,
      senderId: newMessage.senderId,
    };
    conversation.save({ new: true, validateModifiedOnly: true });

    if (io) {
      io.to(conversation._id.toString()).emit("new-message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  }
});

const sendMessageMedias = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { nameConversation } = req.body;
  const { id: senderId } = req.user;
  const { medias: mediaFiles } = req.files;

  const medias = mediaFiles.map((media) => ({
    type: media.mimetype.split("/")[0],
    url: media.path,
    filename: media.filename,
  }));

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  if (!conversation) {
    const typeConversation = `${typeDisplayName(
      senderUser.displayName
    )}, ${typeDisplayName(recipientUser.displayName)}`;

    conversation = await Conversation.create({
      nameConversation: nameConversation ? nameConversation : typeConversation,
      participants: [senderId, recipientId],
    });
  }

  const newMessage = await Message.create({
    senderId,
    conversationId: conversation._id,
    medias,
    type: "Media",
  });

  if (newMessage) {
    const message = await Message.findById(newMessage._id).populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    });

    conversation.lastMessage = {
      type: newMessage.type,
      senderId: newMessage.senderId,
    };
    conversation.save({ new: true, validateModifiedOnly: true });

    const io = getIo();
    if (io) {
      io.to(conversation._id.toString()).emit("new-message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  }
});

const sendMessageAudio = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { nameConversation } = req.body;
  const { id: senderId } = req.user;

  const audio = {
    url: req.file.path,
    filename: req.file.filename,
  };

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  if (!conversation) {
    const typeConversation = `${typeDisplayName(
      senderUser.displayName
    )}, ${typeDisplayName(recipientUser.displayName)}`;

    conversation = await Conversation.create({
      nameConversation: nameConversation ? nameConversation : typeConversation,
      participants: [senderId, recipientId],
    });
  }

  const newMessage = await Message.create({
    senderId,
    conversationId: conversation._id,
    audio,
    type: "Audio",
  });

  if (newMessage) {
    const message = await Message.findById(newMessage._id).populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    });

    conversation.lastMessage = {
      type: newMessage.type,
      senderId: newMessage.senderId,
    };
    conversation.save({ new: true, validateModifiedOnly: true });

    const io = getIo();
    if (io) {
      io.to(conversation._id.toString()).emit("new-message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  }
});

const sendMessageDocument = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { nameConversation } = req.body;
  const { id: senderId } = req.user;

  const document = {
    url: req.file.path,
    filename: req.file.filename,
    size: req.file.size,
    name: req.file.originalname,
  };

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  if (!conversation) {
    const typeConversation = `${typeDisplayName(
      senderUser.displayName
    )}, ${typeDisplayName(recipientUser.displayName)}`;

    conversation = await Conversation.create({
      nameConversation: nameConversation ? nameConversation : typeConversation,
      participants: [senderId, recipientId],
    });
  }

  const newMessage = await Message.create({
    senderId,
    conversationId: conversation._id,
    document,
    type: "Doc",
  });

  if (newMessage) {
    const message = await Message.findById(newMessage._id).populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    });

    conversation.lastMessage = {
      type: newMessage.type,
      senderId: newMessage.senderId,
    };
    conversation.save({ new: true, validateModifiedOnly: true });

    const io = getIo();
    if (io) {
      io.to(conversation._id.toString()).emit("new-message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  }
});

const sendGiphy = asyncHandler(async (req, res) => {
  const { recipientId } = req.params;
  const { giphyUrl, nameConversation } = req.body;
  const { id: senderId } = req.user;

  if (!giphyUrl) throw new Error("Missing content.");

  let conversation = await Conversation.findOne({
    participants: { $all: [senderId, recipientId] },
  });

  const senderUser = await User.findById(senderId);
  const recipientUser = await User.findById(recipientId);

  if (!conversation) {
    const typeConversation = `${typeDisplayName(
      senderUser.displayName
    )}, ${typeDisplayName(recipientUser.displayName)}`;

    conversation = await Conversation.create({
      nameConversation: nameConversation ? nameConversation : typeConversation,
      participants: [senderId, recipientId],
    });
  }

  const newMessage = await Message.create({
    giphyUrl,
    senderId,
    conversationId: conversation._id,
    type: "Giphy",
  });

  if (newMessage) {
    const message = await Message.findById(newMessage._id).populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    });

    conversation.lastMessage = {
      type: newMessage.type,
      senderId: newMessage.senderId,
    };
    conversation.save({ new: true, validateModifiedOnly: true });

    const io = getIo();
    if (io) {
      io.to(conversation._id.toString()).emit("new-message", message);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  }
});

const getAllMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const queries = { ...req.query };
  const cursor = queries.cursor || null;
  const pageSize = 10;

  const objectQueries = cursor
    ? { _id: { $lte: cursor }, conversationId }
    : { conversationId };

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new Error("Conversations not found.");

  const messages = await Message.find(objectQueries)
    .populate({
      path: "senderId",
      select: "_id userName displayName avatarUrl status socketId",
    })
    .sort({ createdAt: -1 })
    .limit(pageSize + 1)
    .exec();

  const nextCursor = messages.length > pageSize ? messages[pageSize]._id : null;

  return res.status(messages.length ? 200 : 404).json({
    success: !!messages.length,
    mes: messages.length ? undefined : "Không tìm thấy đoạn tin nhắn.",
    nextCursor,
    data: messages.length ? messages.slice(0, pageSize) : undefined,
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.user;

  await Message.updateMany({ senderId: id, read: false }, { read: true });

  return res.status(200).json({
    success: true,
    mes: "Đã đọc tin nhắn.",
  });
});

module.exports = {
  sendMessage,
  getAllMessages,
  sendMessageMedias,
  sendMessageAudio,
  sendMessageDocument,
  sendGiphy,
  markAsRead,
};
