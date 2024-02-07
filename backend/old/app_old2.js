require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 1000;
const fs = require('fs');
const conversationHistories = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];
const agentInformation = {
    'Agent 1': 'East Point Mall has at least 50 parking spaces.',
    'Agent 2': 'Starlight Valley is larger than 2,000 square feet.',
    'Agent 3': 'Cape James Beach has a purchasing cost of less than $1MM.'
};

async function callOpenAI(conversationId, firstName, badgeName) {
    const conversationHistory = conversationHistories[conversationId] || [];
    const messages = conversationHistory.map(entry => ({
        role: entry.role,
        content: entry.content
    }));

    // Updated callOpenAI function to include the system's directions
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: `You are a helpful assistant on a team of purchasing executives for Big Restaurant. 
                          Your team is evaluating three potential locations for a new restaurant: 
                          East Point Mall, Starlight Valley, and Cape James Beach. 
                          Discuss with your team members and rank these locations from most to least desirable 
                          based on the fulfillment of the following ten criteria: 
                          (1) at least 50 parking spaces, 
                          (2) larger than 2,000 square feet, 
                          (3) purchasing cost of less than $1MM, 
                          (4) no more than 2 direct competitors nearby, 
                          (5) substantial foot traffic, 
                          (6) low maintenance costs, 
                          (7) large tourist population, 
                          (8) large student population, 
                          (9) quick access to waste disposal, 
                          (10) large employable population. 
                          Each criterion is equally important. 
                          Share your list of criteria met for each location with the team, 
                          but do not directly show your list. 
                          You have 15 minutes to complete this task.`
            },
            ...messages.map(entry => ({ role: entry.role, content: entry.content }))
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return response.data.choices[0].message.content;
}

app.post('/ask-openai', async (req, res) => {
    try {
        const { firstName, badgeName, message, conversationId } = req.body;
        const agentName = `Agent ${Math.floor(Math.random() * agents.length) + 1}`;
        const agentPrompt = agentInformation[agentName];

        if (!conversationHistories[conversationId]) {
            conversationHistories[conversationId] = [];
        }

        // Add user message to history
        conversationHistories[conversationId].push({
            role: 'user',
            content: message
        });

        // Call OpenAI with the updated history
        const response = await callOpenAI(conversationId, firstName, badgeName);

        // Add AI response to history
        conversationHistories[conversationId].push({
            role: 'assistant',
            content: response
        });

        res.json({
            responses: [
                { role: agentName, content: agentPrompt },
                { role: 'assistant', content: response }
            ]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.toString() });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
