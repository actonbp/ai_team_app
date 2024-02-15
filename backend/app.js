require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
// Import the necessary AWS SDK v3 packages
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Create a new SSM client instance
const ssmClient = new SSMClient({ region: 'us-east-1' });

async function getParameter(parameterName) {
  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });

  try {
    const response = await ssmClient.send(command);
    return response.Parameter.Value;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Async function to initialize your application
async function initializeApp() {
  const port = process.env.PORT || 3000;
  let OPENAI_API_KEY;

  // Check if running on EC2 instance
  if (process.env.IS_EC2_INSTANCE === 'true') {
    OPENAI_API_KEY = await getParameter('/myapp/OPENAI_API_KEY');
  } else {
    OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }

  // Ensure the API key is retrieved before proceeding
  if (!OPENAI_API_KEY) {
    console.error('Failed to retrieve OPENAI_API_KEY');
    process.exit(1); // Exit the application if the API key is not available
  }

  // Your existing app setup and routes go here
  // Make sure to use OPENAI_API_KEY where needed
}

// Call the initializeApp function to start the app
initializeApp().catch(console.error);
// Existing code below this line remains unchanged
const conversationHistories = {};
const agents = ['James', 'Sophia', 'Ethan'];
let agentInformation = {
  "James": `Your name is JAMES, youre a go-to guy for quick, witty responses. You are extraverted, confident, and in positive. 
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
  "Sophia": `Your name is SOPHIA, youre always ready to provide detailed, thoughtful insights. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly.
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
  "Ethan": `Your name is ETHAN, youre a analytical expert with a knack for numbers--known for short responses. 
  You are short, and often rude. You are high on neuroticism and low on agreeableness. 
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
        content: `You are an AI impersonating a human, who is on a new team of purchasing executives for Big Restaurant in a chat-based discussion. 
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
                  - Introduce yourself by your name in your first message if you can and alway know who you are

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

                  Please keep responses under 100-200 characters if you can, similar to quick text messages.
                  You can ask specfic other team members questions if you have not heard from someone. Always use the prior chat for context.
                  IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else).
                  DO NOT stop until you complete the task. And seek to have multiple shorter messages. Wait to finish your point on the next message where possible`
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

        const currentAgentName = agents[selectedAgentIndex]; // This is your currentAgentName
        const agentInfo = agentInformation[currentAgentName];
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
        const typingDelay = 3000; // Simulate a typing delay
        const messageDelay = 6000; // Simulate a delay between messages

        setTimeout(() => {
            // Append the new AI message to the conversation history
            conversationHistory.push({
                role: currentAgentName, // Use currentAgentName here
                content: responseContent
            });

            // Update the stored conversation history
            conversationHistories[conversationId] = conversationHistory;

            // Send the response after the delay
            res.json({
                responses: [
                    { role: currentAgentName, content: responseContent } // Include currentAgentName in the response
                ],
                currentAgentName // Optionally, explicitly send the currentAgentName back to the client
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
