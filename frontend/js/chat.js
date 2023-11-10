// Get DOM elements
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('messageInput');
const messageContainer = document.getElementById('chatWindow');
const startButton = document.getElementById('startButton'); // ID of your "Begin working on the team" button

// Event listener for the "Begin working on the team" button
startButton.addEventListener('click', function () {
    fetch('/start')
        .then(response => response.json())
        .then(data => {
            // Display the initial responses in your chat
            data.responses.forEach(response => {
                appendMessage(`${response.role}: ${response.content}`);
            });
        });
});

// Event listener for form submission
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    appendMessage(`You: ${message}`);
    messageInput.value = '';
    // Send the message to the server
    fetch('/ask-openai', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
    })
        .then(response => response.json())
        .then(data => {
            // Expect data.responses to be an array of responses
            data.responses.forEach((response, i) => {
                // Create a delay before showing each message
                setTimeout(() => {
                    // Show the typing indicator
                    messageContainer.innerHTML += `<p>${response.role} is typing...</p>`;

                    // Create another delay, then show the message
                    setTimeout(() => {
                        appendMessage(`${response.role}: ${response.content}`);
                    }, 2000); // 2 seconds delay
                }, i * 3000); // 3 seconds delay between each message
            });
        });
});

// Function to append message to the container
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}