window.onload = function () {
    generateUniqueCode(); // Keep this function call if it's defined in this script or elsewhere

    const conversationId = localStorage.getItem('currentConversationId');
    const raiseHandCount = localStorage.getItem('raiseHandCount') || '0';
    const messageCount = localStorage.getItem('messageCount') || '0';
    const totalChars = localStorage.getItem('totalChars') || '0';
    const averageCharsPerMessage = messageCount > 0 ? Math.round((totalChars / messageCount) * 100) / 100 : '0';
    const avatarFile = localStorage.getItem('avatarFile');
    const finishcode = localStorage.getItem('finish_code');
    //console.log(`Avatar File Name: ${avatarFile}`);
    // console.log(`Finish code is: ${finishcode}`);


    if (conversationId) {
        fetch('/mark-chat-finished', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversationId: conversationId,
                ProlificID: localStorage.getItem('prolificId'),
                RaisedHandCount: raiseHandCount,
                avatarFile: `"${avatarFile}"`, // Changed key to 'avatarFile' and added quotes around the avatar file name
                SelfCond: localStorage.getItem('self_cond'),
                TeamRace: localStorage.getItem('team_race'),
                Finished: new Date().toISOString(), // Timestamp when the simulation ends
                MessageCount: messageCount,
                AverageCharsPerMessage: averageCharsPerMessage, // Ensures it's a number or defaults to '0'
                FinishCode: finishcode // Add the finish_code to the data sent
            }),
        })
        .then(response => response.json())
        .then(data => console.log(data.message))
        .catch(error => console.error('Error marking chat as finished:', error));
    }
};