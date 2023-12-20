// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value;
    const badgeName = badgeNameInput.value;

    // Store the first name and badge name in localStorage
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('badgeName', badgeName);

    // Redirect to the chat page
    window.location.href = 'chat.html';
});