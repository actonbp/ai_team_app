const fs = require('fs').promises;

async function readAgentJSON(agentIndex) {
    const filePath = `agent_info/agent_${agentIndex + 1}.json`; // Construct file path dynamically
    console.log(`Reading file: ${filePath}`); // Log the file path being accessed
    try {
        const data = await fs.readFile(filePath, 'utf8');
        console.log(data); // Log the data being read
        return JSON.parse(data); // Parse and return the JSON data
    } catch (error) {
        console.error('Error reading JSON file:', error);
        throw error; // Rethrow the error to be handled by the caller
    }
}

// Loop through all agent indices (assuming 3 agents)
async function readAllAgents() {
    try {
        const files = await fs.readdir('agent_info');
        const agentFiles = files.filter(file => file.startsWith('agent_') && file.endsWith('.json'));
        for (const file of agentFiles) {
            const agentIndex = file.match(/\d+/)[0]; // Extracts the number from the filename
            console.log(`Agent ${agentIndex}:`);
            console.log(`Attempting to read agent at index: ${agentIndex}`);
            await readAgentJSON(agentIndex - 1).then(data => console.log('Parsed JSON:', data)).catch(err => console.error(err));
        }
    } catch (error) {
        console.error('Error reading agent files:', error);
    }
}

readAllAgents();
