const io = require("socket.io")();
var users = require("./routes/users");
const msgModel = require("./routes/msg");
const socketapi = {
  io: io,
};

// Add your socket.io logic here!
io.on("connection", function (socket) {
  console.log("A user connected");
  socket.on("userConnected", async (msg) => {
    var connectedUser = await users.findOne({
      username: msg.username,
    });
    connectedUser.currentSocket = socket.id;
    await connectedUser.save();
  });
  socket.on("newmsg", async (msg) => {
    msg.NewChat = false;
    // console.log(msg);
    var toUser = await users.findOne({
      username: msg.toUser,
    });
    var fromUser = await users.findOne({
      username: msg.fromUser,
    });
    // console.log("toUser.chats:", toUser.chats);
    // console.log("fromUser._id:", fromUser._id);
    var indexOffFromUser = toUser.chats.indexOf(fromUser._id);
    // console.log(indexOffFromUser);
    if (indexOffFromUser == -1) {
      toUser.chats.push(fromUser._id);
      fromUser.chats.push(toUser._id);
      await toUser.save();
      await fromUser.save();
      msg.NewChat = true;
    }
    msg.fromUserPic = fromUser.pic;
    // console.log(toUser);
    var newMsg = await msgModel.create({
      data: msg.msg,
      toUser: toUser.username,
      fromUser: fromUser.username,
    });
    if (toUser.currentSocket) {
      socket.to(toUser.currentSocket).emit("msg", msg);
    }
  });
  socket.on("disconnect", async () => {
    await users.findOneAndUpdate(
      {
        currentSocket: socket.id,
      },
      {
        currentSocket: "",
      }
    );
  });
});
// end of socket.io logic

module.exports = socketapi;
