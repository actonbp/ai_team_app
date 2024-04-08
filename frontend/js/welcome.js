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
            // Code to send prolificIdInput to the backend for saving in chatSessions.csv
            fetch('/start-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prolificId: prolificIdInput.value.trim(), // Ensure this matches the backend expectation
                    self_cond: self_cond // Assuming self_cond is defined earlier
                }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
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
