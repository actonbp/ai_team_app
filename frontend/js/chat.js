// Get DOM elements
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('messageInput');
const messageContainer = document.getElementById('chatWindow');
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
                appendMessage(`Team Member ${i+1}: ${response}`);
            });
        });
    // Send the message to the server
    
});

// Function to append message to the container
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.innerText = message;
    messageContainer.append(messageElement);
}