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
    nextButton.addEventListener('click', function() {
        const prolificIdInput = document.getElementById('prolificIdInput');
        if (prolificIdInput && prolificIdInput.value.trim() !== '') {
            localStorage.setItem('prolificId', prolificIdInput.value.trim()); // Save prolificIdInput into localStorage
<<<<<<< Updated upstream
            // Code to send prolificIdInput to the backend for saving in chatSessions.csv
=======
            // Send prolificIdInput and self_cond to the backend
>>>>>>> Stashed changes
            fetch('/start-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
<<<<<<< Updated upstream
                    prolificId: prolificIdInput.value.trim(), // Ensure this matches the backend expectation
                    self_cond: self_cond // Assuming self_cond is defined earlier
=======
                    prolificId: prolificIdInput.value.trim(),
                    self_cond: localStorage.getItem('self_cond') // Retrieve self_cond from localStorage
>>>>>>> Stashed changes
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
<<<<<<< Updated upstream
                console.log('Success:', data);
=======
                // Store team_race and conversationId received from the server in localStorage
                localStorage.setItem('team_race', data.team_race);
                localStorage.setItem('currentConversationId', data.conversationId);
                console.log(`New chat started with ID: ${data.conversationId} for team race: ${data.team_race}`);
>>>>>>> Stashed changes
                window.location.href = '/login.html';
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        } else {
            alert('Please enter your Prolific ID to proceed.');
        }
    });
});
