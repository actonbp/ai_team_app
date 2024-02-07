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

// Integrate the provided function into the existing code
async function callOpenAI(messages, role = 'user') {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: `You are a human on a team of purchasing executives for Big Restaurant. 
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
                  Only use shorter, brief messages, like a person in a chat would. 
                  Always use the past conversation history in your messages, and you if you don't have any past text, say "I don't have any prior info".
                Keep working until the group can come to a decision`
      },
      ...messages.map(entry => ({ role, content: entry.content }))
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

        // Select a different agent for each message
        let selectedAgentIndex;
        do {
            selectedAgentIndex = Math.floor(Math.random() * agents.length);
        } while (selectedAgentIndex === lastSelectedAgentIndex);
        lastSelectedAgentIndex = selectedAgentIndex;

        const agentName = agents[selectedAgentIndex];
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

        // Call OpenAI with the updated history
        const responseContent = await callOpenAI(messages, 'user');

        // Append the new AI message to the conversation history
        conversationHistory.push({
            role: 'assistant',
            content: responseContent
        });

        // Update the stored conversation history
        conversationHistories[conversationId] = conversationHistory;

        res.json({
            responses: [
                { role: agentName, content: agentInformation[agentName] },
                { role: 'assistant', content: responseContent }
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