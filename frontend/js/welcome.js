document.addEventListener('DOMContentLoaded', (event) => {
    // This code runs when the DOM is fully loaded
    const nextButton = document.querySelector('.next-button');
    
    // Check if a session ID already exists
    if (!localStorage.getItem('sessionId')) {
        // Generate a unique session ID. Here, a simple timestamp is used for demonstration.
        const sessionId = `session-${Date.now()}`;
        localStorage.setItem('sessionId', sessionId);
    }

    // Randomly assign a value to self_cond
    const conditions = ['public', 'private', 'none'];
    const self_cond = conditions[Math.floor(Math.random() * conditions.length)];
    localStorage.setItem('self_cond', self_cond);

    // Display the self_cond value for testing
    const selfCond = localStorage.getItem('self_cond');
    const conditionDisplayElement = document.createElement('p');
    conditionDisplayElement.textContent = `Current Condition: ${selfCond}`;
    document.body.appendChild(conditionDisplayElement);

    // Simplified code to redirect to login.html on Next button click, only if Prolific ID is entered
    nextButton.addEventListener('click', function () {
        const prolificIdInput = document.getElementById('prolificIdInput');
        if (prolificIdInput && prolificIdInput.value.trim() !== '') {
            localStorage.setItem('prolificId', prolificIdInput.value.trim()); // Save the Prolific ID to localStorage
            // Start a new chat session by sending a POST request to '/start-chat'
            fetch('/start-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    self_cond: localStorage.getItem('self_cond'), // Retrieve self_cond from localStorage
                    prolificId: localStorage.getItem('prolificId') // Retrieve the Prolific ID from localStorage
                })
            })
                .then(response => response.json())
                .then(data => {
                    localStorage.setItem('team_race', data.team_race); // Store team_race in localStorage
                    localStorage.setItem('currentConversationId', data.conversationId); // Store the conversationId in localStorage
                    console.log(`New chat started with ID: ${data.conversationId} for team race: ${data.team_race}`);
                    // Redirect to the chat page or perform other actions as needed
                    window.location.href = '/login.html'; // Redirect to the chat page
                })
                .catch(error => console.error('Error starting new chat:', error));
        } else {
            alert('Please enter your Prolific ID to proceed.');
        }
    });
});
