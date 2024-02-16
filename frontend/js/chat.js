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
typingIndicator.innerText = 'Agent is typing...';

<<<<<<< HEAD
class ChatSession {
    constructor() {
        this.conversationHistory = [];
        this.typingDelay = 10000;
        this.conversationId = localStorage.getItem('conversationId');
        this.init();
    }
=======
// Disable the message input field and the send message button initially
messageInput.disabled = true;
sendMessageButton.disabled = true;


function simulateChat() {
    let agentIndex;
    do {
        agentIndex = Math.floor(Math.random() * agents.length);
    } while (agentIndex === lastAgentIndex);
    lastAgentIndex = agentIndex;

    const agent = agents[agentIndex];
    const message = generateRandomMessage();

    simulateTyping(agent, message);
}
// frontend/js/chat.js
// ... rest of your code

const agents = ['Agent 1', 'Agent 2', 'Agent 3']; // Add this line to your chat.js file


// Initialize an empty array to store the conversation history
let conversationHistory = [];

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000

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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)

    init() {
        this.startChatSession();
        messageInput.disabled = true;
        sendMessageButton.disabled = true;
        this.attachEventListeners();
    }
<<<<<<< HEAD

    startChatSession() {
        fetch('/start-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                this.conversationId = data.conversationId;
                localStorage.setItem('conversationId', this.conversationId);
            })
            .catch(error => console.error('Error starting chat session:', error));
    }

    sendMessageToOpenAI(message) {
        if (!this.conversationId) {
            console.error('Conversation ID is missing.');
            return;
        }

=======
}
const eventSource = new EventSource('/events');

eventSource.addEventListener('typing', (event) => {
    showTypingIndicator(event.data);
});

function simulateTyping(agentName, message) {
    showTypingIndicator(agentName);
    setTimeout(() => {
        appendMessage(message, false, 'images/avatar_1.png', 'agent');
    }, 2000); // Adjust this delay as needed
}

eventSource.addEventListener('message', (event) => {
    appendMessage(event.data);
});

window.onload = function () {
    simulateChat();
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

function showTypingIndicator(agentName) {
    typingIndicator.innerText = `${agentName} is typing...`;
    messageContainer.appendChild(typingIndicator);
}

function hideTypingIndicator() {
    if (typingIndicator.parentNode === messageContainer) {
        messageContainer.removeChild(typingIndicator);
    }
}

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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)
        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
<<<<<<< HEAD
            body: JSON.stringify({ firstName, badgeName, message: messageText, conversationId: 'your_unique_conversation_id', conversationHistory })        })
=======
<<<<<<< HEAD
            body: JSON.stringify({
                conversationId: this.conversationId,
                message: message,
                conversationHistory: this.conversationHistory
            })
        })
>>>>>>> parent of 2796f14 (Merge branch 'stable_version')
            .then(response => response.json())
            .then(data => {
                if (data.responses && data.responses.length > 0) {
                    data.responses.forEach((response) => {
                        setTimeout(() => {
                            this.appendMessage(`${response.role}: ${response.content}`, true);
                        }, response.delay);
                    });
                } else {
                    console.error('Unexpected response structure:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    appendMessage(messageText, isAgent = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const avatarElement = document.createElement('img');
        avatarElement.classList.add('avatar');
        avatarElement.src = 'images/avatar_1.png';
        const textElement = document.createElement('div');
        textElement.innerText = messageText;
        textElement.classList.add('text');
        messageElement.appendChild(avatarElement);
        messageElement.appendChild(textElement);
        messageContainer.append(messageElement);
        this.conversationHistory.push({ role: isAgent ? 'agent' : badgeName, content: messageText });
        return messageElement;
    }

    attachEventListeners() {
        sendMessageButton.addEventListener('click', () => {
            const message = messageInput.value;
            this.showTypingIndicator(badgeName);
            setTimeout(() => {
                this.appendMessage(message, false);
                this.sendMessageToOpenAI(message);
            }, this.typingDelay);
        });

        raiseHandButton.addEventListener('click', () => {
            messageInput.disabled = false;
            sendMessageButton.disabled = false;
        });
    }

    showTypingIndicator(agentName) {
        typingIndicator.innerText = `${agentName} is typing...`;
        messageContainer.appendChild(typingIndicator);
    }

    hideTypingIndicator() {
        if (typingIndicator.parentNode === messageContainer) {
            messageContainer.removeChild(typingIndicator);
        }
    }
}

const chatSession = new ChatSession();
=======
            body: JSON.stringify({ firstName, badgeName, message: "", conversationHistory }) // Pass an empty string as message
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
        let messageElement = appendMessage(`${agent} is typing...`, false, 'images/avatar_1.png', `agent-${agentIndex + 1}`);

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
                            conversationHistory.push(`${response.role}: ${response.content}`);
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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)
