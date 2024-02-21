// chat.js
if (!localStorage.getItem('badgeName')) {
    window.location.href = 'login.html';
}
const firstName = localStorage.getItem('firstName');
// Import agentBadge from app.js
const agentBadge = localStorage.getItem('{agentBadge');
console.log(`Agent Badge: ${agentBadge}`); // Print agentBadge to console
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const raiseHandButton = document.getElementById('raiseHandButton');
const messageContainer = document.getElementById('chatWindow');
const typingIndicator = document.createElement('div');
const message = messageInput.value;
const participantAvatar = document.getElementById('participantAvatar');
const selectedAvatar = localStorage.getItem('selectedAvatar');
if (selectedAvatar) {
    participantAvatar.src = selectedAvatar;
}
typingIndicator.innerText = 'Agent is typing...';

// Disable the message input field and the send message button initially
messageInput.disabled = true;
sendMessageButton.disabled = true;

// Initialize an empty array to store the conversation history
let conversationHistory = [];

let taskCompleteCount = 0;

let activeMessages = 0;

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000
const agents = {
    'James': { agentName: 'James', avatar: 'avatars/avatar_2.png', isAgent: true, typingSpeed: 160, agentBadge: 'Master of Motivation' },
    'Sophia': { agentName: 'Sophia', avatar: 'avatars/avatar_3.png', isAgent: true, typingSpeed: 180, agentBadge: 'Strategist Supreme' },
    'Ethan': { agentName: 'Ethan', avatar: 'avatars/avatar_6.png', isAgent: true, typingSpeed: 200, agentBadge: 'Logic Luminary' }
};// Corrected avatar paths to be consistent with the appendMessage function, added typingSpeed for each agent, and added agentBadge name to match @app.js
// This function is called to initiate a new chat session

document.addEventListener('DOMContentLoaded', function () {
    // Retrieve the first name and badge name from localStorage
    const firstName = localStorage.getItem('firstName');
    const badgeName = localStorage.getItem('badgeName');

    // Find the span elements by their IDs and set their text content
    document.getElementById('firstName').textContent = firstName;
    document.getElementById('badgeName').textContent = badgeName;

    // Display join alerts for James and Sophia immediately
    displayJoinAlert('James has joined the chat.');
    displayJoinAlert('Sophia has joined the chat.');

    // Simulate Ethan joining after a short delay
    setTimeout(() => {
        displayJoinAlert('Ethan has joined the chat.');
    }, 3000); // Adjust the delay as needed
});

function startNewChat() {
    fetch('/start-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            // Store the conversationId received from the server in localStorage
            localStorage.setItem('currentConversationId', data.conversationId);
            console.log(`OH YEAH, New chat started with ID: ${data.conversationId}`);
            // Add James' introduction message to conversationHistory in the specified format
        })
        .catch(error => console.error('Error starting new chat:', error));
}

function appendMessageAfterTyping(messageText, isAgent = false, agentName) {
    // Default typing speed for participants
    let typingSpeed = 200;

    // If it's an agent's message, find the agent and use their typing speed
    if (isAgent && agentName && agents.hasOwnProperty(agentName)) {
        const agent = agents[agentName];
        if (agent) {
            typingSpeed = agent.typingSpeed;
        }
    }

    const typingDuration = (messageText.length / typingSpeed) * 1000; // Calculate pause based on message length

    // Show typing indicator for the calculated duration
    showTypingIndicator(agentName);
    setTimeout(() => {
        hideTypingIndicator(agentName); // Hide typing indicator when message is ready to appear
        appendMessage(messageText, isAgent, agentName); // Append the message after the typing indicator ends
    }, typingDuration);
}

function appendMessage(messageText, isAgent = false, agentName, isParticipant = false) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const avatarElement = document.createElement('img');
    avatarElement.classList.add('avatar');

    if (isParticipant) {
        messageElement.classList.add('participant');
    } else if (isAgent) {
        messageElement.classList.add(`agent-${agentName}`);
    }

    // Determine the avatar image source based on the agent's name or if it's the participant
    let avatarSrc;
    if (isAgent) {
        const agent = Object.values(agents).find(agent => agent.agentName === agentName);
        avatarSrc = agent ? agent.avatar : 'default_agent_avatar.png'; // Fallback to a default agent avatar if not found
    } else {
        avatarSrc = localStorage.getItem('selectedAvatar'); // Use the participant's selected avatar
    }
    avatarElement.src = avatarSrc;

    const textElement = document.createElement('div');
    textElement.classList.add('text');

    // Prepend the badge name and first name to the participant's message or use the agent's name
    if (!isAgent) {
        const badgeName = localStorage.getItem('badgeName');
        textElement.innerText = `${firstName} (${badgeName}): ${messageText}`;
        // Add the participant's message to the conversation history with their badge name and first name
        conversationHistory.push({ role: ` ${badgeName} (${firstName})`, content: messageText, isParticipant: true });
    } else {
        // Retrieve the agent's badge from the agents object using the agentName
        const agentBadge = agents[agentName] ? agents[agentName].agentBadge : 'Unknown'; // Retrieve the agent's badge
        textElement.innerText = `${agentName} (${agentBadge}): ${messageText}`;
        // If the message is from an agent, add it to the conversation history with the agent's name and badge
        conversationHistory.push({ role: `${agentBadge} (${agentName})`, content: messageText, isParticipant: false });
    }
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(textElement);
    messageContainer.append(messageElement);

    // Check for "task-complete" messages in conversationHistory
    const taskCompleteMessages = conversationHistory.filter(message => message.content.toLowerCase().includes("task-complete")).length;

    // Redirect if there are 3 or more "task-complete" messages
    if (taskCompleteMessages >= 3) {
        window.location.href = 'simulation_end.html'; // Replace 'simulation_end.html' with the actual path if different
    }

    messageContainer.scrollTop = messageContainer.scrollHeight; // Scrolls to the bottom

    // New code to save the message after it's appended
    fetch('/save-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            conversationId: localStorage.getItem('currentConversationId'),
            message: {
                role: isAgent ? agentName : `${badgeName} (${firstName})`,
                content: messageText
            }
        })
    });

    return messageElement;
}

function showTypingIndicator(agentName) {
    activeMessages++; // Increment
    let typingIndicator = document.createElement('div');
    typingIndicator.innerText = `${agentName} is typing...`;
    typingIndicator.id = `typing-${agentName}`; // Unique ID for each agent's typing indicator
    messageContainer.appendChild(typingIndicator);
    // Removed the setTimeout here as the delay is now handled in appendMessageAfterTyping
}

function hideTypingIndicator(agentName) {
    let typingIndicator = document.getElementById(`typing-${agentName}`);
    if (typingIndicator && typingIndicator.parentNode === messageContainer) {
        messageContainer.removeChild(typingIndicator);
        activeMessages--; // Decrement
        if (activeMessages === 0) {
            // All messages have been processed, safe to fetch new messages
            fetchResponses(); 
        }
    }
}

const eventSource = new EventSource('/events');

eventSource.addEventListener('typing', (event) => {
    showTypingIndicator(event.data);
});

function simulateTyping(agentName, message) {
    return new Promise((resolve) => {
        // Find the agent object by searching for an agentName match
        const agentKey = Object.keys(agents).find(key => agents[key].agentName === agentName);
        const agent = agents[agentKey];

        if (!agent) {
            console.error('Agent not found:', agentName);
            resolve(); // Resolve the promise even if the agent is not found to avoid hanging
            return;
        }

        // Now, agent is correctly found, and you can access its properties like agent.avatar or agent.typingSpeed
        // Calculate delay based on the message length and agent's typing speed
        // Assuming you add typingSpeed to your agents' properties
        const typingSpeed = agent.typingSpeed / 60; // Convert to characters per second
        const messageLength = message.length;
        const typingDuration = (messageLength / typingSpeed) * 1000; // Convert to milliseconds

        showTypingIndicator(agentName);
        setTimeout(() => {
            appendMessage(message, true, agentName); // Ensure isAgent is true for agents
            hideTypingIndicator(agentName); // Hide the typing indicator after the message is appended
            resolve(); // Resolve the promise after the delay and actions are completed
        }, typingDuration); // Use the calculated typing duration
    });
}

document.addEventListener('DOMContentLoaded', function() {
    startNewChat(); // This will trigger the startNewChat function as soon as the DOM is fully loaded
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
    const messageText = `${messageInput.value}`;
    console.log('Send button clicked');

    // Simulate user typing similar to agent's typing mechanism
    appendMessageAfterTyping(messageText, false, `${badgeName} (${firstName})`); // Use appendMessageAfterTyping for user's message

    // Wait for a specified delay, then make a request to the '/ask-openai' endpoint
    setTimeout(() => {
        const currentConversationId = localStorage.getItem('currentConversationId'); // Correct place to get it

        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ firstName, badgeName, message: messageText, conversationHistory, conversationId: currentConversationId }) // Pass the message from the input field
        })
            .then(response => response.json())
            .then(data => {
                // Now remove the "typing..." message
                hideTypingIndicator(`${badgeName} (${firstName})`);

                // Extract the currentAgentName from the response to use as agentName
                const agentName = data.currentAgentName; // This line is added to utilize "currentAgentName" from the backend
                const messageText = messageInput.value;
                // Existing code to handle message sending
                // When constructing the message object, add isParticipant: true
                const messageObject = { role: `${badgeName} (${firstName})`, content: messageText, isParticipant: true };
                // Existing code to send the message to the server
                // Check if data.responses exists and is not empty
                if (data.responses && data.responses.length > 0) {
                    data.responses.forEach((response, index) => {
                        // Use appendMessageAfterTyping to simulate typing and display the message
                        appendMessageAfterTyping(response.content, true, response.role); // Display the message
                        conversationHistory.push({ role: response.role, content: response.content }); // Add to conversation history
                    });
                } else {
                    console.error('Unexpected response structure:', data);
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

// Function to display join alerts
function displayJoinAlert(message) {
    const alertElement = document.createElement('div');
    alertElement.textContent = message;
    alertElement.style.fontStyle = 'italic';
    alertElement.style.marginBottom = '10px';
    messageContainer.prepend(alertElement); // Prepend to ensure it stays at the top
}

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
    const currentConversationId = localStorage.getItem('currentConversationId'); // Retrieve the stored ID

    // Check if it's the first call to simulateChat by checking the length of conversationHistory
    if (conversationHistory.length === 0) {
        // Predefined introduction message from Agent 1 (James)
        const introductionMessage = {
            role: 'Agent 1',
            content: "Hey team, James here! Excited to work with you all on finding the perfect spot for our new restaurant. How about we start by discussing what type of strategy we should take before we share specfic unique information? How should we go about solving this task correctly?"
        };

        // Display "typing..." message with James's name
        let messageElement = appendMessage(`James is typing...`, true, "James");

        // Replace the "typing..." message with the actual message after a delay
        setTimeout(() => {
            // Ensure the first message starts with James:
            let firstResponse = `James (Master of Motivation): ${introductionMessage.content}`;
            let textElement = messageElement.querySelector('.text');
            textElement.textContent = firstResponse;
            conversationHistory.push({ role: "James", content: introductionMessage.content });
            // updateChatTranscript(conversationHistory); // Adjust this line if necessary based on your actual function's expected parameters

            // Fetch the response after displaying the introduction message
            fetchResponses();
        }, 10000); // Adjust delay as needed
    } else {
        // If not the first call, directly fetch responses
        fetchResponses();
    }
}



function fetchResponses() {
    if (activeMessages > 0) {
        // Still processing messages, exit early
        return;
    }
    const currentConversationId = localStorage.getItem('currentConversationId');
    fetch('/ask-openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
            body: JSON.stringify({
                firstName,
                badgeName,
                conversationHistory,
                conversationId: currentConversationId // Include this line
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.responses) {
                // Process responses
                data.responses.forEach(response => {
                    simulateTyping(response.role, `${response.content}`); // Use simulateTyping to show typing indicator before appending message
                    conversationHistory.push({ role: response.role, content: response.content });
                });

                // Call simulateChat again to keep the messages going
                simulateChat();
            } else {
                simulateChat(); // no responses, so runs again
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

function updateChatTranscript(conversationHistory) {
    fetch('/save-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            conversationId: localStorage.getItem('currentConversationId'),
            conversationHistory
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // Only parse as JSON if the response is ok
        })
        .then(data => console.log('Transcript updated successfully'))
        .catch(error => console.error('Error updating transcript:', error));
}