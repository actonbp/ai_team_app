// Function to handle form submission
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function (event) {
        event.preventDefault();

        // Retrieve user input
        var firstName = document.getElementById('firstNameInput').value.trim();
        var badgeName = document.getElementById('badgeNameInput').value.trim();

        // Basic validation
        if (firstName === '' || badgeName === '') {
            alert('Please enter both your first name and badge name.');
            return;
        }

        // Save user details in localStorage
        localStorage.setItem('firstName', firstName); // Corrected the key to match the retrieval key in chat.js
        localStorage.setItem('badgeName', badgeName); // Corrected the key to match the retrieval key in chat.js

        // Directly redirect to chat page after form submission
        window.location.href = 'chat.html';
    });
}

// Function to check if user already entered details and display them
function displayUserDetails() {
    var firstName = localStorage.getItem('firstName'); // Corrected the key to match the saved key
    var badgeName = localStorage.getItem('badgeName'); // Corrected the key to match the saved key
    if (firstName && badgeName) {
        var firstNameInput = document.getElementById('firstNameInput');
        var badgeNameInput = document.getElementById('badgeNameInput');
        if (firstNameInput && badgeNameInput) {
            firstNameInput.value = firstName;
            badgeNameInput.value = badgeName;
        }
    }
}

window.onload = function () {
    // Always go to the login page but fill in the details if they exist
    displayUserDetails();
}

