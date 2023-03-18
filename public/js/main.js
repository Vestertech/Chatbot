const chatForm = document.getElementById("chat-form");
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

// Handling receiving messages from the server
socket.on("chatMessage", (message) => {
  appendMessage(message, "Tavern");
});

// Attaching event listeners
sendBtn.addEventListener("click", sendMessage);
msg.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

// // Message from server
// socket.on("message", (message) => {
//   console.log(message);
//   appendMessage(message, "Tavern");

//   // Scroll down
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// });

// // Message Submit.
// chatForm.addEventListener("submit", (e) => {
//   e.preventDefault();

//   // Get message text
//   let msg = e.target.elements.msg.value;

//   msg = msg.trim();
//   if (!msg) {
//     return false;
//   }

//   // Emit message back to server
//   socket.emit("chatMessage", msg);

//   // clear input
//   e.target.elements.msg.value = "";
//   e.target.elements.msg.focus();
// });

// // Output message to DOM
// function outputMessage(message) {
//     const div = document.createElement('div');
//     div.classList.add('message');
//     const p = document.createElement('p');
//     p.classList.add('meta');
//     p.innerHTML += `<span>${message.time}</span>`;
//     div.appendChild(p);
//     const para = document.createElement('p');
//     para.classList.add('text');
//     para.innerText = message.text;
//     div.appendChild(para);
//     document.querySelector('.chat-message').appendChild(div);
// }
