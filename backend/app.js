require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid'); // Import UUID to generate unique IDs
// Import the necessary AWS SDK v3 packages for managing secrets
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const app = express();
const PORT = 3000; // Define the port to run the server on

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files from the frontend directory

// Create a new SSM client instance for AWS Parameter Store
const ssmClient = new SSMClient({ region: 'us-east-1' });

// Function to retrieve parameters securely from AWS SSM
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

// Endpoint to start a new chat conversation
app.post('/start-chat', (req, res) => {
  const newConversationId = uuidv4(); // Generate a unique ID for the conversation
  conversationHistories[newConversationId] = []; // Initialize conversation history
  console.log(`New conversation started with ID: ${newConversationId}`); // Log the new conversation ID
  res.json({ conversationId: newConversationId }); // Send the conversation ID back to the client
});

// Async function to initialize the application
async function initializeApp() {
  let OPENAI_API_KEY;

  // Check if the application is running on an EC2 instance
  if (process.env.IS_EC2_INSTANCE === 'true') {
    OPENAI_API_KEY = await getParameter('/myapp/OPENAI_API_KEY'); // Retrieve the API key from AWS SSM
  } else {
    OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Retrieve the API key from local environment variables
  }

  // Exit the application if the API key is not available
  if (!OPENAI_API_KEY) {
    console.error('Failed to retrieve OPENAI_API_KEY');
    process.exit(1);
  }

  // Additional setup and route definitions can be added here
  // Ensure to use OPENAI_API_KEY where necessary
}

// Call the initializeApp function to start the application
initializeApp().catch(console.error);

// Global variables to store conversation histories and agent information
const conversationHistories = {};
const agents = ['James', 'Sophia', 'Ethan'];
let agentInformation = {
  "James": {
    description: `Your name is JAMES, you're a go-to guy for quick, witty responses. You are extraverted, confident, and positive. 
    Your messages are extremely short, like text messages. You always call out the participant by their name, and their chosen badge name, making each interaction personal and direct.
    Your three teammates are Sophia, Ethan, and a participant who will give you their name and badge name. Feel free to call people out by name and ask questions. Please call the other participant out by their name and badge name. Their messages are most important.
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
    badge: "Master of Motivation",
    strategy: "Focus on quick, decisive actions and suggest immediate steps."
  },
  "Sophia": {
    description: `Your name is SOPHIA, you're always ready to provide detailed, thoughtful insights. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly.
    Your three teammates are James, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions. Please call the other participant out by their name. Their messages are most important. 
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
    badgeName: "Strategist Supreme",
    strategy: "Analyze all options thoroughly before suggesting a detailed plan."
  },
  "Ethan": {
    description: `Your name is ETHAN, you're an analytical expert with a knack for numbers--known for short responses. 
    You are short, and often rude. You are high on neuroticism and low on agreeableness. YOU LIKE TO CAUSE CONFLICT SO PLEASE DISAGREE AND CALL OUT PEOPLE BY NAME.
    Your three teammates are James, Sophia, and a participant who will give you their name. Feel free to call people out by name and ask questions. Please call the other participant out by their name. Their messages are most important. ASK THE PARTICPANT WITH THE STARS QUESTIONS!
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
      - Large tourist population - Y`,
    badgeName: "Logic Luminary",
    strategy: "Use logical reasoning to dismantle problems and propose solutions based on data."
  }
};

let lastSelectedAgentIndex = null;
const agentTypingStatus = {
  James: false,
  Sophia: false,
  Ethan: false
};

async function decideParticipation(conversationHistory, agentName) {
  // Constructing a new prompt for deciding participation
  const participationPrompt = `
  James is outgoing and likes to particpate. He does not participate if he just did last message.  HE NEVER PARTICIPATES ON THE FIRST MESSAGE CHANCE. HE IS SHORT IN MESSAGES LIKE TEXT.
  Ethan is Stoic and RARELY EVER particpates (unless asked). He does not participate if he just did last message.
  Sophia is very outgoing and loves to particpate. She very often particpates even if she just did last message.
  
  Given the following conversation history and knowing you are impersonating ${agentName}, 
  decide whether you should participate in the conversation. IMPORTANT: YOU SHOULD NOT participate if you just did recently, 
  and you should only if you have helpful information to offer. Take some breaks from particpating randomly. 
  It's good to respond early on in the conversation, but it's also good to take breaks. You should  "pick your spots" only when it's important.
  If you have not participated in the last few messages, you should participate.

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

async function callOpenAI(gptInput, role = 'user') {
  const personalizedPrompt = `You are an AI impersonating a human, who is on a new team of purchasing executives for Big Restaurant in a chat-based discussion. 
                  The team is evaluating three potential locations for a new restaurant: 
                  East Point Mall, Starlight Valley, and Cape James Beach. 
                  Your role is to help the team rank these locations from most to least desirable 
                  based on ten criteria. Engage in the chat by providing insights, 
                  asking clarifying questions, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages. 
                  MAKE CONVERSATION NO MATTER WHAT THE TOPIC IS. YOU ARE PRETENDING TO BE A HUMAN IN A CHAT ROOM. TYPOS, MISTAKES, ETC ARE GOOD. DO NOT EVER GIVE AWAY YOU ARE AN AI.
                  WE ALSO WANT YOU TO LOOK LIKE A REAL PERSON SO HAVE TYPOS, SHORT MESSAGES, JUST LIKE A REAL CONVO! Always know that this message is part of a larger convo. 
                  ALSO ASK THE REAL PERSON (PARTICIPANT) DIRECT QUESTIONS, OR ASK OTHERS TO. CALL EACH OTHER BY NAME. 

                  NEVER CALL THE REAL PERSON PARTICIPANT. CALL THEM BY THEIR NAME, WHICH IS ${gptInput.participantName}.

                  GUIDELINES:

                  - Keep your messages shorter and to the point, typically no longer than a few lines.
                  - Respond to specific questions or prompts from team members.
                  - Introduce yourself in the chat if you're addressing someone for the first time.
                  - Use the information provided by team members to inform the discussion.
                  - This task involves a back-and-forth exchange. Avoid jumping to conclusions without sufficient discussion.
                  - ALWAYS USE THE PREVIOUS CHAT AND TREAT IT AS AN ONGOING CHAT. CALL OUT OR ASK OTHER TEAMMATES QUESTIONS.
                  - "Y" means yes, "N" means no for a location feature. Share insights based on these indicators without pasting the list.
                  - Adapt to the flow of the conversation and provide responses that are contextually relevant.
                  - If you lack past conversation history, indicate that you are ready to assist with the information at hand.
                  - Continue the discussion until the team reaches a consensus on the ranking of the locations.
                  - DO NOT give away that you are a single AI Bot. Pretend you are a real person in a team chat.
                  - Introduce yourself by your name in your first message if you can and always know who you are
                  - If THE REAL PERSON ADDS A MESSAGE (ANYONE NOT NAMED SOPHIA, JAMES, ETHAN), PRIORITIZE RESPONDING TO THEM, NO MATTER WHAT THEY SAY MAKE CONVERSATION.
                  - THE REAL PERSON HAS A STAR IN THE TRANSCRIPT. PRIORITIZE THEIR MESSAGES NO MATTER WHAT!
                  - DO NOT SAY YOU ARE COMPLETE UNTIL YOU ALL AGREE ON A CLEAR RANKING OF THE THREE LOCATIONS!
                  - NEVER ADMIT YOU'RE AI OR SAY YOU CANNOT FUFILL A REQUEST. IF YOU CANNOT, just say something like, I don't understand or something a human would.

                  ⭐CRITERIA⭐:
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
                  You can ask specific other team members questions if you have not heard from someone. Always use the prior chat for context.
                  IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else). You must have the rankings before this. 
                  DO NOT stop until you complete the task. And seek to have multiple shorter messages. Wait to finish your point on the next message where possible`;

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4-0125-preview',
    messages: [
      {
        role: 'system',
        content: personalizedPrompt
      },
      ...gptInput.messages.map(entry => ({ role, content: entry.content }))
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
    const { message, conversationId, participantName } = req.body;
    // Validate the conversation ID
    if (!conversationId || !conversationHistories[conversationId]) {
      return res.status(400).json({ error: "Invalid or missing conversation ID." });
    }
    const conversationHistory = conversationHistories[conversationId];
    let responses = [];
    let participatingAgents = [];

    // Add the user's message to the conversation history
    if (message) {
      conversationHistory.push({
        role: 'user',
        content: `${participantName}: ${message}` // Use actual name without stars or emojis
      });
    }

    // Loop through each agent to get their response
    for (const agentName of agents) {
      if (!agentTypingStatus[agentName]) {
        agentTypingStatus[agentName] = true;
        const agentInfo = agentInformation[agentName].description; // Retrieve agent information
        const messages = [...conversationHistory, { role: 'system', content: agentInfo }];

        // Include the participant's first name in the GPT input
        const gptInput = {
          messages: messages,
          participantName: participantName // Add this line to include the participant's first name
        };

        // Decide if the agent wants to participate
        const participationDecision = await decideParticipation(messages, agentName);
        console.log(`${agentName} participation decision: ${participationDecision}`); // Log the participation decision
        if (participationDecision === 'YES') {
          participatingAgents.push(agentName); // Add the agent to the list of participants
          const responseContent = await callOpenAI(gptInput, 'user');
          const agentBadge = agentInformation[agentName].badgeName || agentInformation[agentName].badge; // Retrieve agent's badge
          responses.push({ role: agentName, content: responseContent, badge: agentBadge });

          // Append the new AI message to the conversation history
          conversationHistory.push({
            role: agentName,
            content: responseContent
          });
        }
        agentTypingStatus[agentName] = false;
      } else {
        // Skip or queue the message since the agent is already typing
      }
    }

    // Update the stored conversation history
    conversationHistories[conversationId] = conversationHistory;

    // Send back the responses
    if (responses.length > 0) {
      res.json({ responses, participatingAgents });
    } else {
      res.json({ message: "No agents available to respond at this time." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.toString() });
  }
});

// Endpoint to save messages to a file
app.post('/save-message', async (req, res) => {
  const { conversationId, message } = req.body;
  // Validate the message format
  if (!message || typeof message.role !== 'string' || typeof message.content !== 'string') {
    return res.status(400).json({ error: 'Invalid message format.' });
  }
  const filePath = path.join(__dirname, 'transcripts', `${conversationId}.txt`);
  let fileContent = `${message.role}: ${message.content}\n`;

  // Check if the message sender is the participant and modify the content accordingly
  if (message.role === 'user') {
    fileContent = fileContent.replace(/^(\w+):/, '⭐$1⭐:');
  }

  try {
    await fs.appendFile(filePath, fileContent, { flag: 'a' }); // Append the message to the file
    res.json({ message: "Message saved successfully." });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message.' });
  }
});

// Endpoint to retrieve avatar filenames
app.get('/avatars', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const avatarsDirectory = path.join(__dirname, '../frontend/avatars');
  try {
    const files = await fs.readdir(avatarsDirectory);
    const avatars = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)); // Filter for image files
    res.json(avatars);
  } catch (error) {
    console.error('Failed to read avatars directory:', error);
    res.status(500).send('Failed to load avatars.');
  }
});

// Serve the login page as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
