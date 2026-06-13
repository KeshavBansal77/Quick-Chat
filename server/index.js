const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const { chats } = require("./data/data");
const colors = require("colors");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const helmet = require("helmet");

const { socket } = require("socket.io");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { PORT, CLIENT_ACCESS_URL } = require("./config/keys");

dotenv.config();
const app = express();
connectDB();

// socket.io implement

const http = require("http");
const { Server } = require("socket.io");

// const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

app.use(helmet());
app.use(express.json()); //to accept json data
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Quick Chat Server",
  });
});

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/user", userRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/ai", require("./routes/aiRoutes"));
app.use(notFound);
app.use(errorHandler);

// PORT
// const PORT = PORT || 4000;
server.listen(PORT, () => {
  console.log(
    `Server is Running on PORT: http://localhost:${PORT}`.yellow.bold
  );
});

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: CLIENT_ACCESS_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

// Track online users
const onlineUsers = new Map(); // userId -> Set of socketIds

io.on("connection", (socket) => {
  console.log("connetcted to Socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.userId = userData._id;

    // Track this socket for the user
    if (!onlineUsers.has(userData._id)) {
      onlineUsers.set(userData._id, new Set());
    }
    onlineUsers.get(userData._id).add(socket.id);

    // Broadcast to all clients that this user is online
    socket.broadcast.emit("user online", userData._id);

    // Send the full list of online users to the newly connected client
    socket.emit("online users", Array.from(onlineUsers.keys()));

    console.log(`${userData.name} with _id: ${userData._id} is connected.`);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    if (!room) {
      return console.log(`no room is selected by user`);
    }
    socket.join(room);
    console.log(`user joined room. Room _id : ${room._id}`);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing",{
    senderId: room.senderId
  }));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat) {
      return;
    }

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) {
        return;
      }
      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("disconnect", () => {
    const userId = socket.userId;
    if (userId && onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);
      // Only broadcast offline if user has no more active connections
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit("user offline", userId);
      }
    }
    console.log("user disconnected");
  });
});
