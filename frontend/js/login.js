// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value.trim();
    const badgeName = badgeNameInput.value.trim();

    // Check if the inputs are not empty
    if (firstName === '' || badgeName === '') {
        alert('Please enter both your first name and badge name.');
        return;
    }

    // Store the first name and badge name in localStorage
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('badgeName', badgeName);

    // Redirect to the chat page
    window.location.href = 'chat.html';
});