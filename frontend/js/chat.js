// chat.js
// Get the Prolific ID pop-up container and the main app container
if (!localStorage.getItem('badgeName')) {
    window.location.href = 'login.html';
}// Retrieve first name and badge name from localStorage
const firstName = localStorage.getItem('firstName');
const badgeName = localStorage.getItem('badgeName');
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
typingIndicator.innerText = 'Agent is typing...';

// Disable the message input field and the send message button initially
messageInput.style.display = 'none';
sendMessageButton.style.display = 'none';

// Initialize an empty array to store the conversation history
let conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

let taskCompleteCount = parseInt(localStorage.getItem('taskCompleteCount')) || 0;

let activeMessages = 0;

// Define chatInterval outside of window.onload
let chatInterval;

// Set an interval to check for chat completion every 30 seconds
function checkAllTasksComplete() {
    fetch('/check-tasks-complete', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.shouldRedirect) {
                window.location.href = 'simulation_end.html';
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

chatInterval = setInterval(checkAllTasksComplete, 30000); // Check if all tasks are complete every 30 seconds


let agents = {};

typingDelay = 10000
// Clearing the agents object before redefining it

const agentsOptions = {
    B: {
        'James': { agentName: 'James', avatar: 'avatars/majority/avatar_1.png', isAgent: true, typingSpeed: 130, agentBadge: 'Master of Motivation', color: 'rgba(255, 215, 0, 0.5)', colorRGB: { r: 255, g: 215, b: 0 } },
        'Sophia': { agentName: 'Sophia', avatar: 'avatars/majority/avatar_2.png', isAgent: true, typingSpeed: 180, agentBadge: 'Strategist Supreme', color: 'rgba(255, 105, 180, 0.5)', colorRGB: { r: 255, g: 105, b: 180 } },
        'Ethan': { agentName: 'Ethan', avatar: 'avatars/majority/avatar_3.png', isAgent: true, typingSpeed: 220, agentBadge: 'Logic Luminary', color: 'rgba(30, 144, 255, 0.5)', colorRGB: { r: 30, g: 144, b: 255 } }
    },
    A: {
        'Maurice': { agentName: 'Maurice', avatar: 'avatars/minority/avatar_10.png', isAgent: true, typingSpeed: 130, agentBadge: 'Master of Motivation', color: 'rgba(255, 215, 0, 0.5)', colorRGB: { r: 255, g: 215, b: 0 } },
        'Ebony': { agentName: 'Ebony', avatar: 'avatars/minority/avatar_11.png', isAgent: true, typingSpeed: 180, agentBadge: 'Strategist Supreme', color: 'rgba(255, 105, 180, 0.5)', colorRGB: { r: 255, g: 105, b: 180 } },
        'Trevon': { agentName: 'Trevon', avatar: 'avatars/minority/avatar_13.png', isAgent: true, typingSpeed: 220, agentBadge: 'Logic Luminary', color: 'rgba(30, 144, 255, 0.5)', colorRGB: { r: 30, g: 144, b: 255 } }
    }
};
// Corrected avatar paths to be consistent with the appendMessage function, added typingSpeed for each agent, and added agentBadge name to match @app.js
// This function is called to initiate a new chat session

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
        console.log('Checkbox clicked. Checking conditions...');
        checkAllTasksComplete();
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
    fetch('/start-chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            self_cond: localStorage.getItem('self_cond'), // Ensure this matches what's stored in localStorage
            prolificId: localStorage.getItem('prolificId') // Add this line to include prolificId
        })
    })
    .then(response => response.json())
    .then(data => {
        const { team_race } = data;
        localStorage.setItem('team_race', team_race); // Store team_race in localStorage
        // Store the conversationId received from the server in localStorage
        localStorage.setItem('currentConversationId', data.conversationId);
        console.log(`OH YEAH, New chat started with ID: ${data.conversationId} for team race: ${team_race}`);
        // Correctly set agents based on team_race being 'A' or 'B'
        agents = team_race === 'A' ? agentsOptions.A : agentsOptions.B;
        displayTeamMembers(); // Call displayTeamMembers here to ensure agents are set
    })
    .catch(error => console.error('Error starting new chat:', error));
}
function appendMessageAfterTyping(messageText, isAgent = false, agentName, avatar = null) {
    // Default typing speed for participants
    let typingSpeed = 200;

    // If it's an agent's message, find the agent and use their typing speed
    if (isAgent && agentName) {
        const agent = Object.values(agents).find(agent => agent.agentName === agentName);
        if (agent) {
            typingSpeed = agent.typingSpeed;
        }
    }

    const typingDuration = (messageText.length / typingSpeed) * 3000; // Calculate pause based on message length

    // Show typing indicator for the calculated duration
    showTypingIndicator(agentName);
    setTimeout(() => {
        hideTypingIndicator(agentName); // Hide typing indicator when message is ready to appear
        appendMessage(messageText, isAgent, agentName, avatar); // Append the message after the typing indicator ends, passing the avatar if available
    }, typingDuration);
}

function appendMessage(messageText, isAgent = false, agentName, avatar = null, isParticipant = false, badgeName) {
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

    const participantBadgeName = localStorage.getItem('badgeName');
    // Predefined introduction message from Agent 1 (James) including the participant's badge name
    if (!isAgent) {
        // Prepend the first name to the participant's message and conditionally include the badge name based on public condition
        textElement.innerText = `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${participantBadgeName})` : ''}: ${messageText}`;
        // Add the participant's message to the conversation history with their first name and conditionally include the badge name based on public condition
        conversationHistory.push({ role: `${firstName} ${localStorage.getItem('self_cond') === 'public' ? `(${badgeName})` : ''}`, content: messageText, isParticipant: true });
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
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

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
                message: "Your message here",
                conversationId: localStorage.getItem('currentConversationId'), // Ensure this is correctly set
                participantName: "Participant's Name",
                self_cond: "Condition"
            })
        })
            .then(response => {
                console.log(response); // Add this line for debugging
                if (response.headers.get("content-type")?.includes("application/json")) {
                    return response.json();
                } else {
                    throw new Error('Received non-JSON response from the server');
                }
            })
            .then(data => {
                console.log('Response data:', data); // Debugging line to inspect the data object
                if (data.shouldRedirect) {
                    console.log('agents saying its complete');
                    window.location.href = 'simulation_end.html';
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

    if (self_cond === 'public') { // Ensure self_cond is checked against a string value
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
            const introductionMessage = {
                role: randomAgent.agentName,
                content: `Hey team, ${randomAgent.agentName} here! I see ${participantBadgeName} just joined the chat. Welcome to the team! Should we all first introduce ourselves and explain our badge name like the task directions said?`
            };

            // Add a delay before displaying the typing indicator for the intro message
            setTimeout(() => {
                let messageElement = appendMessage(`${randomAgent.agentName} is typing...`, true, randomAgent.agentName, randomAgent.avatar);

                setTimeout(() => {
                    let firstResponse = `${randomAgent.agentName} (${randomAgent.agentBadge}): ${introductionMessage.content}`;
                    let textElement = messageElement.querySelector('.text');
                    textElement.textContent = firstResponse;
                    conversationHistory.push({ role: randomAgent.agentName, content: introductionMessage.content });

                    // Save the introduction message to the conversation transcript
                    fetch('/save-message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            conversationId: localStorage.getItem('currentConversationId'),
                            message: { role: randomAgent.agentName, content: introductionMessage.content }
                        })
                    })
                        .then(response => response.json())
                        .then(data => console.log('Message saved:', data))
                        .catch(error => console.error('Error saving message:', error));

                    fetchResponses();
                }, 10000); // Delay before showing the intro message
            }, 5000); // Delay before showing the typing indicator for the intro message
        } else {
            fetchResponses();
        }
    } else {
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
            console.log(response); // Add this line for debugging
            if (response.headers.get("content-type")?.includes("application/json")) {
                return response.json();
            } else {
                throw new Error('Received non-JSON response from the server');
            }
        })
        .then(data => {
            console.log('Response data:', data); // Debugging line to inspect the data object
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
                // Check if the chat should end
                const taskCompleteCheckbox = document.getElementById('taskCompleteCheckbox');
                if (taskCompleteCheckbox && taskCompleteCheckbox.checked && taskCompletionAgents > 2) {
                    window.location.href = '/simulation_end.html';
                } else {
                    // Call simulateChat again to keep the messages going
                    simulateChat();
                }
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
    let delay = 1000; // Initial delay in milliseconds
    const delayIncrement = 1000; // Increment delay for each subsequent message

    Object.values(agents).forEach(agent => {
        setTimeout(() => {
            const joinMessageText = `${agent.agentName} has joined the chat!`;
            const plainTextElement = document.createElement('p'); // Create a paragraph element for plain text
            plainTextElement.textContent = joinMessageText;
            plainTextElement.style.color = 'gray'; // Optional: Style as needed
            container.appendChild(plainTextElement); // Append the plain text element to the container
        }, delay);
        delay += delayIncrement; // Increment delay for the next agent
    });
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
            console.log('Dark mode is initially off');
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
let agentsTaskCompleteCount = 0;

function markAgentTaskComplete(agentName) {
    agentsTaskCompleteCount++;
    checkAllTasksComplete();
}

document.getElementById('taskCompleteCheckbox').addEventListener('change', function () {
    console.log('Checkbox clicked. Checking conditions...');
    checkAllTasksComplete();
});
