// Function to handle form submission
document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    // Retrieve user input
    var userName = document.getElementById('name').value.trim();
    var userBadge = document.getElementById('badge').value.trim();

    // Basic validation
    if (userName === '' || userBadge === '') {
        alert('Please enter both your name and badge number.');
        return;
    }

    // Save user details in localStorage
    localStorage.setItem('userName', userName);
    localStorage.setItem('userBadge', userBadge);

    // Redirect to chat page
    window.location.href = 'chat.html';
});

// Function to check if user already entered details
function checkUserDetails() {
    if (localStorage.getItem('userName') && localStorage.getItem('userBadge')) {
        window.location.href = 'chat.html';
    }
}

// Check user details on page load
window.onload = checkUserDetails;
