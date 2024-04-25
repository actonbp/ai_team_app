// chat.js
// Get the Prolific ID pop-up container and the main app container

const firstName = localStorage.getItem('firstName');
const badgeName = localStorage.getItem('badgeName');

if (!localStorage.getItem('firstName')) {
    window.location.href = 'login.html';
}// Retrieve first name and badge name from localStorage

// Import team_race from app.js// Assuming agentsOptions is defined globally or imported from another script that has access to app.js exports
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const raiseHandButton = document.getElementById('raiseHandButton');
const messageContainer = document.getElementById('chatWindow');
const typingIndicator = document.createElement('div');
const message = messageInput.value;
const self_cond = localStorage.getItem('self_cond');
const participantAvatar = document.getElementById('participantAvatar');
const selectedAvatar = localStorage.getItem('selectedAvatar');
if (selectedAvatar) {
    participantAvatar.src = selectedAvatar;
}
typingIndicator.innerText = `${localStorage.getItem('self_cond') === 'public' ? `${firstName} (${badgeName}) is typing...` : `${firstName} is typing...`}`;
// Disable the message input field and the send message button initially
messageInput.style.display = 'none';
sendMessageButton.style.display = 'none';

// Initialize an empty array to store the conversation history
const conversationId = localStorage.getItem('currentConversationId');
let conversationHistory = JSON.parse(localStorage.getItem(`conversationHistory_${conversationId}`)) || [];


let taskCompleteCount = parseInt(localStorage.getItem(`taskCompleteCount_${conversationId}`)) || 0;

let activeMessages = 0;

// Define chatInterval outside of window.onload
let chatInterval;

// Set an interval to check for chat completion every 30 seconds
function checkAllTasksComplete() {
    const conversationId = localStorage.getItem('currentConversationId'); // Retrieve the current conversation ID from localStorage
    fetch(`/check-tasks-complete?conversationId=${conversationId}`, { // Add the conversationID as a query parameter
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.shouldRedirect) {
                window.location.href = 'end.html';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function adjustBubbleWidths() {
    const bubbles = document.querySelectorAll('.chat-bubble');
    bubbles.forEach(bubble => {
        const text = bubble.innerText;
        const lastWord = text.split(" ").pop();
        const measureDiv = document.createElement('div');
        measureDiv.style.display = 'inline-block';
        measureDiv.innerText = lastWord;
        document.body.appendChild(measureDiv);
        const width = measureDiv.offsetWidth;
        document.body.removeChild(measureDiv);
        bubble.style.width = `${width}px`;
    });
}

setTimeout(() => {
    chatInterval = setInterval(checkAllTasksComplete, 10000); // Start checking if all tasks are complete every 10 seconds, beginning 3 minutes after page load
}, 60000); // 180000 milliseconds = 3 minutes

let agents = {};

typingDelay = 2000
// Clearing the agents object before redefining it

const agentsOptions = {
    B: {
        'James': { agentName: 'James', avatar: 'avatars/majority/avatar_1.png', isAgent: true, typingSpeed: 100, agentBadge: 'Master of Motivation', color: 'rgba(255, 215, 0, 0.5)', colorRGB: { r: 255, g: 215, b: 0 } },
        'Sophia': { agentName: 'Sophia', avatar: 'avatars/majority/avatar_2.png', isAgent: true, typingSpeed: 120, agentBadge: 'Strategist Supreme', color: 'rgba(255, 105, 180, 0.5)', colorRGB: { r: 255, g: 105, b: 180 } },
        'Ethan': { agentName: 'Ethan', avatar: 'avatars/majority/avatar_3.png', isAgent: true, typingSpeed: 140, agentBadge: 'Logic Luminary', color: 'rgba(30, 144, 255, 0.5)', colorRGB: { r: 30, g: 144, b: 255 } }
    },
    A: {
        'Maurice': { agentName: 'Maurice', avatar: 'avatars/minority/avatar_10.png', isAgent: true, typingSpeed: 100, agentBadge: 'Master of Motivation', color: 'rgba(255, 215, 0, 0.5)', colorRGB: { r: 255, g: 215, b: 0 } },
        'Ebony': { agentName: 'Ebony', avatar: 'avatars/minority/avatar_11.png', isAgent: true, typingSpeed: 120, agentBadge: 'Strategist Supreme', color: 'rgba(255, 105, 180, 0.5)', colorRGB: { r: 255, g: 105, b: 180 } },
        'Trevon': { agentName: 'Trevon', avatar: 'avatars/minority/avatar_13.png', isAgent: true, typingSpeed: 140, agentBadge: 'Logic Luminary', color: 'rgba(30, 144, 255, 0.5)', colorRGB: { r: 30, g: 144, b: 255 } }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Check for a valid session ID
    if (!localStorage.getItem('prolificId')) {
        window.location.href = 'index.html';
    } else {
        // Update last visited page
        localStorage.setItem('lastVisitedPage', window.location.pathname);

        const selfCond = localStorage.getItem('self_cond');
        if (selfCond === 'public') {
            // Execute existing logic that displays agent badges
            displayTeamMembers(); // Assuming this function or similar logic displays agent badges
        } else {
            // Modify or skip displaying agent badges based on your application's needs
            displayTeamMembersWithoutBadge(); // You might need to create this function to handle non-public conditions
        }

        document.getElementById('taskCompleteCheckbox').addEventListener('change', function () {
        // console.log('Checkbox clicked. Checking conditions...');
        checkAllTasksComplete();
        if (taskCompletionAgents >= 1) { // Assuming there are 2 agents, adjust condition as necessary
        }
        });
    }


    // Find the span elements by their IDs and set their text content using variables defined at the start of chat.js
    document.getElementById('firstName').textContent = localStorage.getItem('firstName');
    document.getElementById('badgeName').textContent = localStorage.getItem('badgeName');



    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('copy', (e) => e.preventDefault());
    messageInput.addEventListener('paste', (e) => e.preventDefault());

    // Add event listener for the Notes tab
    document.getElementById('notesTab').addEventListener('click', function () {
        document.getElementById('chatWindow').style.display = 'none';
        document.getElementById('locationAnalysis').style.display = 'none';
        document.getElementById('helpSection').style.display = 'none';
        document.getElementById('notesSection').style.display = 'block';
        this.classList.add('active-tab');
        document.getElementById('chatTab').classList.remove('active-tab');
        document.getElementById('locationTab').classList.remove('active-tab');
        document.getElementById('helpButton').classList.remove('active-tab');
    });
});

document.getElementById('chatTab').addEventListener('click', function () {
    document.getElementById('chatWindow').style.display = 'block';
    document.getElementById('locationAnalysis').style.display = 'none';
    document.getElementById('helpSection').style.display = 'none';
    document.getElementById('notesSection').style.display = 'none';
    this.classList.add('active-tab');
    document.getElementById('chatTab').classList.remove('active-tab');
    document.getElementById('locationTab').classList.remove('active-tab');
    document.getElementById('helpButton').classList.remove('active-tab');
    // Put anything you want to happen here when they click the chat button on the side.
    // Show the chat window
    // Add any additional logic needed for showing the chat and hiding other sections
});
function startNewChat() {
    const existingConversationId = localStorage.getItem('currentConversationId');
    if (!existingConversationId) {
        fetch('/start-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                self_cond: localStorage.getItem('self_cond'), // Ensure this matches what's stored in localStorage
                prolificId: localStorage.getItem('prolificId') // Correctly include prolificId
                // Remove the incorrect line setting team_race to prolificId
            })
        })
            .then(response => response.json())
            .then(data => {
                // Assuming the server response includes conversationId and team_race
                localStorage.setItem('team_race', data.team_race); // Store team_race in localStorage
                localStorage.setItem('currentConversationId', data.conversationId); // Store the conversationId in localStorage
                // console.log(`New chat started with ID: ${data.conversationId} for team race: ${data.team_race}`);
                // Set agents based on team_race
                agents = data.team_race === 'A' ? agentsOptions.A : agentsOptions.B;
                displayTeamMembers(); // Ensure agents are set
            })
            .catch(error => console.error('Error starting new chat:', error));
    } else {
        // If a conversationId exists, use the existing session data
        const team_race = localStorage.getItem('team_race');
        agents = team_race === 'A' ? agentsOptions.A : agentsOptions.B;
        displayTeamMembers(); // Ensure agents are set based on existing team_race
    }
}


// Initialize a variable to track the last response time
let lastResponseTime = Date.now();

// Function to update the last response time, call this whenever an agent responds
function updateLastResponseTime() {
    lastResponseTime = Date.now();
}

// Periodically check for inactivity
const inactivityCheckInterval = setInterval(() => {
    if (Date.now() - lastResponseTime > 500000) { // 60,000 milliseconds = 1 minute
        // fetchResponses(); // Attempt to fetch new responses
    }
}, 60000); // Check every minute

function showTypingIndicator(agentName) {
    let typingIndicator = document.getElementById(`typing-${agentName}`);
    if (!typingIndicator) {
        typingIndicator = document.createElement('div');
        typingIndicator.id = `typing-${agentName}`;
        typingIndicator.innerText = `${agentName} is typing...`;
        messageContainer.appendChild(typingIndicator);
    }
}

function hideTypingIndicator(agentName) {
    const typingIndicator = document.getElementById(`typing-${agentName}`);
    if (typingIndicator) {
        messageContainer.removeChild(typingIndicator);
    }
}

async function simulateTypingAndDisplayMessage(agentName, message) {
    showTypingIndicator(agentName);
    const delay = Math.random() * (10000 - 2000) + 2000; // Random delay between 2 and 10 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    hideTypingIndicator(agentName);
    appendMessage(message, true, agentName); // Ensure this function call matches how you currently display messages
}

function appendMessageAfterTyping(messageText, isAgent = false, agentName, avatar = null) {
    // Default typing speed for participants
    let typingSpeed = 100;

    // If it's an agent's message, find the agent and use their typing speed
    if (isAgent && agentName) {
        const agent = Object.values(agents).find(agent => agent.agentName === agentName);
        if (agent) {
            typingSpeed = agent.typingSpeed;
        }
    }

    const typingDuration = (messageText.length / typingSpeed) * (Math.random() * (3000 - 1000) + 1000); // Calculate pause based on message length
    // Show typing indicator for the calculated duration
    showTypingIndicator(agentName);
    setTimeout(() => {
        hideTypingIndicator(agentName); // Hide typing indicator when message is ready to appear
        appendMessage(messageText, isAgent, agentName, avatar); // Append the message after the typing indicator ends, passing the avatar if available
    }, typingDuration);
}


function splitMessage(message, maxLength) {
    let parts = [];
    let totalChunks = 0; // Initialize total chunks counter
    while (message.length > 0 && totalChunks < 3) { // Ensure no more than 3 messages
        if (message.length <= maxLength) {
            parts.push({text: message, pauseAfter: true});
            break;
        }
        let splitIndex = message.substring(0, maxLength).lastIndexOf('. ') + 1; // Prefer splitting at the end of sentences
        if (splitIndex <= 0) { // If no sentence end found, fallback to space
            let splitPoints = ['.', '?', '!', ','].map(punct => message.substring(0, maxLength).lastIndexOf(punct));
            let maxSplitPoint = Math.max(...splitPoints);
            splitIndex = maxSplitPoint > 0 ? maxSplitPoint + 1 : message.substring(0, maxLength).lastIndexOf(' ') + 1;
        }
        if (splitIndex <= 0) { // If no space found, use maxLength
            splitIndex = maxLength;
        }
        let chunk = message.substring(0, splitIndex).trim();
        parts.push({text: chunk, pauseAfter: true});
        message = message.substring(splitIndex).trim();
        totalChunks++; // Increment total chunks counter
    }
    // If the message was too long and got cut off, ensure the last part indicates continuation
    if (message.length > 0 && parts.length == 3) {
        parts[2].text += '...'; // Indicate the message continues
    }
    return parts;
}
function appendMessage(messageText, isAgent = false, agentName, avatar = null, isParticipant = false, badgeName, isJoinMessage = false) {
    const maxLength = Math.floor(Math.random() * (600 - 300 + 1)) + 300; // Define a max length for a message as a random number between 300 and 600
    if (messageText.length > maxLength) {
        const parts = splitMessage(messageText, maxLength);
        parts.forEach((part, index) => {
            setTimeout(() => {
                showTypingIndicator(agentName); // Show typing indicator
                const typingDuration = Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000; // Typing delay as a random number between 2000 and 10000
                setTimeout(() => {
                    hideTypingIndicator(agentName); // Hide typing indicator
                    let messageWithNumber = parts.length > 1 ? `${index + 1}/${parts.length}: ${part.text}` : part.text;
                    // Directly call appendMessage for each part with the modified message text
                    appendMessage(messageWithNumber, isAgent, agentName, avatar, isParticipant, badgeName, isJoinMessage);
                }, typingDuration);
            }, index * (Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000)); // Random delay between message parts
        });
        return; // Exit the function after handling split messages
    }

    // Existing logic to append message without splitting remains unchanged
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const avatarElement = document.createElement('img');
    avatarElement.classList.add('avatar');
    let agent;
    if (isAgent) {
        agent = agents[agentName]; // Simplified agent retrieval from the agents object
        messageElement.classList.add(`agent-${agentName}`);
        if (agent) {
            messageElement.style.backgroundColor = `rgba(${agent.colorRGB.r}, ${agent.colorRGB.g}, ${agent.colorRGB.b}, 0.25)`;
            messageElement.style.borderColor = agent.color;
        }
        messageElement.style.borderWidth = "2px";
        messageElement.style.borderStyle = "solid";
    } else {
        messageElement.classList.add('participant');
        messageElement.style.border = "2px solid #ff0000";
        messageElement.style.borderRadius = "20px";
        messageElement.style.padding = "10px";
    }

    // Determine the avatar image source based on the agent's name or if it's the participant
    let avatarSrc;
    if (isAgent) {
        avatarSrc = avatar ? avatar : 'default_agent_avatar.png'; // Use the passed avatar URL if available, otherwise fallback to a default
    } else {
        avatarSrc = localStorage.getItem('selectedAvatar'); // Use the participant's selected avatar
        messageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.25)'; // Lighter red whitish opacity hue
    }
    avatarElement.src = avatarSrc;

    const textElement = document.createElement('div');
    textElement.classList.add('text');
    if (isJoinMessage) {
        // Create a simple text element for join messages
        const joinTextElement = document.createElement('div');
        joinTextElement.innerText = messageText;
        joinTextElement.style.color = 'gray';
        joinTextElement.classList.add('join-message-plain'); // Ensure this class does not add bubble-like styles
        messageContainer.appendChild(joinTextElement); // Append directly to the message container
        return; // Skip the rest of the function to avoid adding bubble styling
    }

    const participantBadgeName = localStorage.getItem('badgeName');
    // Predefined introduction message from Agent 1 (James) including the participant's badge name
    if (!isAgent) {
        // Prepend the first name to the participant's message and conditionally include the badge name based on public condition
        textElement.innerText = `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${participantBadgeName})` : ''}: ${messageText}`;
        // Add the participant's message to the conversation history with their first name and conditionally include the badge name based on public condition
        conversationHistory.push({ role: `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${badgeName})` : ''}`, content: messageText, isParticipant: true });

        // console.log('Participant message appended:', messageText);

    } else {
        // Retrieve the agent's badge from the agents object using the agentName and conditionally include it based on public condition
        const agentBadge = agent ? agent.agentBadge : 'Unknown'; // Retrieve the agent's badge
        textElement.innerText = `${agentName} ${localStorage.getItem('self_cond') === 'public' ? `(${agentBadge})` : ''}: ${messageText}`;
        // If the message is from an agent, add it to the conversation history with the agent's name and conditionally include the badge based on public condition
        conversationHistory.push({ role: `${agentName} ${localStorage.getItem('self_cond') === 'public' ? `(${agentBadge})` : ''}`, content: messageText, isParticipant: false });
    }
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(textElement);
    messageContainer.append(messageElement);

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

    // Save the updated conversation history in localStorage
    localStorage.setItem(`conversationHistory_${conversationId}`, JSON.stringify(conversationHistory));

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
function simulateTyping(agentKey, message) {
    return new Promise((resolve) => {
        // Retrieve agent details from the agents object using agentKey
        const agent = agents[agentKey];

        if (!agent) {
            console.error('Agent not found:', agentKey);
            resolve(); // Resolve the promise even if the agent is not found to avoid hanging
            return;
        }

        // Agent is correctly found, access its properties like agent.avatar or agent.typingSpeed directly
        const typingSpeed = agent.typingSpeed / 60; // Convert to characters per second
        const messageLength = message.length;
        const typingDuration = (messageLength / typingSpeed) * 250; // Convert to milliseconds

        showTypingIndicator(agent.agentName);
        setTimeout(() => {
            appendMessage(message, true, agent.agentName, agent.avatar); // Ensure isAgent is true for agents and pass the agent's avatar
            hideTypingIndicator(agent.agentName); // Hide the typing indicator after the message is appended
            resolve(); // Resolve the promise after the delay and actions are completed
        }, typingDuration); // Use the calculated typing duration
    });
}

document.addEventListener('DOMContentLoaded', function () {
    startNewChat(); // This will trigger the startNewChat function as soon as the DOM is fully loaded
    var chatWindow = document.getElementById("chatWindow");
    var analysisWindow = document.getElementById("locationAnalysis");
    var helpButton = document.getElementById("helpButton");
    document.getElementById("chatTab").addEventListener("click", function () {
        chatWindow.style.display = 'block';
        analysisWindow.style.display = 'none';
        // Add any necessary logic for toggling active state
    });

    document.getElementById("locationTab").addEventListener("click", function () {
        chatWindow.style.display = 'none';
    });
    simulateChat(); // Add this line to start the chat automatically

    // Stop the automatic chat
    clearInterval(chatInterval);
}); // Fixed misplaced closing bracket

document.getElementById('raiseHandButton').addEventListener('click', function () {
    document.getElementById('messageInput').style.display = 'block'; // Make the input field visible
    document.getElementById('sendMessageButton').style.display = 'block'; // Make the send button visible
    document.getElementById('messageInput').classList.add('showChat');
    document.getElementById('sendMessageButton').classList.add('showChat');
    let raiseHandCount = parseInt(localStorage.getItem('raiseHandCount') || '0');
    localStorage.setItem('raiseHandCount', raiseHandCount + 1);
});

// Event listener for the send message button
sendMessageButton.addEventListener('click', () => {
    // console.log('Send button clicked');
    const messageText = messageInput.value;
    const firstName = localStorage.getItem('firstName'); // Retrieve firstName from localStorage
    const badgeName = localStorage.getItem('badgeName'); // Retrieve badgeName from localStorage

    // Increment message count and track total characters
    let messageCount = parseInt(localStorage.getItem('messageCount') || '0');
    let totalChars = parseInt(localStorage.getItem('totalChars') || '0');
    localStorage.setItem('messageCount', messageCount + 1);
    localStorage.setItem('totalChars', totalChars + messageText.length);

    // Simulate user typing similar to agent's typing mechanism
    appendMessageAfterTyping(messageText, false, `${badgeName} (${firstName})`); // Use appendMessageAfterTyping for user's message

    // Hide the send button and message entry window after sending a message
    sendMessageButton.style.display = 'none';
    messageInput.style.display = 'none';
    messageInput.value = ''; // Clear the text box after sending the message

    // Wait for a specified delay, then make a request to the '/ask-openai' endpoint
    setTimeout(() => {
        const currentConversationId = localStorage.getItem('currentConversationId');

        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: messageText, // Use the actual message content variable
                conversationId: localStorage.getItem('currentConversationId'), // Ensure this is correctly set
                participantName: firstName, // Use the participant's actual name variable
                self_cond: localStorage.getItem('self_cond') // Use the actual condition
            })
        })
            .then(response => {
                // console.log(response); // Add this line for debugging
                if (response.status === 429) {
                    window.location.href = 'end.html'; // Adjust the URL to your task completed page
                } else if (response.headers.get("content-type")?.includes("application/json")) {
                    return response.json();
                } else {
                    throw new Error('Received non-JSON response from the server');
                }
            })
            .then(data => {
                // console.log('Response data:', data); // Debugging line to inspect the data object
                if (data.shouldRedirect) {
                    // console.log('agents saying its complete');
                    window.location.href = 'end.html';
                } else {
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
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                // Handle any errors that occurred during the fetch
            });
    }, typingDelay); // typingDelay is the time you show the typing indicator for
});

// Function to display join alerts
function displayJoinAlert(message) {
    const alertElement = document.createElement('div');
    alertElement.textContent = message;
    alertElement.style.fontStyle = 'italic';
    alertElement.style.marginBottom = '10px';
    messageContainer.prepend(alertElement); // Prepend to ensure it stays at the top
}

let lastAgentIndex = null;
function simulateChat() {
    clearInterval(chatInterval);
    const currentConversationId = localStorage.getItem('currentConversationId');
    const self_cond = localStorage.getItem('self_cond'); // Load self_cond from localStorage

    if (self_cond === 'public' || self_cond !== 'public') { // Check if self_cond is public or not
        if (conversationHistory.length === 0) {
            const participantBadgeName = localStorage.getItem('badgeName');
            
            displayTeamMembers(); // Call displayTeamMembers here to ensure agents are set

            // Import agents from earlier in the chat.js code
            const team_race = localStorage.getItem('team_race'); // Retrieve team_race from localStorage
            const agentsToUse = team_race === 'A' ? agentsOptions.A : agentsOptions.B; // Determine which agents to use based on team_race
            const agentKeys = Object.keys(agentsToUse); // Get the keys of the agents object
            const randomAgentKey = agentKeys[Math.floor(Math.random() * agentKeys.length)]; // Select a random agent key
            const randomAgent = agentsToUse[randomAgentKey]; // Use the key to get the agent details

            // Load agents and their avatars before the introductory message
            setTimeout(() => {}, 10000)
            // Construct the introduction message with the selected agent's details
            let introductionMessage;
            if (self_cond === 'public') {
                introductionMessage = {
                    role: randomAgent.agentName,
                    content: `Hey team, I see ${participantBadgeName} just joined the chat. Welcome to the team.. Should we all first introduce ourselves and explain our Title/badge name like the directions said?BTW, u click the raise hand button to bring up the chat box..`
                };
            } else {
                introductionMessage = {
                    role: randomAgent.agentName,
                    content: `Hey team, I see we are all here. Welcome.. Maybe we should all introduce ourselves and then jump into the task like the directions said?BTW, u click the raise hand button to bring up the chat box..`
                };
            }

            // Add a delay before displaying the typing indicator for the intro message
            setTimeout(() => {
                let messageElement = appendMessage(`${randomAgent.agentName} is typing...`, true, randomAgent.agentName, randomAgent.avatar);

                setTimeout(() => {
                    let firstResponse;
                    if (self_cond === 'public') {
                        firstResponse = `${randomAgent.agentName} (${randomAgent.agentBadge}): ${introductionMessage.content}`;
                    } else {
                        firstResponse = `${randomAgent.agentName}: ${introductionMessage.content}`;
                    }
                    let textElement = messageElement.querySelector('.text');
                    textElement.textContent = firstResponse;
                    if (self_cond === 'public') {
                        conversationHistory.push({ role: randomAgent.agentName, content: introductionMessage.content });
                    } else {
                        conversationHistory.push({ role: randomAgent.agentName, content: introductionMessage.content });
                    }

                    // Save the introduction message to the conversation transcript
                    fetch('/save-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId: localStorage.getItem('currentConversationId'),
                            message: self_cond === 'public' ? { role: randomAgent.agentName, content: introductionMessage.content } : { role: randomAgent.agentName, content: introductionMessage.content }
                        })
                    })
                        .then(response => response.json())
                        .then(data => console.log('Message saved:', data))
                        .catch(error => console.error('Error saving message:', error));

                    // Set a timeout to automatically fetch responses after 45 seconds regardless of participant's response
                    const autoFetchTimeout = setTimeout(() => {
                        fetchResponses();
                    }, 45000); // 45 seconds delay to proceed automatically

                }, 10000); // Delay before showing the intro message
            }, 5000); // Delay before showing the typing indicator for the intro message
        } else {
            // If there's already conversation history, fetch responses immediately without additional delay
            fetchResponses();
        }
    } else {
        // If self_cond is not public or not, fetch responses immediately without additional delay
        fetchResponses();
    }
}

function fetchResponses() {
    if (activeMessages > 0) {
        // Still processing messages, exit early
        return;
    }
    const currentConversationId = localStorage.getItem('currentConversationId');
    const firstName = localStorage.getItem('firstName'); // Ensure firstName is defined
    const badgeName = localStorage.getItem('badgeName'); // Define badgeName by retrieving it from localStorage
    fetch('/ask-openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            firstName,
            badgeName,
            conversationHistory,
            conversationId: currentConversationId,
            participantName: firstName, // Include the participant's name in the request
            self_cond: self_cond
        })
    })
        .then(response => {
            // console.log(response); // Add this line for debugging
            if (response.headers.get("content-type")?.includes("application/json")) {
                return response.json();
            } else {
                throw new Error('Received non-JSON response from the server');
            }
        })
        .then(data => {
            // console.log('Response data:', data); // Debugging line to inspect the data object
            if (data && data.responses) {
                // Process responses
                let taskCompletionAgents = 0;
                data.responses.forEach(response => {
                    simulateTyping(response.role, `${response.content}`); // Removed emojis from here
                    conversationHistory.push({ role: response.role, content: response.content, participantName: firstName }); // Append participant's name to the content
                    if (response.valuationResult && response.valuationResult.indicatesTaskCompletion) {
                        taskCompletionAgents++;
                    }
                });
                // Call updateLastResponseTime here to reset the timer whenever an agent responds
                updateLastResponseTime();
                // Check if the chat should end
                const taskCompleteCheckbox = document.getElementById('taskCompleteCheckbox');
                if (taskCompleteCheckbox && taskCompleteCheckbox.checked && taskCompletionAgents >= 1) {
                    window.location.href = '/end.html';
                } else {
                    // Call simulateChat again to keep the messages going
                    simulateChat();
                }
            } else if (data.message && data.message === "No messages from any prolific respondent on this round") {
                console.error('Error', data);
                // Retry fetching agent responses after a delay
                setTimeout(fetchResponses, 1000); // Retry after 5 seconds
            } else {
                console.error('Unexpected response structure:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching data (will retry):', error);
            setTimeout(fetchResponses, 50000); // Retry fetching data after a 5-second delay
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

// Assuming you have an object with team members' details
const teamMembers = agents

function createTeamMemberElement(member, isMyInfo = false) {
    const memberElement = document.createElement('div');
    memberElement.className = `team-member ${isMyInfo ? 'my-info' : ''}`;
    memberElement.innerHTML = `
        <img src="${member.avatar}" alt="${member.name}" class="team-member-avatar ${isMyInfo ? 'avatar-outline-red' : ''}">
        <div class="team-member-info">
            <h4>${member.name}</h4>
            ${localStorage.getItem('self_cond') === 'public' ? `<p>${member.badgeName || member.agentBadge}</p>` : ''}
        </div>
    `;
    if (!isMyInfo) {
        // Apply color styling for other team members
        memberElement.querySelector('.team-member-info').style.color = 'black';
        memberElement.style.backgroundColor = `rgba(${member.colorRGB.r}, ${member.colorRGB.g}, ${member.colorRGB.b}, 0.1)`;
        memberElement.style.borderColor = member.color;
    }
    return memberElement;
}

function displayTeamMembers() {
    const container = document.getElementById('teamMembers');
    container.innerHTML = ''; // Clear existing content

    // Add Bryan's information first
    const myInfo = {
        name: localStorage.getItem('firstName'),
        avatar: localStorage.getItem('selectedAvatar'), // Fetch the selected avatar path
        badgeName: localStorage.getItem('badgeName')
    };

    // Create an element for Bryan's information
    const myElement = document.createElement('div');
    myElement.className = 'team-member my-info'; // Use 'my-info' for distinct styling
    myElement.innerHTML = `
        <img src="${myInfo.avatar}" alt="${myInfo.name}" class="team-member-avatar avatar-outline-red">
        <div class="team-member-info">
            <h4>${myInfo.name}</h4>
            ${localStorage.getItem('self_cond') === 'public' ? `<p>${myInfo.badgeName}</p>` : ''}
        </div>
    `;
    container.appendChild(myElement);

    // Add other team members
    Object.values(agents).forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
        <img src="${member.avatar}" alt="${member.agentName}" class="team-member-avatar">
        <div class="team-member-info">
            <h4>${member.agentName}</h4>
            ${localStorage.getItem('self_cond') === 'public' ? `<p>${member.agentBadge}</p>` : ''}
        </div>
    `;
        // Set the text color for the team member's name or badge
        memberElement.querySelector('.team-member-info').style.color = 'black';
        // Set the background color for the team member's display
        memberElement.style.backgroundColor = `rgba(${member.colorRGB.r}, ${member.colorRGB.g}, ${member.colorRGB.b}, 0.1)`; // Even lighter, more subtle hue
        memberElement.style.borderColor = member.color; // Agent's unique color
        container.appendChild(memberElement);
    });

    // Add messages for each agent with different timings
    if (!localStorage.getItem(`agentsIntroduced_${conversationId}`)) {
        let delay = 1000; // Initial delay in milliseconds
        const delayIncrement = 1000; // Increment delay for each subsequent message

        Object.values(agents).forEach(agent => {
            setTimeout(() => {
                const joinMessageText = `${agent.agentName} has joined the chat!`;
                appendMessage(joinMessageText, true, agent.agentName, agent.avatar, false, '', true);
            }, delay);
            delay += delayIncrement; // Increment delay for the next agent
        });

        localStorage.setItem(`agentsIntroduced_${conversationId}`, 'true');
    }
}
;

document.addEventListener('DOMContentLoaded', function () {
    const checkboxElement = document.getElementById('checkbox');
    if (checkboxElement) {
        checkboxElement.addEventListener('change', function (event) {
            if (this.checked) {
                // Apply dark mode styles
                document.body.classList.add('dark-mode');
            } else {
                // Revert to light mode styles
                document.body.classList.remove('dark-mode');
            }
        });
        if (!document.body.classList.contains('dark-mode')) {
            // console.log('Dark mode is initially off');
        }
    } else {
        console.error('Checkbox element not found');
    }
});

function displayTeamMembersWithoutBadge() {
    const container = document.getElementById('teamMembers');
    container.innerHTML = ''; // Clear existing content

    // Add Bryan's information first, without badgeName
    const myInfo = {
        name: localStorage.getItem('firstName'),
        avatar: localStorage.getItem('selectedAvatar'), // Fetch the selected avatar path
    };

    // Create an element for Bryan's information without badgeName
    const myElement = document.createElement('div');
    myElement.className = 'team-member my-info'; // Use 'my-info' for distinct styling
    myElement.innerHTML = `
        <img src="${myInfo.avatar}" alt="${myInfo.name}" class="team-member-avatar avatar-outline-red">
        <div class="team-member-info">
            <h4>${myInfo.name}</h4>
        </div>
    `;
    container.appendChild(myElement);

    // Add other team members without badgeName
    Object.values(agents).forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
        <img src="${member.avatar}" alt="${member.agentName}" class="team-member-avatar">
        <div class="team-member-info">
            <h4>${member.agentName}</h4>
        </div>
        `;
        container.appendChild(memberElement);
    });
}
let taskCompletionAgents = 0;

function markAgentTaskComplete(agentName) {
    taskCompletionAgents++;
    checkAllTasksComplete();
}

document.getElementById('taskCompleteCheckbox').addEventListener('change', function () {
    if (this.checked) { // Check if the checkbox is checked
        // console.log('Checkbox checked. Checking conditions...');
        checkAllTasksComplete();
        if (taskCompletionAgents < 1) { // Assuming there are 2 agents, adjust condition as necessary
            alert("Waiting for one other person to indicate task-complete (to advance to end page). Please wait a moment and try checking the task-complete box again");
        }
    }
});
let messageCountsByConversation = {};

function appendMessage(messageText, isAgent = false, agentName, avatar = null, isParticipant = false, badgeName, isJoinMessage = false) {
    const conversationId = localStorage.getItem('currentConversationId');
    if (!messageCountsByConversation[conversationId]) {
        messageCountsByConversation[conversationId] = { lastMessage: "", lastMessageCount: 0 };
    }

    let conversationData = messageCountsByConversation[conversationId];

    if (messageText === conversationData.lastMessage) {
        conversationData.lastMessageCount++;
    } else {
        conversationData.lastMessage = messageText;
        conversationData.lastMessageCount = 1;
    }

    if (conversationData.lastMessageCount <= 2) { // Limit to 2 repetitions before splitting
        const maxLength = 400
        //const maxLength = Math.floor(Math.random() * (400 - 100 + 1)) + 100; // Define a max length for a message as a random number between 200 and 500
        if (messageText.length > maxLength) {
            const parts = splitMessage(messageText, maxLength);
            parts.forEach((part, index) => {
                setTimeout(() => {
                    showTypingIndicator(agentName); // Show typing indicator
                    const typingDuration = Math.floor(Math.random() * (10000 - 2000 + 1)) + 2000; // Typing delay
                    setTimeout(() => {
                        hideTypingIndicator(agentName); // Hide typing indicator
                        appendMessage(part.text, isAgent, agentName, avatar, isParticipant, badgeName, isJoinMessage);
                    }, typingDuration);
                }, index * (Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000)); // Increase delay between messages
            });
            return; // Exit the function after handling split messages
        }

        // Existing logic to append message without splitting remains unchanged
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');

        const avatarElement = document.createElement('img');
        avatarElement.classList.add('avatar');
        let agent;
        if (isAgent) {
            agent = agents[agentName]; // Simplified agent retrieval from the agents object
            messageElement.classList.add(`agent-${agentName}`);
            if (agent) {
                messageElement.style.backgroundColor = `rgba(${agent.colorRGB.r}, ${agent.colorRGB.g}, ${agent.colorRGB.b}, 0.25)`;
                messageElement.style.borderColor = agent.color;
            }
            messageElement.style.borderWidth = "2px";
            messageElement.style.borderStyle = "solid";
        } else {
            messageElement.classList.add('participant');
            messageElement.style.border = "2px solid #ff0000";
            messageElement.style.borderRadius = "20px";
            messageElement.style.padding = "10px";
        }

        // Determine the avatar image source based on the agent's name or if it's the participant
        let avatarSrc;
        if (isAgent) {
            avatarSrc = avatar ? avatar : 'default_agent_avatar.png'; // Use the passed avatar URL if available, otherwise fallback to a default
        } else {
            avatarSrc = localStorage.getItem('selectedAvatar'); // Use the participant's selected avatar
            messageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.25)'; // Lighter red whitish opacity hue
        }
        avatarElement.src = avatarSrc;

        const textElement = document.createElement('div');
        textElement.classList.add('text');
        if (isJoinMessage) {
            // Create a simple text element for join messages
            const joinTextElement = document.createElement('div');
            joinTextElement.innerText = messageText;
            joinTextElement.style.color = 'gray';
            joinTextElement.classList.add('join-message-plain'); // Ensure this class does not add bubble-like styles
            messageContainer.appendChild(joinTextElement); // Append directly to the message container
            return; // Skip the rest of the function to avoid adding bubble styling
        }

        const participantBadgeName = localStorage.getItem('badgeName');
        // Predefined introduction message from Agent 1 (James) including the participant's badge name
        if (!isAgent) {
            // Prepend the first name to the participant's message and conditionally include the badge name based on public condition
            textElement.innerText = `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${participantBadgeName})` : ''}: ${messageText}`;
            // Add the participant's message to the conversation history with their first name and conditionally include the badge name based on public condition
            conversationHistory.push({ role: `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${badgeName})` : ''}`, content: messageText, isParticipant: true });
            // console.log('Participant message appended:', messageText);

        } else {
            // Retrieve the agent's badge from the agents object using the agentName and conditionally include it based on public condition
            const agentBadge = agent ? agent.agentBadge : 'Unknown'; // Retrieve the agent's badge
            textElement.innerText = `${agentName} ${localStorage.getItem('self_cond') === 'public' ? `(${agentBadge})` : ''}: ${messageText}`;
            // If the message is from an agent, add it to the conversation history with the agent's name and conditionally include the badge based on public condition
            conversationHistory.push({ role: `${agentName} ${localStorage.getItem('self_cond') === 'public' ? `(${agentBadge})` : ''}`, content: messageText, isParticipant: false });
        }
        messageElement.appendChild(avatarElement);
        messageElement.appendChild(textElement);
        messageContainer.append(messageElement);

        adjustBubbleWidths();

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

        // Save the updated conversation history in localStorage
        localStorage.setItem(`conversationHistory_${conversationId}`, JSON.stringify(conversationHistory));

        return messageElement;
    }
}
            joinTextElement.style.color = 'gray';
            const joinTextElement = document.createElement('div');
            avatarSrc = localStorage.getItem('selectedAvatar'); // Use the participant's selected avatar

