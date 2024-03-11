document.addEventListener('DOMContentLoaded', (event) => {
    // This code runs when the DOM is fully loaded
    const nextButton = document.querySelector('.task-instructions button');

    nextButton.addEventListener('click', () => {
        window.location.href = 'login.html'; // Navigate to login.html when the button is clicked
    });

    // Smooth Scroll to Next Section
    document.querySelector('.next-button').addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelector('#nextSection').scrollIntoView({ behavior: 'smooth' });
    });

    // Dynamic Date or Greeting
    const greetingElement = document.getElementById('dynamicGreeting');
    const date = new Date();
    const hours = date.getHours();
    let greeting = 'Welcome!';
    if (hours < 12) greeting = 'Good Morning!';
    else if (hours < 18) greeting = 'Good Afternoon!';
    else greeting = 'Good Evening!';
    greetingElement.textContent = greeting;
});