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
  "Agent 1": `Your name is Agent 1. Keep msgs short, like in a quick chat. 
  Here's your info:
  - East Point Mall: 
    - At least 50 parking spaces - Y
    - Larger than 2000 sqft - N
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
  "Agent 2": ` Your Name's Agent 2. Use short msgs, typos r ok. 
  Ur info:
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
  "Agent 3": `Your name is Agent 3. Keep it brief, casual chat style. 
  Quick info:
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

async function callOpenAI(messages, role = 'user') {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: `You are an AI assisting a team of purchasing executives for Big Restaurant in a chat-based discussion. 
                  The team is evaluating three potential locations for a new restaurant: 
                  East Point Mall, Starlight Valley, and Cape James Beach. 
                  Your role is to help the team rank these locations from most to least desirable 
                  based on ten criteria. Engage in the chat by providing insights, 
                  asking clarifying questions, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages. When you are finished, you can say something short about being done.

                  GUIDELINES:

                  - Keep your messages short and to the point, typically no longer than a few lines.
                  - Respond to specific questions or prompts from team members.
                  - Introduce yourself in the chat if you're addressing someone for the first time.
                  - Use the information provided by team members to inform the discussion.
                  - This task involves a back-and-forth exchange. Avoid jumping to conclusions without sufficient discussion.
                  - "Y" means yes, "N" means no for a location feature. Share insights based on these indicators without pasting the list.
                  - Adapt to the flow of the conversation and provide responses that are contextually relevant.
                  - If you lack past conversation history, indicate that you are ready to assist with the information at hand.
                  - Continue the discussion until the team reaches a consensus on the ranking of the locations.
                  - DO NOT give away that you are a single AI Bot. Pretend you are a real person in a team chat.

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

                  Please keep responses brief, similar to quick text messages. Aim for one to two sentences max per message.
                  You can ask specfic other team members questions if you have not heard from someone. Always use the prior chat for context.`
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
        const agentInfo = agentInformation[agentName];
        const conversationHistory = conversationHistories[conversationId] || [];

        // Add the user's message to the conversation history
        if (message) {
            conversationHistory.push({
                role: 'user',
                content: message
            });
        }

        // Prepare the messages for the OpenAI API, including the agent's information
        const messages = conversationHistory.map(entry => ({
            role: entry.role,
            content: entry.content
        }));

        // Insert the agent's information as the latest message from the agent
        messages.push({
            role: 'system',
            content: agentInfo
        });

        // Call OpenAI with the updated history
        const responseContent = await callOpenAI(messages, 'user');

        // Simulate typing delay
        const typingDelay = 1000; // 1 second delay
        const messageDelay = 2000; // 2 seconds delay between messages

        setTimeout(() => {
            // Append the new AI message to the conversation history
            conversationHistory.push({
                role: agentName,
                content: responseContent
            });

            // Update the stored conversation history
            conversationHistories[conversationId] = conversationHistory;

            // Send the response after the delay
            res.json({
                responses: [
                    { role: agentName, content: responseContent }
                ]
            });
        }, typingDelay + messageDelay);

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
