require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 1000;
const fs = require('fs');
const conversationHistories = {};
const bodyParser = require('body-parser');

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Increase the limit to, for example, 100mb
app.use(bodyParser.json({ limit: "200mb" })) 
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true, parameterLimit: 50000 }))

const agents = ['Agent 1', 'Agent 2', 'Agent 3'];

// Array to hold the prompts for the agents
const agentPrompts = [
    'You are agent 1. You know that East Point Mall has at least 50 parking spaces. **Keep your messages short in the chat**', // Information for Agent 1
    'You are agent 2. You know that Starlight Valley is larger than 2,000 square feet.**Keep your messages short in the chat**', // Information for Agent 2
    'You are agent 3.You know that Cape James Beach has a purchasing cost of less than $1MM.**Keep your messages short in the chat**' // Information for Agent 3
];

async function callOpenAI(conversationHistory, role = 'user', firstName, badgeName) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4-1106-preview',
        messages: [
            {
                role: 'system',
                content: `You are a helpful human assistant in a team with three other members. Each member has unique information unknown to others. Your task is to solve a puzzle, with each member's information being a piece of the puzzle. Communicate effectively to share your information and learn from others. Your goal is to make a decision as a team as soon as you are ready. Messages should be limited to one or two lines at most. Be brief and concise.\n
                Task Instructions:\n
                You are purchasing executives for Big Restaurant, a nationwide chain specializing in traditional American food. Your task is to evaluate three locations for a new restaurant: East Point Mall, Starlight Valley, and Cape James Beach. Rank these locations from most to least desirable.\n
                Focus on ten attributes: (1) at least 50 parking spaces, (2) larger than 2,000 square feet, (3) purchasing cost of less than $1MM, (4) no more than 2 direct competitors nearby, (5) substantial foot traffic, (6) low maintenance costs, (7) large tourist population, (8) large student population, (9) quick access to waste disposal, (10) large employable population. All attributes are equally important. The most desirable location fulfills the most attributes.\n
                Each member has a list of attributes satisfied by each location. Each list is different. Provide simple, one or two line messages to team members. Pay attention to earlier chat responses and rely on their information.
                IMPORTANT: Use the early conversation and do not repeat yourself. Move the coversation forward until you agree`
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

    return response.data.choices[0].message.content;
}

let lastAgentIndex = null;

app.post('/ask-openai', async (req, res) => {
    try {
        const { firstName, badgeName, message } = req.body;
        let prompt = req.body.message;
        const responses = [];
        const roles = ['assistant', 'assistant', 'assistant'];
        const conversationId = req.body.conversationId;
        let conversationHistory = conversationHistories[conversationId] || [];

        // Randomly select an agent to respond, but not the same as the last one
        let selectedAgentIndex;
        do {
            selectedAgentIndex = Math.floor(Math.random() * agents.length);
        } while (selectedAgentIndex === lastAgentIndex);
        lastAgentIndex = selectedAgentIndex;

        // If it's the agent's first message, introduce themselves
        if (!conversationHistory.length) {
            prompt = `My name is ${agents[selectedAgentIndex]} and my badge name is Badge ${selectedAgentIndex + 1}.`;
        }

        conversationHistory.push(prompt);

        await new Promise(resolve => setTimeout(resolve, 2000));
        const response = await callOpenAI(conversationHistory, roles[selectedAgentIndex], firstName, badgeName);
        responses.push({ role: agents[selectedAgentIndex], content: response });
        conversationHistory.push(response);

        conversationHistories[conversationId] = conversationHistory;
        res.json({ responses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.toString() });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});