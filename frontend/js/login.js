// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');
const avatarGrid = document.getElementById('avatarGrid');


// Function to handle avatar selection and store it in localStorage
function selectAvatar(avatarFileName) {
    localStorage.setItem('selectedAvatar', `avatars/${avatarFileName}`);
    console.log(`Selected avatar file path: avatars/${avatarFileName}`); // Print the file path of the selected avatar
}

// Function to dynamically load avatars, add event listeners for selection, and print all loaded avatars in the console
async function loadAndHandleAvatars() {
    try {
        const response = await fetch('/avatars');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new TypeError('Expected JSON response');
        }
        const avatars = await response.json();

        console.log("Loaded avatars:"); // Print a header for the loaded avatars list in the console

        avatars.forEach(avatar => {
            const imgElement = document.createElement('img');
            imgElement.src = `avatars/${avatar}`;
            imgElement.classList.add('avatarOption');
            imgElement.dataset.avatar = avatar;
            avatarGrid.appendChild(imgElement);

            console.log(`avatars/${avatar}`); // Print each loaded avatar file path in the console
        });

        // Attach event listeners to the loaded avatars as before
        document.querySelectorAll('.avatarOption').forEach(avatar => {
            avatar.addEventListener('click', function () {
                document.querySelectorAll('.avatarOption').forEach(img => img.style.border = '2px solid transparent');
                this.style.border = '5px solid #ff4500';
                selectAvatar(this.dataset.avatar);
            });
        });
    } catch (error) {
        console.error('Failed to load avatars:', error);
    }
}

// Call the function to load avatars and set up event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadAndHandleAvatars();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const firstName = firstNameInput.value.trim();
    const badgeName = badgeNameInput.value.trim();
    const selectedAvatar = localStorage.getItem('selectedAvatar');

    // Validate inputs to ensure they are not empty
    if (!firstName || !badgeName || !selectedAvatar) {
        alert('Your first name, badge name, and an avatar selection are required.');
        return;
    }

    // Persist user details in localStorage
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('badgeName', badgeName); // Ensure badgeName is correctly stored in localStorage

    // Navigate user to the chat interface
    window.location.href = 'chat.html';
});
