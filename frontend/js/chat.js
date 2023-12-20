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

// frontend/js/chat.js
// ... rest of your code

const agents = ['Agent 1', 'Agent 2', 'Agent 3']; // Add this line to your chat.js file


// Initialize an empty array to store the conversation history
let conversationHistory = [];

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000

window.onload = function () {
    // Short delay before showing "Typing"
    setTimeout(() => {
        const typingElement = appendMessage(`Agent is typing...`);

        // Long delay before sending the actual message
        setTimeout(() => {
            typingElement.remove();

            fetch('/start')
                .then(response => response.json())
                .then(data => {
                    // Display the initial responses in your chat and add them to the conversation history
                    data.responses.forEach(response => {
                    appendMessage(`${response.role}: ${response.content}`, false, 'images/avatar_1.png', response.role.toLowerCase().replace(' ', '-'));                   
                 });
                    // Start the automatic chat
                    chatInterval = setInterval(() => {
                        fetch('/ask-openai', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                firstName,
                                badgeName,
                                message: generateRandomMessage() // Assuming you have a function to generate a random message
                            })
                        })
                            .then(response => response.json())
                            .then(data => {
                                // Display the responses in your chat and add them to the conversation history
                                data.responses.forEach(response => {
                                    appendMessage(`${response.role}: ${response.content}`, false, 'images/avatar_1.png', response.role.toLowerCase());
                                    conversationHistory.push(`${response.role}: ${response.content}`);
                                });
                            })
                            .catch(error => {
                                console.error('Fetch error:', error);
                            });
                    }, 20000); // Fetch new responses every 20 seconds
                });
        }, 10000); // Long delay
    }, 5000); // Short delay
};

// ... rest of your code

// Event listener for the "Raise Hand to Participate" button
raiseHandButton.addEventListener('click', () => {
    // Enable the message input field and the send message button
    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    // Stop the automatic chat
    clearInterval(chatInterval);
});


// ... rest of your code

// Event listener for the "Raise Hand to Participate" button
raiseHandButton.addEventListener('click', () => {
    // Enable the message input field and the send message button
    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    // Stop the automatic chat
    clearInterval(chatInterval);
});

// ... rest of your code

// ... rest of your code

function appendMessage(messageText, sentByUser, avatarSrc, agentRole) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(sentByUser ? 'sent' : 'received', agentRole);       
        if (!sentByUser && agentRole) {
            messageElement.classList.add(agentRole);
        }
        const avatar = document.createElement('img');
        avatar.src = avatarSrc;
        avatar.classList.add('avatar');
        messageElement.appendChild(avatar);
        const textElement = document.createElement('div');
        textElement.innerText = messageText;
        textElement.classList.add('text');
        messageElement.appendChild(textElement);
        messageContainer.append(messageElement);
        return messageElement;
    }

// Event listener for the send message button
sendMessageButton.addEventListener('click', () => {
    // Append the "typing..." message immediately
    appendMessage(`Agent is typing...`);

    // Wait for a specified delay, then make a request to the '/ask-openai' endpoint
    setTimeout(() => {
        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, badgeName, message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Now remove the "typing..." message
            messageContainer.removeChild(messageContainer.lastChild);

            // Then append the actual message after the delay
            setTimeout(() => {
                appendMessage(`${data.responses[1].role}: ${data.responses[1].content}`);
                       }, data.responses[1].delay); // Use the delay provided by the backend
        });
    }, typingDelay); // typingDelay is the time you show the typing indicator for
});

// Event listener for the "Raise Hand to Participate" button
raiseHandButton.addEventListener('click', () => {
    // Enable the message input field and the send message button
    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    // Stop the automatic chat
    clearInterval(chatInterval);
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

// frontend/js/chat.js

// frontend/js/chat.js

// frontend/js/chat.js

let lastAgentIndex = null;

function simulateChat() {
    let agentIndex;
    do {
        agentIndex = Math.floor(Math.random() * agents.length);
    } while (agentIndex === lastAgentIndex);
    lastAgentIndex = agentIndex;

    const agent = agents[agentIndex];
    // Short delay before showing "Typing"
    setTimeout(() => {
        const typingElement = appendMessage(`${agent} is typing...`, false, 'images/avatar_1.png');

        // Long delay before sending the actual message
        setTimeout(() => {
            typingElement.remove();

            fetch('/ask-openai', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ firstName, badgeName, message: generateRandomMessage() })
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.responses) {
                        // Display the responses in your chat and add them to the conversation history
                        data.responses.forEach(response => {
                        appendMessage(`${response.role}: ${response.content}`, false, 'images/avatar_1.png', response.role.toLowerCase().replace(' ', '-'));                            conversationHistory.push(`${response.role}: ${response.content}`);
                        });
                    } else {
                        console.error('Unexpected response data:', data);
                    }
                });
        }, 20000); // Long delay
    }, 10000); // Short delay
}


// Start the automatic chat
chatInterval = setInterval(simulateChat, 5000); // 30 seconds interval