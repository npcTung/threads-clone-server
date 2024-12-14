require("dotenv").config();

const port = process.env.PORT || 8088;

process.on("uncaughtException", (err) => {
  console.error(err);
  process.exit(1);
});

const app = require("./app");
const http = require("http");
const { initSocket } = require("./lib/socket");

const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log("Server running on port:", port);
});

process.on("unhandledRejection", (err) => {
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});
