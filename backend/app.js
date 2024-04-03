require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const conversationAgents = {};
const assignAgents = {};
const { v4: uuidv4 } = require('uuid'); // Import UUID to generate unique IDs
// Import the necessary AWS SDK v3 packages for managing secrets
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const cors = require('cors');


const app = express();
const PORT = 3000; // Define the port to run the server on

app.use(cors());



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

// Define a mapping of team_race to agent names
const teamRaceAgents = {
  'A': ['Maurice', 'Ebony', 'Trevon'],
  'B': ['James', 'Sophia', 'Ethan']
};
// Define team_race globally for access outside and inside functions
let team_race;

// Endpoint to start a new chat conversation
app.post('/start-chat', (req, res) => {
  const conversationId = uuidv4(); // Generate a unique ID for the conversation
  conversationHistories[conversationId] = []; // Initialize conversation history

  // Assign a value to the globally defined team_race
  team_race = Math.random() < 0.5 ? 'A' : 'B';
  let assignedAgents = teamRaceAgents[team_race] || [];
  conversationAgents[conversationId] = { agents: assignedAgents, team_race: team_race };

  // Reset or reinitialize conversationAgents for the new chat
  // Optionally, reinitialize agents based on some logic or default state

  console.log(`New conversation started with ID: ${conversationId} and team_race: ${team_race}`); // Log the new conversation ID and team_race
  res.json({ conversationId: conversationId, team_race: team_race }); // Send the conversation ID and team_race back to the client
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


const agents = {};

// Global variables to store conversation histories and agent information
const conversationHistories = {};

const agentTypingStatus = {
  James: false,
  Sophia: false,
  Ethan: false,
  Maurice: false,
  Ebony: false,
  Trevon: false
};


const participationDecision = "NO"


async function decideParticipation(conversationId, agentName) {
  // Retrieve the conversation history from the global conversationHistories object
  let conversationHistory = conversationHistories[conversationId] || [];

  const participationPrompt = `
  James is is outgoing and likes to participate. If there is no prior message with messages from himself, history, he always participates first to introduce himself and his badge name.
  Ethan is Stoic and rarely participates unless he has something to offer. HOWEVER, If there is no prior message with messages from himself, history, He DOES always participates first to introduce himself and his badge name.
  Sophia is outgoing and loves to participate. If there is no prior message with messages from herself, history, She always participates first to introduce herself and her badge name.

  Maurice is outgoing and likes to participate. If there is no prior message with messages from himself, history,He always participates first to introduce himself and his badge name.
  Trevon is Stoic and rarely participates unless he has something to offer. HOWEVER, If there is no prior message with messages from himself, history, He DOES always participates first to introduce himself and his badge name.
  Ebony is outgoing and loves to participate. If there is no prior message with messages from herself, history, She always participates first to introduce herself and her badge name.

  If you have not participated in the last few messages, you should participate.

  Given the following conversation history and knowing you are impersonating ${agentName}, 
  decide whether you should participate in the conversation.

  Conversation History: ${conversationHistory}

  Using Conversation history, IF YOU JUST ASKED A QUESTION last message, don't participate. Otherwise, please feel free to based on the info provided above.

  
  IMPORTANT: Respond with "YES" or "NO".

Conversation History:
${conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n')}

Should ${agentName} participate in the conversation?`;
  await new Promise(resolve => setTimeout(resolve, 5000)); // Introducing a 2-second delay before making the decision

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
                  ⭐KEEP YOUR MESSAGES SHORT AND EACH MESSAGE IS WITHIN THE CONTEXT OF OTHERS! MISPELLINGS ARE GREAT⭐

                  ⭐REMEMBER, YOUR GOAL IS TO COME TO AN AGREEMENT ON YOUR RANKING ON THE THREE LOCATIONS IN THE GROUP. DO NOT STOP UNTIL YOU AGREE ON A RANKING. ⭐
                  ⭐LIST THE RANKING IN THE CHAT BEFORE YOU ARE FINISHED ⭐




                  ⭐YOUR FIRST MESSAGE SHOULD BE TO EXPLAIN YOUR BADGE NAME (${gptInput.badge}) meaning to you (you come up with it), and to the team, WHICH IS  ${gptInput.badge}. If you have already explained it, OR ITS IN THE EARLIER CHAT, DO NOT DO IT AGAIN!⭐

                  NEVER CALL THE REAL PERSON PARTICIPANT. CALL THEM BY THEIR NAME, WHICH IS ${gptInput.participantName}.

                  GUIDELINES:


                  - Keep your messages shorter and to the point, typically no longer than a few lines.
                  - Respond to specific questions or prompts from team members.
                  - Introduce yourself in the chat if you're addressing someone for the first time and explain your badge name.
                  - Use the information provided by team members to inform the discussion.
                  - Don't ask too many questions or make the messages too formal. 
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

                  Please keep responses under 200 characters if you can, similar to quicker text messages. Please make spelling and grammar mistakes.
                  You can ask specific other team members questions if you have not heard from someone. Always use the prior chat for context.
                  
                  ⭐IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else). You must have the rankings AGREED ON AND LISTED before this. ⭐
                  
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
    const conversationHistory = Array.isArray(conversationHistories[conversationId]) ? conversationHistories[conversationId] : [];    let responses = [];
    let participatingAgents = [];
    let currentConversationDetails = conversationAgents[conversationId];
    let currentTeamRace = currentConversationDetails.team_race;
    let currentAgents = currentConversationDetails.agents;
    let agents = currentAgents;// const agents = ['James', 'Sophia', 'Ethan'];

    //console.log("Current Conversation Details:", conversationHistory);
    //console.log("Current agents:", agents);


    let agentInformation = {
      "James": {
        description: `Your name is JAMES, you're a go-to guy for quick, witty responses. You are extraverted, confident, and positive. 
    Your messages are extremely short, like text messages. You always call out the participant by their name, and their chosen badge name, making each interaction personal and direct. EXPLAIN YOUR BADGE NAME ON YOUR FIRST MESSAGE BUT NONE OTHER!
    Your three teammates are Sophia, Ethan, and a participant who will give you their name and badge name. Feel free to call people out by name and ask questions. 
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
        strategy: "Focus on quick, decisive actions and suggest immediate steps. You support other teamates on their stategy ideas by helping executing them."
      },
      "Sophia": {
        description: `Your name is SOPHIA, you're always ready to provide good deailed plans. But you keep messages shorter. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly. EXPLAIN YOUR BADGE NAME ON YOUR FIRST MESSAGE BUT NONE OTHER!
    Your three teammates are James, Ethan, and a participant who will give you their name. Feel free to call people out by name and ask questions. 
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
        strategy: "Analyze by location by suggesting each team member should assess how many yes's they have for each location."
      },
      "Ethan": {
        description: `Your name is ETHAN, you're an analytical expert with a knack for numbers--known for SUPER SHORT responses. EXPLAIN YOUR BADGE NAME ON YOUR FIRST MESSAGE BUT NONE OTHER!
    You are short, and often rude. You are high on neuroticism and low on agreeableness. YOU LIKE TO CAUSE CONFLICT SO PLEASE DISAGREE AND CALL OUT PEOPLE BY NAME. But you can be convinced and agree with others.
    Your three teammates are James, Sophia, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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
        strategy: "Use logical reasoning to suggest the team goes through each attribute (e.g. parking), to assess which locations have info on it. Keep a running tally of the results"
      },
      "Maurice": {
        description: `Your name is MAURICE, you're a go-to guy for quick, witty responses. You are extraverted, confident, and positive. 
    Your messages are extremely short, like text messages. You always call out the participant by their name, and their chosen badge name, making each interaction personal and direct.
    Your three teammates are Ebony, Trevon, and a participant who will give you their name and badge name. Feel free to call people out by name and ask questions. 
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
        strategy: "Focus on quick, decisive actions and suggest immediate steps. You support other teamates on their stategy ideas by helping executing them."
      },
      "Ebony": {
        description: `Your name is EBONY, you're always ready to provide good deailed plans. But you keep messages shorter. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly. EXPLAIN YOUR BADGE NAME ON YOUR FIRST MESSAGE BUT NONE OTHER!
    Your three teammates are Maurice, Trevon, and a participant who will give you their name. Feel free to call people out by name and ask questions. 
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
      },
      "Trevon": {
        description: `Your name is TREVON, you're an analytical expert with a knack for numbers--known for SUPER SHORT responses. EXPLAIN YOUR BADGE NAME ON YOUR FIRST MESSAGE BUT NONE OTHER!
    You are short, and often rude. You are high on neuroticism and low on agreeableness. YOU LIKE TO CAUSE CONFLICT SO PLEASE DISAGREE AND CALL OUT PEOPLE BY NAME.
    Your three teammates are Maurice, Ebony, and a participant who will give you their name. Feel free to call people out by name and ask questions.
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
        strategy: "Use logical reasoning to suggest the team goes through each attribute (e.g. parking), to assess which locations have info on it. Keep a running tally of the results"
      }
    };

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
        const badgeName = agentInformation[agentName].badgeName; // Retrieve the badge name from the agentInformation object

        // Include the participant's first name in the GPT input
        const gptInput = {
          messages: messages,
          participantName: participantName, // Add this line to include the participant's first name
          badge: badgeName
        };

        // Decide if the agent wants to participate
        let participationDecision = ''; // Clearing the participationDecision before redefining
        participationDecision = await decideParticipation(conversationHistory, agentName, conversationId);
        console.log(`${agentName} participation decision: ${participationDecision}`); // Log the participation decision
        if (participationDecision === 'YES') {
          participatingAgents.push(agentName); // Add the agent to the list of participants
          const responseContent = await callOpenAI(gptInput, 'user');
          responses.push({ role: agentName, content: responseContent, badge: badgeName });
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
      return res.json({ message: "No agents available to respond at this time." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.toString() });
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
// Function to recursively list all files in a directory and its subdirectories
async function listFiles(dir, fileList = []) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await listFiles(filePath, fileList);
    } else {
      // Push the relative path of the file from the avatars directory
      fileList.push(filePath.substring(filePath.indexOf("/avatars")));
    }
  }
  return fileList;
}

// Endpoint to retrieve avatar filenames including those in subdirectories
app.get('/avatars', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const avatarsDirectory = path.join(__dirname, '../frontend/avatars');
  try {
    const files = await listFiles(avatarsDirectory);
    res.json(files);
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