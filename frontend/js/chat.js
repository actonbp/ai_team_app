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

let taskCompleteCount = 0;

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000
const agents = {
    'Agent 1': { agentName: 'James', avatar: 'avatars/avatar_2.png', isAgent: true },
    'Agent 2': { agentName: 'Sophia', avatar: 'avatars/avatar_3.png', isAgent: true },
    'Agent 3': { agentName: 'Ethan', avatar: 'avatars/avatar_6.png', isAgent: true }
}; // Corrected avatar paths to be consistent with the appendMessage function
function appendMessage(messageText, isAgent = false, agentName) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    const avatarElement = document.createElement('img');
    avatarElement.classList.add('avatar');
    // Determine the avatar image source based on the agent's name
    const agent = Object.values(agents).find(agent => agent.agentName === agentName); // Find the agent object by name
    if (agent) {
        avatarElement.src = agent.avatar; // Use the avatar from the agent object
    }
    const textElement = document.createElement('div');
    textElement.innerText = `${messageText}`;
    textElement.classList.add('text');
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(textElement);
    messageContainer.append(messageElement);

    // Check for "task-complete" messages in conversationHistory
    const taskCompleteMessages = conversationHistory.filter(message => message.content.toLowerCase().includes("task-complete")).length;

    // Redirect if there are 3 or more "task-complete" messages
    if (taskCompleteMessages >= 3) {
        window.location.href = 'simulation_end.html'; // Replace 'next_page.html' with the actual path
    }
    // Adjusted to always treat messages as from an agent unless it's the participant typing in the chatbox
    if (!isAgent) {
        // If the message is from the user, show the user's badge name and add it to the conversation history
        conversationHistory.push({ role: badgeName, content: messageText });
    } else {
        // If the message is from an agent, add it to the conversation history with the agent's name
        conversationHistory.push({ role: agentName, content: messageText });
    }
    messageContainer.scrollTop = messageContainer.scrollHeight; // Scrolls to the bottom
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
        appendMessage(message, true, agentName); // Pass agentName to appendMessage, ensuring isAgent is true for agents
    }, 2000); // Adjust this delay as needed
}

eventSource.addEventListener('message', (event) => {
    const agentName = event.data.split(':')[0]; // Assuming the format "AgentName: message"
    const messageText = event.data.substring(agentName.length + 2); // +2 to skip ": "
    appendMessage(messageText, true, agentName); // Assuming all messages received through this event are from agents, corrected to include agentName
});

document.addEventListener('DOMContentLoaded', function() {
    var chatWindow = document.getElementById("chatWindow");
    var analysisWindow = document.getElementById("locationAnalysis");
    var helpButton = document.getElementById("helpButton");
    document.getElementById("chatTab").addEventListener("click", function() {
        chatWindow.style.display = 'block';
        analysisWindow.style.display = 'none';
        // Add any necessary logic for toggling active state
    });

    document.getElementById("locationTab").addEventListener("click", function() {
        chatWindow.style.display = 'none';
    });
    simulateChat(); // Add this line to start the chat automatically

    messageInput.disabled = false;
    sendMessageButton.disabled = false;
    // Stop the automatic chat
    clearInterval(chatInterval);
}); // Fixed misplaced closing bracket

// Event listener for the send message button
sendMessageButton.addEventListener('click', () => {
    const messageText = messageInput.value;
    console.log('Send button clicked');

    // Simulate user typing similar to agent's typing mechanism
    showTypingIndicator(badgeName); // Use the participant's badge name

    // Append the user's message immediately after the typing indicator
    appendMessage(messageText, false, badgeName); // Use false for isAgent and badgeName for the participant's name

    // Removed duplicate addition of the user's message to the conversation history

    // Wait for a specified delay, then make a request to the '/ask-openai' endpoint
    setTimeout(() => {
        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, badgeName, message: messageText, conversationId: 'your_unique_conversation_id', conversationHistory })        })
            .then(response => response.json())
            .then(data => {
                // Now remove the "typing..." message
                hideTypingIndicator();

                // Extract the currentAgentName from the response to use as agentName
                const agentName = data.currentAgentName; // This line is added to utilize "currentAgentName" from the backend

                // Check if data.responses exists and is not empty
                if (data.responses && data.responses.length > 0) {
                    // Then append the actual message after the delay
                    data.responses.forEach((response) => {
                        setTimeout(() => {
                            appendMessage(response.content, true, agentName); // Use the extracted agentName for appending messages
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
    // Clear the previous interval
    clearInterval(chatInterval);

    // Fetch the response first to get the current agent's name
    fetch('/ask-openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ firstName, badgeName, conversationHistory })
    })
        .then(response => response.json())
        .then(data => {
            if (data && data.responses && data.currentAgentName) {
                // Display "typing..." message with the correct agent's name
                let messageElement = appendMessage(`${data.currentAgentName} is typing...`, true, data.currentAgentName);

                // Replace the "typing..." message with the actual message after a delay
                setTimeout(() => {
                    data.responses.forEach(response => {
                        let textElement = messageElement.querySelector('.text');
                        textElement.textContent = `${response.role}: ${response.content}`;
                        conversationHistory.push({ role: response.role, content: response.content });
                    });

                    // Call simulateChat again to keep the messages going
                    simulateChat();
                }, 10000); // Adjust delay as needed
            } else {
                console.error('Unexpected response data:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}