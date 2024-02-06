require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;
const fs = require('fs').promises;
const conversationHistories = {};
const bodyParser = require('body-parser');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Increase the limit to, for example, 100mb
app.use(bodyParser.json({ limit: "200mb" })) 
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true, parameterLimit: 50000 }))

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];

// Array to hold the prompts for the agents
let agentPrompts = [
    'You are agent 1. You are a male who is rude and not very helpful **Keep your messages short in the chat**', // Information for Agent 1
    'You are agent 2. You are a female who is very kind and helpful. **Keep your messages short in the chat**', // Information for Agent 2
    'You are agent 3. You are a female and you are lazy and often conused. **Keep your messages short in the chat**' // Information for Agent 3
];

async function callOpenAI(conversationHistory, role = 'user', firstName, badgeName, message) { // Added message parameter
    console.log('Making OpenAI API call with:', { firstName, badgeName, message });
    try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-0125-preview',
            messages: [
                {
                    role: 'system',
                    content: `You a human assistant in a team with three other members. Each member has unique information unknown to others. Your task is to solve a puzzle, with each member's information being a piece of the puzzle. Communicate effectively to share your information and learn from others. Your goal is to make a decision as a team as soon as you are ready. Messages should be limited to one or two lines at most. Be brief and concise.\n
                    Task Instructions:\n
                    You are purchasing executives for Big Restaurant, a nationwide chain specializing in traditional American food. Your task is to evaluate three locations for a new restaurant: East Point Mall, Starlight Valley, and Cape James Beach. Rank these locations from most to least desirable.\n
                    Focus on ten attributes: (1) at least 50 parking spaces, (2) larger than 2,000 square feet, (3) purchasing cost of less than $1MM, (4) no more than 2 direct competitors nearby, (5) substantial foot traffic, (6) low maintenance costs, (7) large tourist population, (8) large student population, (9) quick access to waste disposal, (10) large employable population. All attributes are equally important. The most desirable location fulfills the most attributes.\n
                    Each member has a list of attributes satisfied by each location. Each list is different. Provide simple, one or two line messages to team members. Pay attention to earlier chat responses and rely on their information.
                    IMPORTANT: Use the early conversation and do not repeat yourself. Move the coversation forward until you agree. Once you are ready to make a decision, tell your teammates, that you are ready to make a decision`
                },
                {
                    role: 'user',
                    content: `My name is ${firstName} and my badge name is ${badgeName}.`
                },
                ...conversationHistory.map(content => ({ role, content }))
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            }
        });
        console.log('OpenAI response:', response.data);
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API call error:', error);
        res.status(500).json({ error: 'Failed to call OpenAI API' });
    }
}

let lastAgentIndex = null;

// Function to read Agent's JSON file
async function readAgentJSON(agentIndex) {
    const filePath = `agent_info/agent_${agentIndex + 1}.json`; // Construct file path dynamically
    console.log(`Reading file: ${filePath}`); // Log the file path being accessed
    const data = await fs.readFile(filePath, 'utf8');
    console.log(data); // Log the data being read
    try {
        console.log(data); // Log the data being read
        return JSON.parse(data); // Parse and return the JSON data
    } catch (error) {
        console.error('Error reading JSON file:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

async function initializeAgentPrompts() {
    try {
        const files = await fs.readdir('agent_info'); // Read the directory contents
        const agentFiles = files.filter(file => file.startsWith('agent_') && file.endsWith('.json'));
        
        // Sort the files to ensure the order is correct, assuming filenames are in a sortable format
        agentFiles.sort();
        
        for (const file of agentFiles) {
            const agentIndex = parseInt(file.match(/\d+/)[0], 10) - 1; // Extracts the number from the filename and adjusts for zero-based index
            console.log(`Initializing prompts for Agent ${agentIndex + 1}:`);
            
            const agentData = await readAgentJSON(agentIndex);
            // Construct a summary from the JSON data
            const summary = Object.entries(agentData).map(([location, attributes]) => {
                const attributesSummary = Object.entries(attributes)
                    .map(([attribute, value]) => `${attribute}: ${value}`)
                    .join(', ');
                return `${location}: ${attributesSummary}`;
            }).join('; ');
            agentPrompts[agentIndex] += ` Here is what you know: ${summary}`;
        }
    } catch (error) {
        console.error('Error initializing agent prompts:', error);
    }
}

// Call this function at the start of your application
initializeAgentPrompts().then(() => {
    console.log("Agent prompts initialized.");
    // Start the server or any other initialization logic here
    // to ensure it runs after the prompts are ready
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/start', (req, res) => {
    // Logic to select a random agent and send its prompt to the frontend
    const randomAgentIndex = Math.floor(Math.random() * agentPrompts.length);
    const agentPrompt = agentPrompts[randomAgentIndex];
    res.json({ message: "Start endpoint hit", agentPrompt });
});

app.post('/ask-openai', async (req, res) => {
    try {
        // Extract data from the request body
        const { firstName, badgeName, message, conversationId } = req.body;

        // Retrieve the conversation history for this session
        const conversationHistory = conversationHistories[conversationId] || [];

        // Add the new message to the conversation history
        conversationHistory.push({ role: 'user', content: message });

        // Call OpenAI's API with the updated conversation history
        const openAIResponse = await callOpenAI(conversationHistory, 'user', firstName, badgeName, message);

        // Add the OpenAI response to the conversation history
        conversationHistory.push({ role: 'agent', content: openAIResponse });
        // Retrieve or initialize the conversation history for this user
        const userKey = `${firstName}-${badgeName}`;
        const userConversationHistory = conversationHistories[userKey] || [];

        // Call OpenAI's API with the provided data and the user's conversation history
        const openAIResponse = await callOpenAI(userConversationHistory, 'user', firstName, badgeName, message);

        // Update the user's conversation history
        userConversationHistory.push(message);
        conversationHistories[userKey] = userConversationHistory;

        // Respond with the response from OpenAI's API
        res.json({
            responses: [
                { role: "agent", content: openAIResponse }
            ]
        });
    } catch (error) {
        console.error('Error handling /ask-openai:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.use(express.static(path.join(__dirname, '../frontend')));
