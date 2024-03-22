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
messageInput.style.display = 'none';
sendMessageButton.style.display = 'none';

// Initialize an empty array to store the conversation history
let conversationHistory = [];

let taskCompleteCount = 0;

let activeMessages = 0;

// Define chatInterval outside of window.onload
let chatInterval;

typingDelay = 10000
const agents = {
    'James': { agentName: 'James', avatar: 'avatars/avatar_1.png', isAgent: true, typingSpeed: 160, agentBadge: 'Master of Motivation', color: 'rgba(255, 215, 0, 0.5)', colorRGB: {r: 255, g: 215, b: 0} },
    'Sophia': { agentName: 'Sophia', avatar: 'avatars/avatar_4.png', isAgent: true, typingSpeed: 180, agentBadge: 'Strategist Supreme', color: 'rgba(255, 105, 180, 0.5)', colorRGB: {r: 255, g: 105, b: 180} },
    'Ethan': { agentName: 'Ethan', avatar: 'avatars/avatar_3.png', isAgent: true, typingSpeed: 200, agentBadge: 'Logic Luminary', color: 'rgba(30, 144, 255, 0.5)', colorRGB: {r: 30, g: 144, b: 255} }
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

    displayTeamMembers();

    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('copy', (e) => e.preventDefault());
    messageInput.addEventListener('paste', (e) => e.preventDefault());

    // Add event listener for the Notes tab
    document.getElementById('notesTab').addEventListener('click', function() {
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

document.getElementById('chatTab').addEventListener('click', function() {
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

function appendMessage(messageText, isAgent = false, agentName, isParticipant = false, badgeName) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');

    const avatarElement = document.createElement('img');
    avatarElement.classList.add('avatar');
    if (isAgent) {
        messageElement.classList.add(`agent-${agentName}`);
        messageElement.style.backgroundColor = `rgba(${agents[agentName].colorRGB.r}, ${agents[agentName].colorRGB.g}, ${agents[agentName].colorRGB.b}, 0.1)`; // More whitish hue in the middle
        messageElement.style.borderColor = agents[agentName].color; // Brighter outline
        messageElement.style.borderWidth = "2px";
        messageElement.style.borderStyle = "solid";
    } else {
        messageElement.classList.add('participant');
        // Directly apply styles to ensure they take effect
        messageElement.style.border = "2px solid #ff0000"; // Example: bright red border for distinction
        messageElement.style.borderRadius = "20px"; // Bubble shape
        messageElement.style.padding = "10px"; // Adjust padding for content spacing
    }

    // Determine the avatar image source based on the agent's name or if it's the participant
    let avatarSrc;
    if (isAgent) {
        const agent = Object.values(agents).find(agent => agent.agentName === agentName);
        avatarSrc = agent ? agent.avatar : 'default_agent_avatar.png'; // Fallback to a default agent avatar if not found
    } else {
        avatarSrc = localStorage.getItem('selectedAvatar'); // Use the participant's selected avatar
        messageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'; // Lighter red whitish opacity hue
    }
    avatarElement.src = avatarSrc;

    const textElement = document.createElement('div');
    textElement.classList.add('text');

    const participantBadgeName = localStorage.getItem('badgeName');
    // Predefined introduction message from Agent 1 (James) including the participant's badge name

    // Prepend the badge name and first name to the participant's message or use the agent's name
    if (!isAgent) {
        textElement.innerText = `${firstName} (${participantBadgeName}): ${messageText}`;
        // Add the participant's message to the conversation history with their badge name and first name
        conversationHistory.push({ role: ` ${badgeName} (${firstName})`, content: messageText, isParticipant: true });
    } else {
        // Retrieve the agent's badge from the agents object using the agentName
        const agentBadge = agents[agentName] ? agents[agentName].agentBadge : 'Unknown'; // Retrieve the agent's badge
        textElement.innerText = `${agentName} (${agentBadge}): ${messageText}`; // Removed emojis from here
        // If the message is from an agent, add it to the conversation history with the agent's name and badge
        conversationHistory.push({ role: `${agentBadge} (${agentName})`, content: messageText, isParticipant: false });
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

    // Stop the automatic chat
    clearInterval(chatInterval);
}); // Fixed misplaced closing bracket

document.getElementById('raiseHandButton').addEventListener('click', function() {
    document.getElementById('messageInput').style.display = 'block'; // Make the input field visible
    document.getElementById('sendMessageButton').style.display = 'block'; // Make the send button visible
    document.getElementById('messageInput').classList.add('showChat');
    document.getElementById('sendMessageButton').classList.add('showChat');
});

// Event listener for the send message button
sendMessageButton.addEventListener('click', () => {
    console.log('Send button clicked');
    const messageText = messageInput.value;
    const firstName = localStorage.getItem('firstName'); // Retrieve firstName from localStorage
    const badgeName = localStorage.getItem('badgeName'); // Retrieve badgeName from localStorage

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
                message: messageText,
                conversationId: currentConversationId,
                participantName: firstName
            })
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
        // Fetch the participant's badge name from localStorage
        const participantBadgeName = localStorage.getItem('badgeName');
        // Predefined introduction message from Agent 1 (James) including the participant's badge name
        const introductionMessage = {
            role: 'Agent 1',
            content: `Hey team, James here! I see ${participantBadgeName} just joined the chat. Welcome to the team! I'll start us off since I've been here the longest. Excited to work with all of you on finding the perfect spot for our new restaurant. Let's begin by discussing our strategy before we dive into sharing specific unique information. How should we approach solving this task correctly?`
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
            participantName: firstName // Include the participant's name in the request
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data && data.responses) {
                // Process responses
                data.responses.forEach(response => {
                    simulateTyping(response.role, `${response.content}`); // Removed emojis from here
                    conversationHistory.push({ role: response.role, content: response.content, participantName: firstName }); // Append participant's name to the content
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

// Assuming you have an object with team members' details
const teamMembers = {
    'James': { name: 'James', avatar: 'avatars/avatar_2.png', badgeName: 'Master of Motivation' },
    'Sophia': { name: 'Sophia', avatar: 'avatars/avatar_3.png', badgeName: 'Strategist Supreme' },
    'Ethan': { name: 'Ethan', avatar: 'avatars/avatar_6.png', badgeName: 'Logic Luminary' }
};

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
            <p>${myInfo.badgeName}</p>
        </div>
    `;
    container.appendChild(myElement);

    // Add other team members
    Object.values(teamMembers).forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'team-member';
        memberElement.innerHTML = `
            <img src="${member.avatar}" alt="${member.name}" class="team-member-avatar">
            <div class="team-member-info">
                <h4>${member.name}</h4>
                <p>${member.badgeName}</p>
            </div>
        `;
        // Set the text color for the team member's name or badge
        memberElement.querySelector('.team-member-info').style.color = 'black';
        // Set the background color for the team member's display
        memberElement.style.backgroundColor = `rgba(${agents[member.name].colorRGB.r}, ${agents[member.name].colorRGB.g}, ${agents[member.name].colorRGB.b}, 0.1)`; // Even lighter, more subtle hue
        memberElement.style.borderColor = agents[member.name].color; // Agent's unique color
        container.appendChild(memberElement);
    });
}

// Call this function when the page loads or when the team members' information is available
document.addEventListener('DOMContentLoaded', displayTeamMembers);

let taskCompleteButtonClicked = false;
let agentTaskCompleteCount = 0; // Assuming you have a way to count this

document.getElementById('taskCompleteCheckbox').addEventListener('change', function() {
    var label = document.querySelector('label[for="taskCompleteCheckbox"]');
    if (this.checked) {
        label.style.color = 'green';
    } else {
        label.style.color = 'initial'; // Change back to the default color if unchecked
    }
    taskCompleteButtonClicked = true; // Assuming taskCompleteButtonClicked is your conditional variable
    checkConditionsAndProceed();
});

function checkConditionsAndProceed() {
    if (taskCompleteButtonClicked && agentTaskCompleteCount >= 2) {
        // Logic to proceed to the next page, e.g., window.location.href = 'nextpage.html';
    }
}

// Increment agentTaskCompleteCount when an agent says "task complete"
function incrementAgentTaskCompleteCount(agentName) {
    // Assuming agentName is passed correctly and matches one of the agents
    if (agentName && agents.hasOwnProperty(agentName)) {
        const messageContent = conversationHistory.find(message => message.role.includes(agentName) && message.content.toLowerCase().includes("task-complete"));
        if (messageContent) {
            agentTaskCompleteCount++;
            checkConditionsAndProceed();
        }
    }
}
// Example usage of incrementAgentTaskCompleteCount within the chat logic
// This is a simplified example and might need adjustments based on the actual chat logic
document.addEventListener('messageReceived', function(event) {
    const { agentName, messageText } = event.detail; // Assuming event.detail contains these properties
    if (messageText.toLowerCase().includes("task-complete")) {
        incrementAgentTaskCompleteCount(agentName);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('checkbox').addEventListener('change', function(event) {
        if(this.checked) {
            // Apply dark mode styles
            document.body.classList.add('dark-mode');
        } else {
            // Revert to light mode styles
            document.body.classList.remove('dark-mode');
        }
    });
    if (!document.body.classList.contains('dark-mode')) {
        console.log('Dark mode is initially off');
    }
});
