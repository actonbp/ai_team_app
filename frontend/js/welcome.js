document.addEventListener('DOMContentLoaded', (event) => {
    // Clear specific localStorage items for a fresh start
    localStorage.removeItem('sessionId');
    localStorage.removeItem('self_cond');
    localStorage.removeItem('prolificId');
    localStorage.removeItem('team_race');
    localStorage.removeItem('currentConversationId');
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
            // Send prolificIdInput and self_cond to the backend
            fetch('/start-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prolificId: prolificIdInput.value.trim(),
                    self_cond: localStorage.getItem('self_cond') // Retrieve self_cond from localStorage
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Store team_race and conversationId received from the server in localStorage
                localStorage.setItem('team_race', data.team_race);
                localStorage.setItem('currentConversationId', data.conversationId);
                // console.log(`New chat started with ID: ${data.conversationId} for team race: ${data.team_race}`);
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
