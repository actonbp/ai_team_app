document.addEventListener('DOMContentLoaded', (event) => {
    // This code runs when the DOM is fully loaded
    const nextButton = document.querySelector('.next-button');
    
    // nextButton.addEventListener('click', () => {
    //     window.location.href = 'login.html'; // Navigate to login.html when the button is clicked
    // });

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

    // Save Prolific ID on input
    document.getElementById('prolificIdInput').addEventListener('input', function(e) {
        localStorage.setItem('prolificId', e.target.value.trim());
    });

    // Modify the Next button's click event to redirect to login.html
    // This part remains unchanged as per instructions
    document.querySelector('.next-button').addEventListener('click', function() {
        window.location.href = 'login.html';
    });
});
