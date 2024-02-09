// chat.js
if (!localStorage.getItem('badgeName')) {
    window.location.href = 'login.html';
}
const firstName = localStorage.getItem('firstName');
const badgeName = localStorage.getItem('badgeName');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const raiseHandButton = document.getElementById('raiseHandButton');
const messageContainer = document.getElementById('chatWindow');
const typingIndicator = document.createElement('div');
const message = messageInput.value;
typingIndicator.innerText = 'Agent is typing...';

// Disable the message input field and the send message button initially
messageInput.disabled = true;
sendMessageButton.disabled = true;

// Initialize an empty array to store the conversation history
let conversationHistory = [];

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000

const agents = ['Agent 1', 'Agent 2', 'Agent 3']; // Add this line to your chat.js file

function appendMessage(messageText, isAgent = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    const avatarElement = document.createElement('img');
    avatarElement.classList.add('avatar');
    avatarElement.src = 'images/avatar_1.png'; // Set the avatar image source for all messages
    const textElement = document.createElement('div');
    textElement.innerText = messageText;
    textElement.classList.add('text');
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(textElement);
    messageContainer.append(messageElement);
    if (isAgent) {
        // If the message is from an agent, add it to the conversation history
        conversationHistory.push({ role: 'agent', content: messageText });
    } else {
        // If the message is from the user, show the user's badge name and add it to the conversation history
        conversationHistory.push({ role: badgeName, content: messageText });
    }
    return messageElement;
}

function showTypingIndicator(agentName) {
    typingIndicator.innerText = `${agentName} is typing...`;
    messageContainer.appendChild(typingIndicator);
}

function hideTypingIndicator() {
    if (typingIndicator.parentNode === messageContainer) {
        messageContainer.removeChild(typingIndicator);
    }
}

const eventSource = new EventSource('/events');

eventSource.addEventListener('typing', (event) => {
    showTypingIndicator(event.data);
});

function simulateTyping(agentName, message) {
    showTypingIndicator(agentName);
    setTimeout(() => {
        appendMessage(message, true);
    }, 2000); // Adjust this delay as needed
}

eventSource.addEventListener('message', (event) => {
    appendMessage(event.data);
});

window.onload = function () {
    simulateChat();
};

// Event listener for the "Raise Hand to Participate" button
raiseHandButton.addEventListener('click', () => {
    // Enable the message input field and the send message button
    messageInput.disabled = false;
    sendMessageButton.disabled = false;
    // Stop the automatic chat
    clearInterval(chatInterval);
});

// Event listener for the send message button
sendMessageButton.addEventListener('click', () => {
    // Simulate user typing similar to agent's typing mechanism
    showTypingIndicator(badgeName); // Show the user's badge name as the name for the text bubble

    // Wait for a specified delay, then make a request to the '/ask-openai' endpoint
    setTimeout(() => {
        // Append the user's message immediately after the typing indicator
        appendMessage(messageInput.value, false); // Use the user's badge name as the agentRole parameter
        conversationHistory.push({ role: badgeName, content: messageInput.value }); // Add the user's message to the conversation history

        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, badgeName, message: messageInput.value, conversationHistory }) // Pass the message from the input field
        })
        .then(response => response.json())
        .then(data => {
            // Now remove the "typing..." message
            hideTypingIndicator();

            // Check if data.responses exists and is not empty
            if (data.responses && data.responses.length > 0) {
                // Then append the actual message after the delay
                data.responses.forEach((response) => {
                    setTimeout(() => {
                        appendMessage(`${response.role}: ${response.content}`, true);
                    }, response.delay); // Use the delay provided by the backend for each message
                });
            } else {
                console.error('Unexpected response structure:', data);
                // Handle the case where data.responses is not as expected
                // For example, display a default message or log an error
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // Handle any errors that occurred during the fetch
        });
    }, typingDelay); // typingDelay is the time you show the typing indicator for
});

let messageIndex = 0;
const messages = [
    "Hello everyone!",
    "Let's get started."
];

// Function to generate a random message
function generateRandomMessage() {
    const message = messages[messageIndex];
    messageIndex = (messageIndex + 1) % messages.length; // Cycle through the messages array
    return message;
}

let lastAgentIndex = null;

function simulateChat() {
    let message = ""; // may need to change this
    let agentIndex;
    do {
        agentIndex = Math.floor(Math.random() * agents.length);
    } while (agents.length > 1 && agentIndex === lastAgentIndex);
    lastAgentIndex = agentIndex;

    const agent = agents[agentIndex];

    clearInterval(chatInterval); // Clear the previous interval

    // Short delay before showing "Typing"
    setTimeout(() => {
        let messageElement = appendMessage(`${agent} is typing...`, true);

        // Long delay before sending the actual message
        setTimeout(() => {
            fetch('/ask-openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ firstName, badgeName, conversationHistory }) // Pass the conversationHistory here
            })
            .then(response => response.json())
            .then(data => {
                if (data && data.responses) {
                    // Replace the "typing..." message with the actual message
                    data.responses.forEach(response => {
                        let textElement = messageElement.querySelector('.text');
                        textElement.textContent = `${response.role}: ${response.content}`; // Use textContent instead of innerText
                        conversationHistory.push({ role: response.role, content: response.content });
                    });

                    // Call simulateChat again to keep the messages going
                    simulateChat();
                } else {
                    console.error('Unexpected response data:', data);
                }
            });
        }, 10000); // Long delay
    }, 5000);
}
// Start the automatic chat
chatInterval = setInterval(simulateChat, 5000); // 30 seconds interval
