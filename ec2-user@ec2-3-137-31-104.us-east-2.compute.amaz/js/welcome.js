document.addEventListener('DOMContentLoaded', (event) => {
    // This code runs when the DOM is fully loaded
    const nextButton = document.querySelector('.task-instructions button');

    nextButton.addEventListener('click', () => {
        window.location.href = 'login.html'; // Navigate to login.html when the button is clicked
    });
});