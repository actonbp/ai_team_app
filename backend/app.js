require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 1000;
const conversationHistories = {};

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];
let agentInformation = {
  "Agent 1": `Your name is Agent 1 (only refer to yourself as that). 
  Here is your unique info:
  - East Point Mall: 
    - At least 50 parking spaces - Y
    - Larger than 2000 square feet - N
    - Substantial foot traffic - Y
    - Large tourist population - N
    - Large student population - Y
    - Quick access to waste disposal - Y
    - Large population of employable individuals - Y
  - Starlight Valley: 
    - At least 50 parking spaces - Y
    - Large student population - N
    - Quick access to waste disposal - Y
    - Large population of employable individuals - N
  - Cape James Beach: 
    - At least 50 parking spaces - N
    - No more than 2 direct competitors in vicinity - Y
    - Large tourist population - Y
    - Large student population - N
    - Quick access to waste disposal - N
    - Large population of employable individuals - Y`,
  "Agent 2": `Your name is Agent 2. (only refer to yourself as that). 
  Here is your unique info:
  - East Point Mall: 
    - At least 50 parking spaces - Y
    - Purchasing cost of less than 1MM - N
    - Substantial foot traffic - Y
    - Large tourist population - N
    - Large student population - Y
    - Quick access to waste disposal - Y
    - Large population of employable individuals - Y
  - Starlight Valley: 
    - Larger than 2000 square feet - Y
    - Substantial foot traffic - Y
    - Large tourist population - Y
    - Large student population - N
    - Large population of employable individuals - N
  - Cape James Beach: 
    - At least 50 parking spaces - N
    - Purchasing cost of less than 1MM - Y
    - No more than 2 direct competitors in vicinity - Y
    - Substantial foot traffic - Y
    - Large tourist population - Y`,
  "Agent 3": `Your name is Agent 3. (only refer to yourself as that).
  Here is your unique info:
  - East Point Mall: 
    - At least 50 parking spaces - Y
    - Substantial foot traffic - Y
    - Low maintenance costs - N
    - Large tourist population - N
    - Large student population - Y
    - Quick access to waste disposal - Y
    - Large population of employable individuals - Y
  - Starlight Valley: 
    - Purchasing cost of less than 1MM - Y
    - No more than 2 direct competitors in vicinity - Y
    - Large student population - N
    - Large population of employable individuals - N
  - Cape James Beach: 
    - Substantial foot traffic - Y
    - Low maintenance costs - Y
    - Large tourist population - Y
    - Quick access to waste disposal - N
    - Large population of employable individuals - Y`
};
let lastSelectedAgentIndex = null;

// Integrate the provided function into the existing code
async function callOpenAI(messages, role = 'user') {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: `You are a human on a team of purchasing executives for Big Restaurant. 
                  Your team is evaluating three potential locations for a new restaurant: 
                  East Point Mall, Starlight Valley, and Cape James Beach. 
                  Discuss with your team members and rank these locations from most to least desirable 
                  based on the fulfillment of the following ten criteria below.

                  - Keep you messages short and concise, and take any strategy you want to communicate with team members. Messages should be 1 or 2 lines max.
                  - You can ask specfic team members for their input, or respond to others directly.
                  - You should first introduce yourself if you have no prior chat information. 
                  - Always use the previous chat information to make decisions. 
                  - This task should take multiple messages back and forth between team members. You should not come to a conclusion from your first message. Learn all of the team member's info first. 

                  CRITERIA: 
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

                  IMPORTANT:
                  - "Y" means yes and "N" means no, for a location feature. 
                  - DO NO just paste the info into the chat. Act like a human and type out brief info in your messages 
                  - Work through it with your teamates over multiple messages to come to the final answer
                  - Only use shorter, brief messages, like a person in a chat would. 
                  - lways use the past conversation history in your messages, and you if you don't have any past text, say "I don't have any prior info".
                  - Keep working until the group can come to a decision`
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

        // Include the agent's information in the messages array in plain text format
        messages.push({
            role: 'agentName',
            content: `responseContent`
        });

        // Call OpenAI with the updated history
        const responseContent = await callOpenAI(messages, 'user');

        // Append the new AI message to the conversation history
        conversationHistory.push({
            role: agentName,
            content: responseContent
        });

        // Update the stored conversation history
        conversationHistories[conversationId] = conversationHistory;

        res.json({
            responses: [
                //{ role: agentName, content: `Agent ${selectedAgentIndex + 1} information: ${agentInformation[agentName]}` },
                { role: agentName, content: responseContent }
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