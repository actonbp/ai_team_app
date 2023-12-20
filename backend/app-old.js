require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 1000;
const conversationHistories = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];
const agentInformation = {
    'Agent 1': 'I am Agent 1. My unique information is: East Point Mall has at least 50 parking spaces. Our task is to evaluate three locations for a new restaurant: East Point Mall, Starlight Valley, and Cape James Beach. Rank these locations from most to least desirable.',
    'Agent 2': 'I am Agent 2. My unique information is: Starlight Valley is larger than 2,000 square feet. Our task is to evaluate three locations for a new restaurant: East Point Mall, Starlight Valley, and Cape James Beach. Rank these locations from most to least desirable.',
    'Agent 3': 'I am Agent 3. My unique information is: Cape James Beach has a purchasing cost of less than $1MM. Our task is to evaluate three locations for a new restaurant: East Point Mall, Starlight Valley, and Cape James Beach. Rank these locations from most to least desirable.'
};

let lastSelectedAgentIndex = null;

async function callOpenAI(conversationId, agentName, firstName, badgeName) {
    try {
        const conversationHistory = conversationHistories[conversationId] || [];
        const messages = conversationHistory.map(entry => ({
            role: entry.role,
            content: entry.content
        }));

        // Include the agent's information in the messages array
        messages.push({
            role: 'system',
            content: agentInformation[agentName]
        });

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-3.5-turbo',
            messages: messages
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });

        // Append the new AI message to the conversation history
        conversationHistory.push({
            role: 'assistant',
            content: response.data.choices[0].message.content
        });

        // Update the stored conversation history
        conversationHistories[conversationId] = conversationHistory;

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return 'Sorry, I am unable to generate a response at the moment.';
    }
}

app.post('/ask-openai', async (req, res) => {
    try {
        const { conversationId } = req.body;

        // Each agent talks to one another
        const responses = [];
        for (let i = 0; i < agents.length; i++) {
            const agentName = agents[i];
            const response = await callOpenAI(conversationId, agentName);

            // Add agent's message to history
            conversationHistories[conversationId].push({
                role: agentName,
                content: response
            });

            responses.push({ role: agentName, content: response });
        }

        res.json({ responses });
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