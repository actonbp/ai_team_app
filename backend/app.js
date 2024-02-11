require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 1000;
const conversationHistories = {};
const crypto = require('crypto'); // Add this line to use the crypto module for generating unique IDs

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

function generateConversationId() {
  return crypto.randomUUID();
}

app.post('/start-chat', (req, res) => {
  const conversationId = generateConversationId(); // This function now generates a unique ID
  conversationHistories[conversationId] = []; // Initialize conversation history

  res.json({ conversationId }); // Send the conversationId back to the frontend
});


app.post('/decide-agents', async (req, res) => {
  const { conversationId } = req.body;
  const conversationHistory = conversationHistories[conversationId] || [];

  const lastMessage = conversationHistory[conversationHistory.length - 1];

  try {
    // Call OpenAI to get a relevance vector for agent selection
    const relevanceVector = await callOpenAIForAgentSelection([lastMessage]);

    // Determine the relevant agents based on the relevance vector
    const relevantAgents = determineRelevantAgentsBasedOnVector(relevanceVector, agentInformation);

    // Respond with the names of the relevant agents
    res.json({ relevantAgents });
  } catch (error) {
    console.error('Error determining relevant agents:', error);
    res.status(500).json({ error: 'Failed to determine relevant agents' });
  }
});

// This function should be added right after the existing callOpenAIForAgentSelection function
function determineRelevantAgentsBasedOnVector(vector, agentInformation) {
  const relevantAgents = [];
  Object.keys(agentInformation).forEach((agentName, index) => {
    // Assuming the vector is an array of 1s and 0s indicating relevance
    if (vector[index] === 1) {
      relevantAgents.push(agentName);
    }
  });
  return relevantAgents;
}

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];
let agentInformation = {
  "Agent 1": {
    description: `Your name is Agent 1. KEEP MESSAGES SHORT UNDER 100 CHARACTERS. Don't worry about grammar or spelling...treat it like a chat.
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
    keywords: ['parking spaces', 'larger than 2000 sqft', 'foot traffic', 'tourist population', 'student population', 'waste disposal', 'employable individuals', 'direct competitors']
  },
  "Agent 2": {
    description: ` Your Name's Agent 2. KEEP MESSAGES SHORT UNDER 100 CHARACTERS. Don't worry about grammar or spelling...treat it like a chat.
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
    keywords: ['purchasing cost', 'direct competitors', 'square feet', 'parking spaces', 'foot traffic', 'tourist population', 'student population', 'waste disposal', 'employable individuals']
  },
  "Agent 3": {
    description: `Your name is Agent 3. KEEP MESSAGES SHORT UNDER 100 CHARACTERS. Don't worry about grammar or spelling...treat it like a chat. 
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
      - Large population of employable individuals - Y`,
    keywords: ['maintenance costs', 'parking spaces', 'foot traffic', 'tourist population', 'student population', 'waste disposal', 'employable individuals', 'direct competitors', 'purchasing cost']
  }
};
let lastSelectedAgentIndex = null;

// Add this function right after the agentInformation object
function determineRelevantAgents(lastMessage, agentInformation) {
  const relevantAgents = [];
  // Check if lastMessage is not provided
  if (!lastMessage) {
    // If there is no lastMessage at all, select a random agent
    const randomIndex = Math.floor(Math.random() * agents.length);
    relevantAgents.push(agents[randomIndex]);
    return relevantAgents;
  }
  const messageContent = lastMessage.content.toLowerCase();

}

async function callOpenAIForAgentSelection(messages) {
  // Ensure the last message exists before proceeding
  if (messages.length === 0) {
    console.error('No messages provided for agent selection.');
    return [];
  }

  const lastMessage = messages[messages.length - 1].content;

  try {
    const agentSelectionResponse = await axios.post('https://api.openai.com/v1/completions', {
      model: 'gpt-3.5-turbo-instruct', // Adjusted to a more generic and currently available model
      prompt: `Given the last message: "${lastMessage}", and the information for each agent, determine a relevance vector indicating which agents should respond. Use 1 for relevant and 0 for not relevant. Agents: ${Object.keys(agentInformation).join(', ')}.`,
      temperature: 0, // Keeps the response deterministic
      max_tokens: 60, // Adjust according to the expected length of your output
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    // Assuming the response format is a string of 1s and 0s separated by commas
    const relevanceVector = agentSelectionResponse.data.choices[0].text.split(',').map(num => parseInt(num.trim(), 10));

    return relevanceVector;
  } catch (error) {
    console.error('Error calling OpenAI for agent selection:', error);
    throw new Error('Failed to call OpenAI for agent selection');
  }
}

async function callOpenAI(messages, role = 'user') {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: `Pretend you are an human assisting a new team of purchasing executives for Big Restaurant in a chat-based discussion. 
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
  const { conversationId, message } = req.body;
  const conversationHistory = conversationHistories[conversationId] || [];

  // Add the new message to the conversation history
  if (message) {
    conversationHistory.push({ role: 'user', content: message });
  }

  // Determine the relevant agents based on the last message
  const lastMessage = conversationHistory[conversationHistory.length - 1];
  const relevantAgents = determineRelevantAgents(lastMessage, agentInformation);

  // Make the call to OpenAI using each relevant agent's information
  try {
    const agentResponses = await Promise.all(relevantAgents.map(async (agentName) => {
      // Construct a new message array including the agent's information
      const messagesWithAgentInfo = [...conversationHistory, {
        role: 'system',
        content: agentInformation[agentName].description
      }];

      // Call OpenAI with the updated messages
      const openAIResponse = await callOpenAI(messagesWithAgentInfo, agentName);
      return { agent: agentName, response: openAIResponse };
    }));

    // Add all agent responses to the conversation history
    agentResponses.forEach(({ agent, response }) => {
      conversationHistory.push({ role: agent, content: response });
    });

    // Save the updated conversation history
    conversationHistories[conversationId] = conversationHistory;

    // Respond with all agent responses
    res.json({ responses: agentResponses.map(({ response }) => response) });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to call OpenAI' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

