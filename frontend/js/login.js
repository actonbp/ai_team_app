// login.js
const loginForm = document.getElementById('login-form');
const firstNameInput = document.getElementById('firstNameInput');
const badgeNameInput = document.getElementById('badgeNameInput');
const avatarGrid = document.getElementById('avatarGrid');
const avatars = ['avatar_1.png', 'avatar_2.png', 'avatar_3.png']; // List your avatar filenames

// Function to handle avatar selection and store it in localStorage
function selectAvatar(avatarFileName) {
    localStorage.setItem('selectedAvatar', `avatars/${avatarFileName}`);
}

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

    // Dynamically load avatars into the grid
    avatars.forEach(avatar => {
        const imgElement = document.createElement('img');
        imgElement.src = `avatars/${avatar}`;
        imgElement.classList.add('avatarOption');
        imgElement.dataset.avatar = avatar;
        avatarGrid.appendChild(imgElement);
    });

    // Event listener for avatar selection
    document.querySelectorAll('.avatarOption').forEach(avatar => {
        avatar.addEventListener('click', function () {
            document.querySelectorAll('.avatarOption').forEach(img => img.classList.remove('selected'));
            this.classList.add('selected');
            localStorage.setItem('selectedAvatar', this.dataset.avatar);
        });
    });

    // Dynamically load avatars into the grid
    avatars.forEach(avatar => {
        const imgElement = document.createElement('img');
        imgElement.src = `frontend/avatars/${avatar}`;
        imgElement.classList.add('avatarOption');
        imgElement.dataset.avatar = avatar;
        avatarGrid.appendChild(imgElement);
    });

    // Event listener for avatar selection
    document.querySelectorAll('.avatarOption').forEach(avatar => {
        avatar.addEventListener('click', function () {
            document.querySelectorAll('.avatarOption').forEach(img => img.classList.remove('selected'));
            this.classList.add('selected');
            localStorage.setItem('selectedAvatar', this.dataset.avatar);
        });
    });

    // Persist user details in localStorage
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('badgeName', badgeName);

    // Navigate user to the chat interface
    window.location.href = 'chat.html';
});

document.querySelectorAll('.avatarOption').forEach(avatar => {
    avatar.addEventListener('click', function () {
        document.querySelectorAll('.avatarOption').forEach(img => img.classList.remove('selected'));
        this.classList.add('selected');
        localStorage.setItem('selectedAvatar', this.dataset.avatar); // Save the selected avatar
    });
});
