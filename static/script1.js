document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("input");
    const messageSection = document.getElementById("message-section");

    function sendMessage(message = null, existingUserDiv = null, existingBotDiv = null) {
        let userMessage = message || inputField.value.trim();
        if (userMessage === "") return;

        let userDiv, botDiv;

        if (existingUserDiv && existingBotDiv) {
            userDiv = existingUserDiv;
            botDiv = existingBotDiv;
            userDiv.querySelector(".message-text").textContent = userMessage;
        } else {
            userDiv = createMessageDiv(userMessage, "user");
            messageSection.appendChild(userDiv);
        }

        fetch("/chat", {
            method: "POST",
            body: JSON.stringify({ message: userMessage }),
            headers: { "Content-Type": "application/json" }
        })
        .then(response => response.json())
        .then(data => {
            if (existingBotDiv) {
                existingBotDiv.querySelector(".message-text").textContent = data.response;
            } else {
                botDiv = createMessageDiv(data.response, "bot");
                messageSection.appendChild(botDiv);
            }
        })
        .catch(error => console.error("Error:", error));

        inputField.value = "";
        scrollToBottom();
    }

    function createMessageDiv(text, type) {
        let messageDiv = document.createElement("div");
        messageDiv.classList.add("message", type);

        let messageSpan = document.createElement("span");
        messageSpan.classList.add("message-text");
        messageSpan.textContent = text;
        messageDiv.appendChild(messageSpan);

        let ttsButton = createTTSButton(text);
        messageDiv.appendChild(ttsButton);

        if (type === "user") {
            let editButton = createEditButton(messageSpan, messageDiv);
            messageDiv.appendChild(editButton);
        }

        return messageDiv;
    }

    function createEditButton(messageSpan, userDiv) {
        let editButton = document.createElement("button");
        editButton.innerHTML = "✏️";
        editButton.classList.add("edit-button");
        editButton.onclick = function () {
            let updatedText = prompt("Edit your message:", messageSpan.textContent);
            if (updatedText !== null && updatedText.trim() !== "") {
                let botDiv = userDiv.nextElementSibling;
                sendMessage(updatedText, userDiv, botDiv);
            }
        };
        return editButton;
    }

    function createTTSButton(text) {
        let ttsButton = document.createElement("button");
        ttsButton.innerHTML = "🔊";
        ttsButton.classList.add("tts-button");
        ttsButton.onclick = () => speakText(text);
        return ttsButton;
    }

    function speakText(text) {
        let speech = new SpeechSynthesisUtterance(text);
        speech.lang = "en-US";
        speechSynthesis.speak(speech);
    }

    function startVoiceRecognition() {
        let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.start();

        recognition.onresult = function (event) {
            let transcript = event.results[0][0].transcript;
            inputField.value = transcript;
        };

        recognition.onerror = function () {
            alert("Voice recognition error. Please try again.");
        };
    }

    let micButton = document.getElementById("mic");
    micButton.onclick = startVoiceRecognition;

    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") sendMessage();
    });

    function scrollToBottom() {
        messageSection.scrollTop = messageSection.scrollHeight;
    }

    // Initial welcome message with fade-in effect
    let welcomeMessage = createMessageDiv("WELCOME TO CHATTER BOX! HOW CAN I HELP YOU 😊", "bot");
    welcomeMessage.style.opacity = "0";
    messageSection.appendChild(welcomeMessage);

    setTimeout(() => {
        welcomeMessage.style.transition = "opacity 0.8s ease-in-out";
        welcomeMessage.style.opacity = "1";
    }, 300);
});
