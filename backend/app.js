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
<<<<<<< HEAD
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

=======
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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)
async function callOpenAI(messages, role = 'user') {
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
<<<<<<< HEAD
        content: `Pretend you are an human assisting a new team of purchasing executives for Big Restaurant in a chat-based discussion. 
                  The team is evaluating three potential locations for a new restaurant: 
=======
        content: `You are a human on a team of purchasing executives for Big Restaurant. 
                  Your team is evaluating three potential locations for a new restaurant: 
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)
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
  const { conversationId, message } = req.body;
  const conversationHistory = conversationHistories[conversationId] || [];

  // Add the new message to the conversation history
  if (message) {
    conversationHistory.push({ role: 'user', content: message });
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)

    // Save the updated conversation history
    conversationHistories[conversationId] = conversationHistory;

<<<<<<< HEAD
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

=======
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
>>>>>>> parent of caa1ce5 (made chat better, more realistic, shorter via changing prompts. App working stable)
