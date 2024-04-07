var express = require("express");
var router = express.Router();
var users = require("./users");
var msg = require("./msg");
var passport = require("passport");
var localStrategy = require("passport-local");
passport.use(new localStrategy(users.authenticate()));
require('dotenv').config()
function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

/* GET home page. */
router.get("/", isloggedIn, async function (req, res, next) {
  var loggedinUser = await users.findOne({
    username: req.session.passport.user,
  });
  // console.log(loggedinUser)
  var Chats = loggedinUser.chats;
  var addUsers = [];
  var userInChats = {};
  // console.log("chats = " + Chats);
  for (const chatId of Chats) {
    userInChats = await users.findOne({ _id: chatId });
    if (userInChats) {
      addUsers.push(userInChats); // Add the user object to the array
    } else {
      // console.log("User not found for chat ID:", chatId);
    }
  }
  // console.log("add users = "+addUsers);
  res.render("index", { user: loggedinUser, addUsers }); // Passing addUsers to the template
});
// })

// user authentication related routes
router.post("/register", (req, res, next) => {
  var newUser = {
    //user data here
    username: req.body.username,
    pic: req.body.pic,
    //user data here
  };

  users.register(newUser, req.body.password)
    .then((result) => {
      passport.authenticate("local")(req, res, () => {
        // destination after user register
        res.redirect("/");
      });
    })
    .catch((err) => {
      res.send(err);
    });
});
router.get("/register", (req, res, next) => {
  res.render("register");
});
// login
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true // Enable flash messages for displaying error messages
  }),
  (err, req, res, next) => {
    // Handle errors that occurred during authentication
    console.error(err.message); // Log the error message
    res.status(500).send("Internal Server Error"); // Send a 500 response
  }
);

router.get("/login", (req, res, next) => {
  res.render("login");
});
// logout
router.get("/logout", (req, res, next) => {
  console.log("logged out")
  if (req.isAuthenticated())
    req.logout((err) => {
      if (err) res.send(err);
      else res.redirect("/");
    });
  else {
    res.redirect("/");
  }
});
router.post("/finduser", async (req, res, next) => {
  const findUsername = req.body.username;
  console.log("user name = ", findUsername);
  // Check if the user exists in the database
  const findUser = await users
    .findOne({
      username: findUsername,
    })
    .select("+chats");

  console.log("find user =", findUser);

  if (findUser) {
    // Check if the user is in any chats
    const presentUser= req.session.passport.user;
    const userPresent= await users.findOne({
      username:presentUser
    })
    // console.log("presetn uer =",presentUser)
    // console.log("user present =",userPresent)
    const otherPersonId = userPresent._id.toString(); 
    // console.log("other person id = ",otherPersonId)
    const userInChats = await users.findOne({
      _id: findUser._id,
    });
    // console.log("userInChats = ", userInChats);

    try {
      if (userInChats && userInChats.chats.includes(otherPersonId)) {
        console.log("user is in chats");
        res.status(200).json({
          user: null, // User is in chats
        });
      } else {
        res.status(200).json({
          user: findUser, // User is not in chats
        });
      }
    } catch (error) {
      res.status(404).json({
        message: "User not found",
      });
    }
  }
});

router.post("/findchats", isloggedIn, async (req, res, next) => {
  var oppositeUser = await users.findOne({
    username: req.body.oppositeUser,
  });
  // console.log(oppositeUser);
  var chats = await msg.find({
    $or: [
      {
        toUser: oppositeUser.username,
        fromUser: req.session.passport.user,
      },
      {
        toUser: req.session.passport.user,
        fromUser: oppositeUser.username,
      },
    ],
  });
  var forImg = await users.findOne({
    username: req.session.passport.user,
  });
  // console.log("for img = ",forImg)
  // console.log("chats = " + chats);
  res.json({ chats, forImg });
});
module.exports = router;
