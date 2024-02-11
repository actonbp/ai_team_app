// chat.js
if (!localStorage.getItem('badgeName')) {
    window.location.href = 'login.html';
}
const firstName = localStorage.getItem('firstName');
const badgeName = localStorage.getItem('badgeName');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessageButton');
const raiseHandButton = document.getElementById('raiseHandButton');
const messageContainer = document.getElementById('chatWindow');
const typingIndicator = document.createElement('div');
typingIndicator.innerText = 'Agent is typing...';

class ChatSession {
    constructor() {
        this.conversationHistory = [];
        this.typingDelay = 10000;
        this.conversationId = localStorage.getItem('conversationId');
        this.init();
    }

    init() {
        this.startChatSession();
        messageInput.disabled = true;
        sendMessageButton.disabled = true;
        this.attachEventListeners();
    }

    startChatSession() {
        fetch('/start-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                this.conversationId = data.conversationId;
                localStorage.setItem('conversationId', this.conversationId);
            })
            .catch(error => console.error('Error starting chat session:', error));
    }

    sendMessageToOpenAI(message) {
        if (!this.conversationId) {
            console.error('Conversation ID is missing.');
            return;
        }

        fetch('/ask-openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationId: this.conversationId,
                message: message,
                conversationHistory: this.conversationHistory
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.responses && data.responses.length > 0) {
                    data.responses.forEach((response) => {
                        setTimeout(() => {
                            this.appendMessage(`${response.role}: ${response.content}`, true);
                        }, response.delay);
                    });
                } else {
                    console.error('Unexpected response structure:', data);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    appendMessage(messageText, isAgent = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        const avatarElement = document.createElement('img');
        avatarElement.classList.add('avatar');
        avatarElement.src = 'images/avatar_1.png';
        const textElement = document.createElement('div');
        textElement.innerText = messageText;
        textElement.classList.add('text');
        messageElement.appendChild(avatarElement);
        messageElement.appendChild(textElement);
        messageContainer.append(messageElement);
        this.conversationHistory.push({ role: isAgent ? 'agent' : badgeName, content: messageText });
        return messageElement;
    }

    attachEventListeners() {
        sendMessageButton.addEventListener('click', () => {
            const message = messageInput.value;
            this.showTypingIndicator(badgeName);
            setTimeout(() => {
                this.appendMessage(message, false);
                this.sendMessageToOpenAI(message);
            }, this.typingDelay);
        });

        raiseHandButton.addEventListener('click', () => {
            messageInput.disabled = false;
            sendMessageButton.disabled = false;
        });
    }

    showTypingIndicator(agentName) {
        typingIndicator.innerText = `${agentName} is typing...`;
        messageContainer.appendChild(typingIndicator);
    }

    hideTypingIndicator() {
        if (typingIndicator.parentNode === messageContainer) {
            messageContainer.removeChild(typingIndicator);
        }
    }
}

const chatSession = new ChatSession();
