// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');
const avatarCarousel = document.getElementById('avatarCarousel'); // Ensure this matches the ID in login.html for the avatar section

// Function to handle avatar selection and store it in localStorage
function selectAvatar(avatarFileName) {
    localStorage.setItem('selectedAvatar', `./${avatarFileName}`);
    console.log(`Selected avatar file path: ./${avatarFileName}`); // Print the file path of the selected avatar
}

// Function to dynamically load avatars, add event listeners for selection, and print all loaded avatars in the console
async function loadAndHandleAvatars() {
    try {
        let avatars = await fetchAvatars(); // This should return an array of avatar file names
        avatars = shuffleArray(avatars); // Shuffle avatars before appending them to the grid
        const avatarSelectionGrid = document.querySelector('.avatar-selection-grid'); // Select the avatar-selection-grid element from login.html
        avatars.forEach(avatarFileName => {
            const avatarItem = document.createElement('div');
            avatarItem.className = 'avatar-item';
            avatarItem.innerHTML = `<img src="./${avatarFileName}" alt="Avatar" data-avatar="${avatarFileName}">`; // Ensure the path is correct and add data-avatar attribute
            avatarSelectionGrid.appendChild(avatarItem); // Append the avatarItem to the avatarSelectionGrid
        });

        // Attach event listeners to the loaded avatars for selection
        document.querySelectorAll('.avatar-item img').forEach(item => {
            item.addEventListener('click', function() {
                document.querySelectorAll('.avatar-item').forEach(div => div.classList.remove('selected'));
                this.parentElement.classList.add('selected');
                selectAvatar(this.dataset.avatar);
            });
        });
    } catch (error) {
        console.error('Failed to load avatars:', error);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

async function fetchAvatars() {
    try {
        const response = await fetch('http://localhost:3000/avatars');
        if (!response.ok) throw new Error('Failed to fetch avatars');
        const avatars = await response.json();
        return avatars;
    } catch (error) {
        console.error('Error fetching avatars:', error);
        return [];
    }
}

// Call the function to load avatars and set up event listeners when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadAndHandleAvatars();


    // Check if the table exists before attempting to modify it
    const table = document.querySelector('table');
    if (table) {
        table.classList.add('styled-table');

        const tableHeaders = table.querySelectorAll('th');
        tableHeaders.forEach(header => {
            header.classList.add('styled-header');
        });

        const tableCells = table.querySelectorAll('td');
        tableCells.forEach(cell => {
            cell.classList.add('styled-cell');
        });
    }
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

document.getElementById('submit').addEventListener('click', function (e) {
    const selectedAvatar = document.querySelector('.avatar-item.selected');
    if (!selectedAvatar) {
        e.preventDefault(); // Prevent the form submission or button action
        alert('Please select an avatar to continue.'); // Show a message
    }
});