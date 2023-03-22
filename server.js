const path = require("path");
const express = require("express");
const app = express();
const http = require("http"); //setting server to handle Socket.io
const server = http.createServer(app);
const session = require("express-session");

const { Server } = require("socket.io");
const io = new Server(server); // Initializing variables

require("dotenv").config();
const mongoose = require("mongoose");
const mongoStore = require("connect-mongo");

//  session middleware
const sessionMiddleware = session({
  secret: "secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30, //Remember me for 30 days
  },
});

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

const orderHistory = [];
const fastFoods = {
  1: "Steak",
  2: "Salmon",
  3: "Risotto",
  4: "Fruit Salad",
  5: "Apple Pie",
  6: "Sorbet",
};

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Run when client connects
io.on("connection", (socket) => {
  console.log("User connected...", socket.id);
  deviceId = socket.handshake.headers["user-agent"];
  // Get the unique identifier for the user's device
  // Check if the user already has an existing session
  if (socket.request.session[deviceId]?.userName) {
    // If the user already has a session, use the existing user name and current order
    const { userName, currentOrder } = socket.request.session[deviceId];
    socket.emit(
      "chatMessage",
      `Welcome back, ${userName}! You have a current order of ${currentOrder.join(
        ", "
      )}`
    );
  } else {
    // If the user does not have a session, create a new session for the user's device
    socket.request.session[deviceId] = {
      userName: "",
      currentOrder: [],
      deviceId, // store the deviceId in the session object
    };
  }

  const userName = socket.request.session[deviceId].userName;

  //   Listen for incoming Tavern messages
  socket.on("chatMessage", (message) => {
    console.log("chat Message received:", message);
    socket.emit("chatMessage", message);
  });

  //   Listen for incoming user messages
  socket.on("user-message", (message) => {
    console.log("User message received:", message);

    if (!userName) {
      // Save the user's name and update the welcome message
      userName = message;
      socket.request.session[deviceId].userName = userName;
      socket.emit(
        "chatMessage",
        `Welcome to our Tavern ChatBot, ${userName}!\n1. Place an order\n99. Checkout order\n98. Order history\n97. Current order\n0. Cancel order`
      );
    } else {
      switch (message) {
        case "1":
          // Generate the list of items dynamically
          const itemOptions = Object.keys(fastFoods)
            .map((item) => `${item}. ${fastFoods[item]}`)
            .join("\n");
          socket.emit(
            "chatMessage",
            `The menu items are:\n${itemOptions}\nType the item number to add to your order`
          );
          break;
        case "97":
          // Show the user their current order
          if (socket.request.session[deviceId].currentOrder.length > 0) {
            const currentOrder =
              socket.request.session[deviceId].currentOrder.join(", ");
            socket.emit(
              "chatMessage",
              `Your current order: ${currentOrder}\n1. Place an order\n99. Checkout order\n98. Order history\n97. Current order\n0. Cancel order`
            );
          } else {
            socket.emit(
              "chatMessage",
              `You don't have any items in your current order yet. Type '1' to see the menu.`
            );
          }
          break;
        case "99":
          // Checkout the order
          if (socket.request.session[deviceId].currentOrder.length > 0) {
            const currentOrder =
              socket.request.session[deviceId].currentOrder.join(", ");
            orderHistory.push({
              user: userName,
              order: currentOrder,
              date: new Date(),
            });
            socket.emit(
              "chatMessage",
              `Thanks for your order, ${userName}! Your order of ${currentOrder} will be with you shortly.\n1. Place an order\n98. Order history\n0. Cancel order`
            );
            socket.request.session[deviceId].currentOrder = [];
          } else {
            socket.emit(
              "chatMessage",
              `You don't have any items in your current order yet. Type '1' to see the menu.`
            );
          }
          break;
        case "98":
          // Show the order history
          if (orderHistory.length > 0) {
            const history = orderHistory
              .map(
                (order) =>
                  `${order.user} ordered ${
                    order.order
                  } on ${order.date.toDateString()}`
              )
              .join("\n");
            socket.emit(
              "chatMessage",
              `Here is the order history:\n${history}\n1. Place an order\n98. Order history\n0. Cancel order`
            );
          } else {
            socket.emit(
              "chatMessage",
              `There is no order history yet. Type '1' to see the menu.`
            );
          }
          break;
        case "0":
          // Cancel the order
          const currentOrder = socket.request.session[deviceId].currentOrder;
          if (currentOrder.length === 0 && orderHistory.length === 0) {
            socket.emit(
              "chatMessage",
              `There is nothing to cancel. Type '1' to see the menu.`
            );
          } else {
            socket.request.session[deviceId].currentOrder = [];
            orderHistory.length = 0;
            socket.emit(
              "chatMessage",
              `Your order has been cancelled.\n1. Place a new order\n98. Order history`
            );
          }
          break;
        default:
          // Add the item to the current order
          const itemNumber = parseInt(message);
          if (!isNaN(itemNumber) && fastFoods[itemNumber]) {
            socket.request.session[deviceId].currentOrder.push(
              fastFoods[itemNumber]
            );
            socket.emit(
              "chatMessage",
              `You have added ${fastFoods[itemNumber]} to your current order\n Add another order from the menu\n Type '97' to see your current order\n '98' to see order history\n '99' to checkout\n '0' to cancel your order`
            );
          } else {
            socket.emit(
              "chatMessage",
              `Invalid input. Type '1' to see the menu.`
            );
          }
          break;
      }
    }
  });

  //   Welcome current user
  socket.emit("message", "Welcome to my Tavern!");

  //   Listen for chatMessages from Main.js
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.emit("message", formatMessage(user.username, msg));
  });

  // Run when client disconnects
  socket.on("disconnect", () => {
    delete socket.request.session[deviceId];
    console.log("User disconnected:", socket.id);
  });
});
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chatbot")
  .then(() => {
    console.log("connected to the database");

    const PORT = 4000 || process.env.PORT;
    server.listen(PORT, () => console.log(`server running on port ${PORT}...`));
  });
