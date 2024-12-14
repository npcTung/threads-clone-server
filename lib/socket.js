const { Server } = require("socket.io");
const authSocket = require("../middlewares/authSocket");
const socketHandler = require("../socket_handle");

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.URI_CLIENT,
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  io.use(authSocket);

  io.on("connection", (socket) => {
    console.log("Kết nối socket id:", socket.id);
    socketHandler.newConnect(socket);

    socket.on("join-room", (room) => {
      socket.join(room);
      console.log(`${socket.id} đã vào phòng ${room}`);
    });

    socket.on("leave-room", (room) => {
      socket.leave(room);
      console.log(`${socket.id} đã rời phòng ${room}`);
    });

    socket.on("get-room-members", (roomId, callback) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (room) {
        const members = Array.from(room);
        callback(members);
      } else callback([]);
    });

    socket.on("disconnect", () => {
      socketHandler.disconnect(socket);
      console.log("Ngắt kết nối socket.");
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.IO chưa được khởi tạo");
  }
  return io;
};

module.exports = { getIo, initSocket };
