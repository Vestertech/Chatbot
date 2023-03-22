
const chatForm = document.getElementById("chat-form");
const leaveChat = document.getElementById("leave-btn");
const chatMessages = document.querySelector(".chat-messages");
const socket = io();

// Helper function to append a message to the chat box
function appendMessage(message, sender) {
  const messageElement = document.createElement("div");
  messageElement.className = "message-text";
  messageElement.id = sender;
  messageElement.textContent = message;

  const timestamp = new Date().toLocaleTimeString(); // create timestamp
  const timestampElement = document.createElement("span"); // create span element for timestamp
  timestampElement.className = "timestamp";
  timestampElement.textContent = timestamp;

  const messageContainer = document.createElement("div");
  const messageOuterContainer = document.createElement("div");
  messageContainer.className = "message-container " + sender;
  messageOuterContainer.className = "message-outer-container " + sender;
  messageElement.innerHTML = message.replace(/\n/g, "<br>");
  messageOuterContainer.appendChild(messageContainer);
  messageContainer.appendChild(messageElement);
  messageContainer.appendChild(timestampElement);
  chatBox.appendChild(messageOuterContainer);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Handling sending messages
function sendMessage() {
  const message = msg.value;
  if (message === "") {
    return;
  }
  appendMessage(message, "user");
  socket.emit("user-message", message);
  msg.value = "";
}

function leaveConnection() {
    socket.disconnect()
  console.log("Connection closed!");
}

// Handling receiving messages from the server
socket.on("chatMessage", (message) => {
    console.log({message})
  appendMessage(message, "Tavern");
});

// Attaching event listeners
sendBtn.addEventListener("click", sendMessage);
msg.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

leaveChat.addEventListener("click", leaveConnection);

