require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid'); // Add this at the top where other modules are imported
// Import the necessary AWS SDK v3 packages
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const app = express();
const PORT = 3000; // Set the port directly to 3000

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
app.post('/start-chat', (req, res) => {
  const newConversationId = uuidv4(); // Generate a unique ID
  conversationHistories[newConversationId] = []; // Initialize conversation history
  console.log(`New conversation started with ID: ${newConversationId}`); // Print the conversationId to the console
  res.json({ conversationId: newConversationId }); // Send ID to client
});
// Async function to initialize your application
async function initializeApp() {
  const port = 3000;
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
  "James": {
    description: `Your name is JAMES, youre a go-to guy for quick, witty responses. You are extraverted, confident, and in positive. 
    Your three teamates are Sophia, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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
    badge: "Master of Motivation"
  },
  "Sophia": {
    description: `Your name is SOPHIA, youre always ready to provide detailed, thoughtful insights. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly.
    Your three teamates are James, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions. 
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
    badge: "Strategist Supreme"
  },
  "Ethan": {
    description: `Your name is ETHAN, youre a analytical expert with a knack for numbers--known for short responses. 
    You are short, and often rude. You are high on neuroticism and low on agreeableness. 
    Your three teamates are James, Sophia, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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
  "James": `Your name is JAMES, youre a go-to guy for quick, witty responses. You are extraverted, confident, and in positive. 
  Your three teamates are Sophia, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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
  Your three teamates are James, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions. 
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
  Your three teamates are James, Sophia, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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


async function decideParticipation(conversationHistory, agentName) {
  // Constructing a new prompt for deciding participation
  const participationPrompt = `
  James is outgoing and likes to particpate. He does not participate if he just did last message. 
  Ethan is Stoic and less likely to particpate. He does not participate if he just did last message.
  Sophia is very outgoing and loves to particpate. She might particpate even if she just did last message.
  
  Given the following conversation history and knowing you are impersonating ${agentName}, 
  decide whether you should participate in the conversation. IMPORTANT: YOU SHOULD NOT participate if you just did recently, 
  and you should only if you have helpful information to offer. Take some breaks from particpating randomly. 
  It's good to respond early on in the conversation, but it's also good to take breaks.
  If you have not participated in the last 3 messages, you should participate.

  IMPORTANT: Respond with "YES" or "NO".

Conversation History:
${conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n')}

Should ${agentName} participate in the conversation?`;

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: participationPrompt
      }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    }
  });

  // Extracting the decision from the response
  const decision = response.data.choices[0].message.content.trim();
  return decision.toUpperCase(); // Ensuring the decision is in uppercase for consistency
}

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
                  asking clarifying questions, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages. 
                  MAKE CONVERSATION NO MATTER WHAT THE TOPIC IS. YOU ARE PRETENDING TO BE A HUMAN IN A CHAT ROOM. TYPOS, MISTAKES, ETC ARE GOOD.

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
                  - Introduce yourself by your name in your first message if you can and always know who you are
                  - If THE REAL PERSON ADDS A MESSAGE (ANYONE NOT NAMED SOPHIA, JAMES, ETHAN), PRIORITIZE RESPONDING TO THEM, NO MATTER WHAT THEY SAY MAKE CONVERSATION.
                  - THE REAL PERSON HAS A STAR IN THE TRANSCRIPT. PRIORITIZE THEIR MESSAGES NO MATTER WHAT!

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
                  IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else). You must have the rankings before this. 
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
    const { message, conversationId } = req.body;
    // Ensure there's a valid conversationId provided
    if (!conversationId || !conversationHistories[conversationId]) {
      return res.status(400).json({ error: "Invalid or missing conversation ID." });
    }
    const conversationHistory = conversationHistories[conversationId] || [];
    let responses = [];
    let participatingAgents = []; // Moved inside the try block to ensure scope is correct

    // Add the user's message to the conversation history with stars around the message
    if (message) {
      conversationHistory.push({
        role: 'user',
        content: `⭐${message}⭐`
      });
    }

    // Loop through each agent to get their response
    for (const agentName of agents) {
      const agentInfo = agentInformation[agentName];
      const messages = [...conversationHistory, { role: 'system', content: agentInfo }];

      // Inside your /ask-openai endpoint
      // Decide if the agent wants to participate
      const participationDecision = await decideParticipation(messages, agentName);
      console.log(`${agentName} participation decision: ${participationDecision}`); // Print the participation decision for each agent
      if (participationDecision === 'YES') {
        participatingAgents.push(agentName); // Add agent to participating list if they decide to participate
        const responseContent = await callOpenAI(messages, 'user');
        responses.push({ role: agentName, content: responseContent });

        // Append the new AI message to the conversation history
        conversationHistory.push({
          role: agentName,
          content: responseContent
        });
      }
      
    }
    // Update the stored conversation history
    conversationHistories[conversationId] = conversationHistory;

    // After the for loop that processes each agent
    if (responses.length > 0) {
      // Process and send back the responses as you normally would
      res.json({ responses, participatingAgents });
    } else {
      // Handle the case where there are no responses, e.g., send a default message or error
      res.json({ message: "No agents available to respond at this time." });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

app.post('/save-message', async (req, res) => {
  const { conversationId, message } = req.body;
  // Check if message object is properly structured
  if (!message || typeof message.role !== 'string' || typeof message.content !== 'string') {
    return res.status(400).json({ error: 'Invalid message format.' });
  }
  const filePath = path.join(__dirname, 'transcripts', `${conversationId}.txt`);
  let fileContent = `${message.role}: ${message.content}\n`;

  try {
    await fs.appendFile(filePath, fileContent, { flag: 'a' });
    res.json({ message: "Message saved successfully." });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});



// New endpoint to get avatar filenames
app.get('/avatars', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const avatarsDirectory = path.join(__dirname, '../frontend/avatars');
  try {
    const files = await fs.readdir(avatarsDirectory);
    const avatars = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)); // Filter for image files only
    res.json(avatars);
  } catch (error) {
    console.error('Failed to read avatars directory:', error);
    res.status(500).send('Failed to load avatars.');
  }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



