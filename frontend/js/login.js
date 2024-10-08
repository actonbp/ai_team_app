// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');
const avatarCarousel = document.getElementById('avatarCarousel'); // Ensure this matches the ID in login.html for the avatar section

// Function to handle avatar selection and store it in localStorage
function selectAvatar(avatarFileName) {
    localStorage.setItem('selectedAvatar', `./${avatarFileName}`);
    localStorage.setItem('avatarFile', `./${avatarFileName}`);
    // console.log(`Selected avatar file path: ./${avatarFileName}`); // Print the file path of the selected avatar
}

// Function to dynamically load avatars, add event listeners for selection, and print all loaded avatars in the console
async function loadAndHandleAvatars() {
    try {
        let avatars = await fetchAvatars(); // This should return an array of avatar file names
        avatars = avatars.filter(avatar => avatar.endsWith('.png')); // Filter only .png files
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
        const response = await fetch('/avatars'); // Changed to relative URL
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

    // Check the self_cond value and adjust badgeNameInput visibility
    const selfCond = localStorage.getItem('self_cond');
    if (selfCond !== 'public') {
        const badgeNameInput = document.getElementById('badgeNameInput');
        if (badgeNameInput) {
            badgeNameInput.style.display = 'none'; // Hide the badgeNameInput if condition is not 'public'
        }
    }

    // Check the self_cond value and adjust self-reflective-title-section visibility
    const selfReflectiveTitleSection = document.querySelector('.self-reflective-title-section');
    if (selfCond !== 'public') {
        if (selfReflectiveTitleSection) {
            selfReflectiveTitleSection.style.display = 'none'; // Hide the section if condition is not 'public'
        }
    }

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
    // Display the .self-reflective-title-section-2 based on self_cond value and force acknowledgment
    if (selfCond === 'private' || selfCond === 'public') {
        const titleSection2 = document.querySelector('.self-reflective-title-section-2');
        titleSection2.style.display = 'block';

        // Disable page advancement button initially
        const advanceButton = document.getElementById('advanceButton');
        advanceButton.disabled = true;

        // Transform the acknowledgment process into a checkbox confirmation
        const acknowledgmentCheckbox = document.getElementById('acknowledgmentCheckbox');
        acknowledgmentCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // Show the modal
                const modal = document.getElementById('confirmationModal');
                modal.style.display = "block";

                // Get the <span> element that closes the modal
                const span = document.getElementsByClassName("close")[0];

                // When the user clicks on <span> (x), close the modal
                span.onclick = function() {
                    modal.style.display = "none";
                }

                // When the user clicks anywhere outside of the modal, close it
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
            } else {
                // Keep the advance button disabled if the checkbox is unchecked
                advanceButton.disabled = true;
            }
        });

        document.getElementById('titleConfirmationCheckbox').addEventListener('change', function () {
            if (this.checked) {
                alert('Thank you for confirming your badge/title. Please explain what your title or badge means at the beginning of the chat.');
            }
        });
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selfCond = localStorage.getItem('self_cond');
    if (selfCond === 'private' || selfCond === 'public') {
        const titleConfirmed = document.getElementById('titleConfirmationCheckbox').checked;
        if (!titleConfirmed) {
            alert('Please think about your self-reflective title and check the box before proceeding.');
            return;
        }
    }
    const firstName = firstNameInput.value.trim();
    const selectedAvatar = localStorage.getItem('selectedAvatar');
    let badgeName = '';

    // Only require badgeName if self_cond is 'public'
    if (selfCond === 'public') {
        badgeName = badgeNameInput.value.trim();
        if (!firstName || !badgeName || !selectedAvatar) {
            alert('Your first name, badge name, and an avatar selection are required.');
            return;
        }
    } else {
        if (!firstName || !selectedAvatar) {
            alert('Your first name and an avatar selection are required.');
            return;
        }
    }

    // Persist user details in localStorage
    localStorage.setItem('firstName', firstName);
    if (selfCond === 'public') {
        localStorage.setItem('badgeName', badgeName);
    }
    localStorage.setItem('lastVisitedPage', 'chat.html');

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