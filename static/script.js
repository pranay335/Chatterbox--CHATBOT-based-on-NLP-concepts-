document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("input");
  const messageSection = document.getElementById("message-section");

  function sendMessage() {
      let userMessage = inputField.value.trim();
      if (userMessage === "") return;

      displayMessage(userMessage, "user");

      // Send message to Flask backend
      fetch("/chat", {
          method: "POST",
          body: JSON.stringify({ message: userMessage }),
          headers: { "Content-Type": "application/json" }
      })
      .then(response => response.json())
      .then(data => {
          displayMessage(data.response, "bot");
      })
      .catch(error => console.error("Error:", error));

      inputField.value = "";
  }

  function displayMessage(text, sender) {
      let messageDiv = document.createElement("div");
      messageDiv.className = `message ${sender}`;
      messageDiv.innerHTML = `<span>${text}</span>`;
      messageSection.appendChild(messageDiv);
      messageSection.scrollTop = messageSection.scrollHeight;
  }

  document.querySelector(".send").addEventListener("click", sendMessage);
  inputField.addEventListener("keypress", function (event) {
      if (event.key === "Enter") sendMessage();
  });
});
