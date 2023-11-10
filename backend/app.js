require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const conversationHistories = {};


// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Array to hold the names of the agents
const agents = ['Agent 1', 'Agent 2', 'Agent 3'];

// Shuffle the agents array
for (let i = agents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [agents[i], agents[j]] = [agents[j], agents[i]];
}

// Function to call OpenAI API
async function callOpenAI(messages, role = 'user') {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            {
                role: 'system',
                content: [`You are a helpful assistant on a team with three other members. 
                           Your team's task is to name every letter in the alphabet, 
                           but each member can only name one letter at a time. 
                           It's important to remember the letters that have already been named 
                           so that you do not repeat them. 
                           Please pay close attention to the earlier responses in the chat.
                           If you do not see any earlier responses, say "I don't see earlier responses. I must be first!"`
                ].join(' ')
            },
            ...messages.map(content => ({ role, content }))
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
    });

    return response.data.choices[0].message.content;
}

// Generate the initial responses from the agents
async function generateInitialResponses() {
    let initialResponses = [];
    // Select a random agent to start the conversation
    const startingAgentIndex = Math.floor(Math.random() * agents.length);
    const response = await callOpenAI(['Initial post'], 'assistant');
    initialResponses.push({ role: agents[startingAgentIndex], content: response });
    return initialResponses;
}

app.get('/start', async (req, res) => {
    // Generate the initial responses from the agents
    const responses = await generateInitialResponses();
    res.json({ responses });
});

// In-memory store for conversation histories
app.post('/ask-openai', async (req, res) => {
    try {
        let prompt = req.body.message; // Get the initial message from the request body
        const responses = [];
        const roles = ['assistant', 'assistant', 'assistant'];

        // Get the conversation ID from the request
        const conversationId = req.body.conversationId;

        // Get the conversation history for this conversation ID
        let conversationHistory = conversationHistories[conversationId] || [];

        // Add the user's message to the conversation history
        conversationHistory.push(prompt);

        // Shuffle the agents array
        for (let i = agents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [agents[i], agents[j]] = [agents[j], agents[i]];
        }

        for (let i = 0; i < roles.length; i++) {
            // Simulate a typing delay
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay

            const response = await callOpenAI(conversationHistory, roles[i]);
            responses.push({ role: agents[i], content: response });

            // Add the current response to the conversation history
            conversationHistory.push(response);
        }

        // Store the updated conversation history
        conversationHistories[conversationId] = conversationHistory;

        res.json({ responses }); // Send the responses back to the client
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.toString() });
    }
});

// Other routes...

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});