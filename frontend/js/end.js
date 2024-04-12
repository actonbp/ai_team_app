window.onload = function () {
    generateUniqueCode(); // Assuming this function is defined elsewhere or in this script

    const conversationId = localStorage.getItem('currentConversationId');
    if (conversationId) {
        fetch('/mark-chat-finished', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ conversationId }),
        })
            .then(response => response.json())
            .then(data => console.log(data.message))
            .catch(error => console.error('Error marking chat as finished:', error));
    }
};