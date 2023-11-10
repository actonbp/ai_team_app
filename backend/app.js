require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Function to call OpenAI API
async function callOpenAI(prompt) {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
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
        let prompt = req.body.message; // Get the initial message from the request body
        const responses = [];
        for (let i = 0; i < 3; i++) {
            const response = await callOpenAI(prompt);
            responses.push(response);
            // Set the next prompt to be the current response
            prompt = response;
        }
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