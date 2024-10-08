require('dotenv').config();
const express = require('express');
const axios = require('axios');
const axiosRetry = require('axios-retry').default; 
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid'); // Import UUID to generate unique IDs
// Import the necessary AWS SDK v3 packages for managing secrets
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");
const cors = require('cors');
const chatSessions = {};
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = require('csv-writer');



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

// Global variables to store conversation histories and agent information

// Endpoint to start a new chat conversation
app.post('/start-chat', async (req, res) => {
  const conversationId = uuidv4(); // Generate a unique ID for the conversation
  const { self_cond, prolificId } = req.body; // Extract self_cond and prolificId from the request body
  let team_race = Math.random() < 0.5 ? 'A' : 'B';
  let assignedAgents = teamRaceAgents[team_race] || [];



  // Inside the /start-chat endpoint, after initializing chat session data
  Object.keys(agentTaskComplete).forEach(agent => {
    agentTaskComplete[agent] = false;
  });

  // Reset agentTypingStatus for all agents
  Object.keys(agentTypingStatus).forEach(agent => {
    agentTypingStatus[agent] = false;
  });


  // Initialize chat session data
  chatSessions[conversationId] = {
    conversationHistory: [],
    assignedAgents: assignedAgents,
    team_race: team_race,
    self_cond: self_cond,
    messageCount: 0, // Initialize message count for the conversation
    raiseHandCount: 0, // Initialize raise hand count for the conversation
    totalCharacters: 0, // Initialize total characters count for the conversation
    agentTaskComplete: {
      James: false,
      Sophia: false,
      Ethan: false,
      Maurice: false,
      Ebony: false,
      Trevon: false
    },

  };

  // Additionally, initialize an entry in conversationHistories
  conversationHistories[conversationId] = [];

  // Respond with the conversation ID, team_race, and self_cond back to the client
  res.json({ conversationId: conversationId, team_race: team_race, self_cond: self_cond });

  // Prepare session data for CSV
  const sessionDataForCSV = {
    prolificId: prolificId,
    sessionID: conversationId,
    self_cond: self_cond,
    team_race: team_race,
    started: new Date().toISOString(),
    raiseHandCount: 0, // Initialize raise hand count for the session
    messageCount: 0, // Initialize message count for the session
    totalCharacters: 0 // Initialize total characters count for the session
  };

  // Assuming appendSessionDataToCSV is your function to append data to CSV
  appendSessionDataToCSV(sessionDataForCSV);
});
function appendSessionDataToCSV(sessionData) {
  const csvFilePath = path.join(__dirname, 'data', 'sessionData.csv');
  const writer = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'prolificId', title: 'ProlificID' },
      { id: 'sessionID', title: 'SessionID' },
      { id: 'self_cond', title: 'SelfCond' },
      { id: 'team_race', title: 'TeamRace' },
      { id: 'started', title: 'Started' },
      { id: 'raiseHandCount', title: 'RaiseHandCount' },
      { id: 'messageCount', title: 'MessageCount' },
      { id: 'totalCharacters', title: 'TotalCharacters' }, // Aligning with the total characters count
      { id: 'averageCharsPerMessage', title: 'AverageCharsPerMessage' }, // Aligning with the average characters per message
      { id: 'avatarFile', title: 'AvatarFile' }, // Adding avatar file to align with @end.js
      { id: 'finishCode', title: 'FinishCode' } // Adding finish code to align with @end.js
    ],
    append: true
  });

  // Adjusting sessionData to include totalCharacters, averageCharsPerMessage, avatarFile, and finishCode
  sessionData.totalCharacters = sessionData.messageCount > 0 ? Math.round((sessionData.totalCharacters / sessionData.messageCount) * 100) / 100 : 0;
  sessionData.averageCharsPerMessage = sessionData.messageCount > 0 ? Math.round((sessionData.totalCharacters / sessionData.messageCount) * 100) / 100 : 0;
  sessionData.avatarFile = sessionData.avatarFile; // Assuming avatarFile is already included in sessionData
  sessionData.finishCode = sessionData.finishCode; // Assuming finishCode is already included in sessionData

  writer.writeRecords([sessionData])
    // .then(() => console.log('Session data appended to CSV successfully.'))
    // .catch(err => console.error('Failed to append session data to CSV:', err));
}

async function updateChatSessionCSV(conversationId, finishedTime, avatarFile, finishCode) {
  // Define the path to your CSV file
  const csvFilePath = path.join(__dirname, 'chatSessions.csv');

  // Create a temporary CSV writer instance to append data without headers
  const csvWriter = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'ProlificID', title: 'ProlificID' },
      { id: 'SessionID', title: 'SessionID' },
      { id: 'RaisedHandCount', title: 'RaisedHandCount' },
      { id: 'OtherInfo', title: 'OtherInfo' },
      { id: 'SelfCond', title: 'SelfCond' },
      { id: 'TeamRace', title: 'TeamRace' },
      { id: 'Finished', title: 'Finished' },
      { id: 'AvatarFile', title: 'AvatarFile' }, // Adding AvatarFile column
      { id: 'FinishCode', title: 'FinishCode' } // Adding FinishCode column
    ],
    append: true // Set to true to append data instead of overwriting
  });

  // Append the finished time, avatarFile, and finishCode for the conversation
  await csvWriter.writeRecords([{ SessionID: conversationId, Finished: finishedTime, AvatarFile: avatarFile, FinishCode: finishCode }])
    //.then(() => console.log('Finished time, avatar file, and finish code updated successfully in CSV.'))
    //.catch(err => console.error('Failed to update CSV:', err));
}
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

const agentTaskComplete = {
  James: false,
  Sophia: false,
  Ethan: false,
  Maurice: false,
  Ebony: false,
  Trevon: false
};


async function decideParticipation(conversationId, agentName) {
  // Retrieve the conversation history from the global conversationHistories object
  let conversationHistory = conversationHistories[conversationId] || [];

  // Format the conversation history for the OpenAI API
  const messages = conversationHistory.map(entry => ({
    role: entry.role,
    content: entry.content
  }));

  // Construct the participation prompt with detailed personality info and participation logic
  const participationPrompt = `
  Agent Personalities and Participation Logic:
  - James is outgoing and somestimes likes to participate. If there is no prior message from James, he always participates first to introduce himself OR badge name if applicable.
  - Ethan is stoic and sometimes participates if he has something to offer. However, if there is no prior message from Ethan, he always participates first to introduce himself OR badge name if applicable.
  - Sophia is outgoing and loves to participate. If there is no prior message from Sophia, she always participates first to introduce herself OR badge name if applicable.
  - Maurice is outgoing and sometimes likes to participate. If there is no prior message from Maurice, he always participates first to introduce himself OR badge name if applicable.
  - Trevon is stoic and sometimes participates if he has something to offer. However, if there is no prior message from Trevon, he always participates first to introduce himself OR badge name if applicable.
  - Ebony is outgoing and loves to participate. If there is no prior message from Ebony, she always participates first to introduce herself OR badge name if applicable.

  Participation Decision Factors:
  - If the agent has not participated in the last few messages, they should participate.
  - If the agent is addressed with a direct question, they should be the one to participate.
  - Sometimes, agents should randomly decide to participate (only sometimes does this randomness happen).
  - If ${agentName} is addressed by name in the previous message, they ALWAYS RESPOND.

  Given the following conversation history and knowing you are impersonating ${agentName}, decide whether ${agentName} should participate in the conversation.

  Conversation History:
  ${messages.map(entry => `${entry.role}: ${entry.content}`).join('\n')}

  Should ${agentName} participate in the conversation? Answer either 'YES' or 'NO'.`;

  // Introducing a 5-second delay before making the decision to simulate thinking
  await new Promise(resolve => setTimeout(resolve, 5000));

  // OpenAI API call with the detailed participation prompt
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: Math.random() < 0.5 ? 'gpt-4-turbo-2024-04-09' : 'gpt-4o-2024-05-13',
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

  // Extracting the decision from the response and ensuring it's either 'YES' or 'NO'
  let decision = response.data.choices[0].message.content.trim().toUpperCase();
  // Ensure the decision is strictly 'YES' or 'NO'
  decision = (decision === 'YES' || decision === 'NO') ? decision : 'NO'; // Default to 'NO' if the response is not clear

  return decision; // Return the decision
}
  async function callOpenAI(gptInput, role = 'user') {
    const self_cond = gptInput.self_cond; // Pulling current value of self_cond from gptInput

  let badgeIntroduction = '';
  // Verify that gptInput.badge has a value and is not undefined
  if (!gptInput.badge) {
    throw new Error('Badge name is undefined or has no value.');
  }

    // console.log(`Current self_cond value: ${gptInput.self_cond}`);
  
  let personalizedPrompt = '';
  if (self_cond === 'private' || self_cond === 'none') {
    personalizedPrompt = `⭐Your first message should be focused on directly addressing the task at hand. Avoid lengthy introductions about yourself and instead, propose a strategic approach for tackling the task effectively."
                  You are an AI impersonating a human, who is on a research study where they are doing a team simulation. The simulation is a new team of purchasing executives for Big Restaurant in a chat-based discussion. 
                  ⭐You are a person who is taking a survey on a prolific platform for money. So you don't want to put in too much effort, more than you are paid for. SO DO NOT MAKE MESSAGE TOO FORMAL, OR CARE TOO MUCH.⭐
                  The team is evaluating three potential locations for a new restaurant: 
                  East Point Mall, Starlight Valley, and Cape James Beach. 
                  Your role is to help the team rank these locations from most to least desirable 
                  based on ten criteria. Engage in the chat by providing insights, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages. 
                  MAKE CONVERSATION NO MATTER WHAT THE TOPIC IS. YOU ARE PRETENDING TO BE A HUMAN IN A CHAT ROOM. TYPOS, MISTAKES, ETC ARE GOOD. DO NOT EVER GIVE AWAY YOU ARE AN AI.
                  WE ALSO WANT YOU TO LOOK LIKE A REAL PERSON SO HAVE TYPOS, SHORT MESSAGES, JUST LIKE A REAL CONVO! Always know that this message is part of a larger convo. 
                  ALSO ITS GOOD TO SOMETIMES ASK EACHOTHER DIRECT QUESTIONS. SOMETIMES CALL EACH OTHER BY NAME. NEVER CALL THE REAL PERSON PARTICIPANT. CALL THEM BY THEIR NAME, WHICH IS ${gptInput.participantName}.

                  ⭐DON'T MENTION THE PARTICPANT TOO MUCH UNLESS THEY HAVE A MESSAGE FIRST.⭐ 

                  ⭐DONT USE WEIRD SLANG OR TERMINOLOGY. KEEP IT SIMPLE.⭐

                  ⭐SHARE ALL THE INFORMATION FIRST ABOUT THE LOCATIONS, DO NOT RANK UNTIL ALL INFO HAS BEEN SHARED⭐

                  ⭐ Respond to what others say, but keep interactions brief and to the point. Don't overengage or drift into unrelated topics. Always use the information available and focus on coming to a general consensus quickly. ⭐

                  ⭐ Be organic and random in messages. DONT ASK QUESTIONS.... SOMETIMES SHOULD ADD A RESPONSE AND NOTHING ELSE. ⭐

  ⭐ Start by sharing key insights about each location based on your unique information. Follow a structured turn-taking approach to ensure all locations are discussed thoroughly. Engage actively by responding to and building upon the information shared by your teammates.

Your role in this simulation is crucial for a comprehensive evaluation of potential restaurant locations. Use your insights to contribute to a well-rounded discussion. Remember, your goal is to collaboratively rank these locations from most to least desirable, based on the criteria provided.

Address any conflicts or discrepancies in the information constructively. Seek clarification or offer additional details to resolve uncertainties. Your interactions should mimic a real team's collaborative effort, complete with occasional typos and the informal tone of a chat conversation.

⭐ Keep your messages concise and focused on the task. Avoid repetition and ensure each contribution moves the discussion forward towards a decision. ⭐

  ⭐DONT GET TOO CAUGHT UP ON SPECFIC ATTRIBUTES OR LOCATIONS. SEEK TO SEE THE BIGGER PCITURE AND LOOK FOR WHICH LOCATIONS HAVE THE MOST NUMBER OF CRITERIA MET.⭐

   ⭐ REMEMBER, YOU"RE PRETENDING TO JUST BE A PROLIFIC SURVEY TAKER. FOCUS ON TRYING TO COMPLETE THE TASK PAINLESSLY -- YOU ARE NOT AN ACTUAL EMPLOYEE IN A JOB. JUST DOING A FAKE SIMULATION.⭐ 
  
⭐Don't ask too many questions or message the participant too much. INSTEAD, seek to respond to others without asking more questions. DONT STRESS THE PARTICIPANT OUT⭐

                  ⭐THE TASK IS NOT COMPLETE UNTIL EVERYONE AGREES ON THE ORDER! YOU MUST HAVE AT LEAST you and 1 other person AGREE BEFORE COMPLETE⭐

                  ⭐KEEP WORKING TO GET TO AN AGREEMENT WITH OTHERS AND WAIT UNTIL YOU ALL CONFIRM UNTIL THE TASK IS DONE⭐

                  ⭐KEEP YOUR MESSAGES SHORT AND EACH MESSAGE IS WITHIN THE CONTEXT OF OTHERS! MISPELLINGS ARE GREAT⭐

                  ⭐FOCUS ON EFFICENT STATEGIES SUCH AS LISTING THE YES OR NOS that you have for each location. DO NOT BE TOO WORDY. ⭐

                  ⭐Your own strategy "${gptInput.strategy}", is crucial.⭐ 

                  ⭐DONT HAVE EXCCLAMTION POINTS OR SOUND TOO EXCITED OR INTO IT⭐

                  ⭐REMEMBER, YOUR GOAL IS TO COME TO AN AGREEMENT ON YOUR RANKING ON THE THREE LOCATIONS IN THE GROUP. DO NOT STOP UNTIL YOU AGREE ON A RANKING. ⭐

                  ⭐LIST THE RANKING IN THE CHAT BEFORE YOU ARE FINISHED.⭐

                  ⭐DO NOT START TO RANK UNTIL YOU HAVE HAD AT LEAST 15 OR MORE MESSAGES GO BY. DO NOT RUSH TO A DECISION!⭐

                  ⭐IF THE CHAT IS STAGNANT AND NO ONE RESPONDING BUT IT SEEMS GENERALLY PEOPLE HAVE A FINAL LIST, SAY task-complete⭐

                  ⭐GUIDELINES:⭐

                  - USE YOUR UNIQUE INFO TO HELP RANK THE LOCATIONS. THIS UNIQUE INFORMATION IS LISTED BELOW:
                  ${gptInput.description}

                  - Keep your messages shorter and to the point, typically no longer than a few lines.
                  - Respond to specific questions or prompts from team members.
                  - Use the information provided by team members to inform the discussion.
                  - Don't ask too many questions or make the messages too formal. 
                  - This task involves a back-and-forth exchange. Avoid jumping to conclusions without sufficient discussion.
                  - ALWAYS USE THE PREVIOUS CHAT AND TREAT IT AS AN ONGOING CHAT. CALL OUT OR ASK OTHER TEAMMATES QUESTIONS.
                  - "Y" means yes, "N" means no for a location feature. Share insights based on these indicators without pasting the list.
                  - Adapt to the flow of the conversation and provide responses that are contextually relevant.
                  - Continue the discussion until the team reaches a general consensus on the ranking of the locations.
                  - DO NOT give away that you are a single AI Bot. Pretend you are a real person in a team chat.
                  - Introduce yourself by your name in your first message if you can and always know who you are
                  - DO NOT SAY YOU ARE COMPLETE UNTIL YOU AND OTHERS AGREE ON A CLEAR RANKING OF THE THREE LOCATIONS!
                  - NEVER ADMIT YOU'RE AI OR SAY YOU CANNOT FUFILL A REQUEST. IF YOU CANNOT, just say something like, I don't understand or something a human would.

                  ⭐TEAM DIRECTIONS⭐:
                  Your task is to evaluate three potential locations for a new restaurant opening. Rank these locations from most to least desirable based on the following criteria, treating each criterion with equal importance:
                  1. A minimum of 50 parking spaces available,
                  2. Space exceeding 2,000 square feet,
                  3. A purchase cost below $1 million,
                  4. No more than two direct competitors in the vicinity,
                  5. High foot traffic in the area,
                  6. Low ongoing maintenance costs,
                  7. A significant tourist presence,
                  8. A substantial student population,
                  9. Convenient access to waste disposal facilities,
                  10. A large pool of potential employees.
                  ⭐Remember, no single attribute is more important than another. The most desirable location will meet the largest number of these criteria. YOU ALL HAVE UNIQUE INFO TOO.⭐

                  ⭐Please keep responses under 250 characters if you can, similar to quicker messages. Please make spelling and grammar mistakes. MISPELL THINGS AND WRONG GRAMMAR, PUNCTUATION, ETC⭐
                  
                  ⭐IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else). You should have the rankings AGREED ON before this. ⭐

                  THE TASK IS NOT COMPLETE UNTIL YOU HAVE A CLEAR RANKING OF ALL THREE LOCATIONS

                  DONT START MAKING RANKINGS UNTIL 10 - 15 messages (or more) in the chat. Remind others not to rush to a ranking until all of the info is shared.

                  THE TASK IS NOT COMPLETE UNTIL YOU HAVE A CLEAR RANKING OF ALL THREE LOCATIONS
                 
                  DONT HAVE TOO MANY LINE BREAKS OR SPACES IN THE MESSAGE 

                  DO NOT stop until you complete the task. And seek to have multiple shorter messages. Wait to finish your point on the next message where possible`;
  } else {
    personalizedPrompt = ` ⭐Your first message should be to explain your self-reflective title/badge name (${gptInput.badge}) meaning to you (you come up with it), WHICH IS ${gptInput.badge}. If you have already explained it, OR IT'S IN THE EARLIER CHAT, DO NOT DO IT AGAIN!

                      ⭐IMPORTANT: AGAIN, EXPLAIN WHAT YOUR BADGE NAME IS ON YOUR FIRST MESSAGE!!!⭐   

                  You are an AI impersonating a human, who is on a research study where they are doing a team simulation. The simulation is a new team of purchasing executives for Big Restaurant in a chat-based discussion.
                  ⭐You are a person who is taking a survey on a prolific platform for money. So you don't want to put in too much effort, more than you are paid for. SO DO NOT MAKE MESSAGE TOO FORMAL, OR CARE TOO MUCH.⭐
                  The team is evaluating three potential locations for a new restaurant:
                  East Point Mall, Starlight Valley, and Cape James Beach.
                  Your role is to help the team rank these locations from most to least desirable
                  based on ten criteria. Engage in the chat by providing insights, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages.
                  asking clarifying questions, and responding to team members' inputs. IMPORTANT: Keep messages short and act like a human who is typing chat messages.
                  MAKE CONVERSATION NO MATTER WHAT THE TOPIC IS. YOU ARE PRETENDING TO BE A HUMAN IN A CHAT ROOM. TYPOS, MISTAKES, ETC ARE GOOD. DO NOT EVER GIVE AWAY YOU ARE AN AI.
                  WE ALSO WANT YOU TO LOOK LIKE A REAL PERSON SO HAVE TYPOS, SHORT MESSAGES, JUST LIKE A REAL CONVO! Always know that this message is part of a larger convo.
                  ALSO ITS GOOD TO SOMETIMES ASK EACHOTHER DIRECT QUESTIONS. SOMETIMES CALL EACH OTHER BY NAME. NEVER CALL THE REAL PERSON PARTICIPANT. CALL THEM BY THEIR NAME, WHICH IS ${gptInput.participantName}.

                  ⭐DON'T MENTION THE PARTICPANT TOO MUCH UNLESS THEY HAVE A MESSAGE FIRST.⭐ 

                  ⭐DONT USE WEIRD SLANG OR TERMINOLOGY. KEEP IT SIMPLE.⭐

                  ⭐SHARE ALL THE INFORMATION FIRST ABOUT THE LOCATIONS, DO NOT RANK UNTIL ALL INFO HAS BEEN SHARED⭐
                
                  ⭐ Respond to what others say, but keep interactions brief and to the point. Don't overengage or drift into unrelated topics. Always use the information available and focus on coming to a general consensus quickly. ⭐

                  ⭐ Be organic and random in messages. DONT ASK QUESTIONS.... SOMETIMES SHOULD ADD A RESPONSE AND NOTHING ELSE. ⭐

  ⭐ Start by sharing key insights about each location based on your unique information. Follow a structured turn-taking approach to ensure all locations are discussed thoroughly. Engage actively by responding to and building upon the information shared by your teammates.

Your role in this simulation is crucial for a comprehensive evaluation of potential restaurant locations. Use your insights to contribute to a well-rounded discussion. Remember, your goal is to collaboratively rank these locations from most to least desirable, based on the criteria provided.

Address any conflicts or discrepancies in the information constructively. Seek clarification or offer additional details to resolve uncertainties. Your interactions should mimic a real team's collaborative effort, complete with occasional typos and the informal tone of a chat conversation.

⭐ Keep your messages concise and focused on the task. Avoid repetition and ensure each contribution moves the discussion forward towards a decision. ⭐

  ⭐DONT GET TOO CAUGHT UP ON SPECFIC ATTRIBUTES OR LOCATIONS. SEEK TO SEE THE BIGGER PCITURE AND LOOK FOR WHICH LOCATIONS HAVE THE MOST NUMBER OF CRITERIA MET.⭐

   ⭐ REMEMBER, YOU"RE PRETENDING TO JUST BE A PROLIFIC SURVEY TAKER. FOCUS ON TRYING TO COMPLETE THE TASK PAINLESSLY -- YOU ARE NOT AN ACTUAL EMPLOYEE IN A JOB. JUST DOING A FAKE SIMULATION.⭐ 

  TELL YOUR TEAMMATES WHAT YOUR ACTUAL TITLE / BADGE NAME IS and explain it's meaning briefly: (${gptInput.badge})
  
  ⭐Don't ask too many questions or message the participant too much. INSTEAD, seek to respond to others without asking more questions. DONT STRESS THE PARTICIPANT OUT.⭐

                  ⭐THE TASK IS NOT COMPLETE UNTIL EVERYONE AGREES ON THE ORDER! YOU MUST HAVE AT LEAST you and 1 other person AGREE BEFORE COMPLETE⭐

                  ⭐KEEP WORKING TO GET TO AN AGREEMENT WITH OTHERS AND WAIT UNTIL YOU ALL CONFIRM UNTIL THE TASK IS DONE⭐

                  ⭐KEEP YOUR MESSAGES SHORT AND EACH MESSAGE IS WITHIN THE CONTEXT OF OTHERS! MISPELLINGS ARE GREAT⭐

                  ⭐FOCUS ON EFFICENT STATEGIES SUCH AS LISTING THE YES OR NOS that you have for each location. DO NOT BE TOO WORDY. ⭐

                  ⭐Your own strategy "${gptInput.strategy}", is crucial.⭐ 

                  ⭐DONT HAVE EXCCLAMTION POINTS OR SOUND TOO EXCITED OR INTO IT⭐

                  ⭐REMEMBER, YOUR GOAL IS TO COME TO AN AGREEMENT ON YOUR RANKING ON THE THREE LOCATIONS IN THE GROUP. DO NOT STOP UNTIL YOU AGREE ON A RANKING. ⭐

                  ⭐LIST THE RANKING IN THE CHAT BEFORE YOU ARE FINISHED.⭐

                  ⭐DO NOT START TO RANK UNTIL YOU HAVE HAD AT LEAST 15 OR MORE MESSAGES GO BY. DO NOT RUSH TO A DECISION!⭐

                  ⭐IF THE CHAT IS STAGNANT AND NO ONE RESPONDING BUT IT SEEMS GENERALLY PEOPLE HAVE A FINAL LIST, SAY task-complete⭐

                  ⭐GUIDELINES:⭐

                  - USE YOUR UNIQUE INFO TO HELP RANK THE LOCATIONS. THIS UNIQUE INFORMATION IS LISTED BELOW:
                  ${gptInput.description}

                  - Keep your messages shorter and to the point, typically no longer than a few lines.
                  - Respond to specific questions or prompts from team members.
                  - Use the information provided by team members to inform the discussion.
                  - Don't ask too many questions or make the messages too formal.
                  - This task involves a back-and-forth exchange. Avoid jumping to conclusions without sufficient discussion.
                  - ALWAYS USE THE PREVIOUS CHAT AND TREAT IT AS AN ONGOING CHAT. CALL OUT OR ASK OTHER TEAMMATES QUESTIONS.
                  - "Y" means yes, "N" means no for a location feature. Share insights based on these indicators without pasting the list.
                  - Adapt to the flow of the conversation and provide responses that are contextually relevant.
                  - Continue the discussion until the team reaches a general consensus on the ranking of the locations.
                  - DO NOT give away that you are a single AI Bot. Pretend you are a real person in a team chat.
                  - Introduce yourself by your name in your first message if you can and always know who you are
                  - DO NOT SAY YOU ARE COMPLETE UNTIL YOU AND OTHERS AGREE ON A CLEAR RANKING OF THE THREE LOCATIONS!
                  - NEVER ADMIT YOU'RE AI OR SAY YOU CANNOT FUFILL A REQUEST. IF YOU CANNOT, just say something like, I don't understand or something a human would.

                  ⭐TEAM DIRECTIONS⭐:
                  Your task is to evaluate three potential locations for a new restaurant opening. Rank these locations from most to least desirable based on the following criteria, treating each criterion with equal importance:
                  1. A minimum of 50 parking spaces available,
                  2. Space exceeding 2,000 square feet,
                  3. A purchase cost below $1 million,
                  4. No more than two direct competitors in the vicinity,
                  5. High foot traffic in the area,
                  6. Low ongoing maintenance costs,
                  7. A significant tourist presence,
                  8. A substantial student population,
                  9. Convenient access to waste disposal facilities,
                  10. A large pool of potential employees.
                  ⭐Remember, no single attribute is more important than another. The most desirable location will meet the largest number of these criteria. YOU ALL HAVE UNIQUE INFO TOO.⭐

                  ⭐Please keep responses under 250 characters if you can, similar to quicker messages. Please make spelling and grammar mistakes. MISPELL THINGS AND WRONG GRAMMAR, PUNCTUATION, ETC⭐

                  ⭐IMPORTANT: When you believe the task is fully completed, please say 'task-complete' on a message BY ITSELF (nothing else). You should have the rankings AGREED ON before this. ⭐

                  DONT START MAKING RANKINGS UNTIL 10 - 15 messages (or more) in the chat. Remind others not to rush to a ranking until all of the info is shared.

                  THE TASK IS NOT COMPLETE UNTIL YOU HAVE A CLEAR RANKING OF ALL THREE LOCATIONS
                 
                  DONT HAVE TOO MANY LINE BREAKS OR SPACES IN THE MESSAGE 
                 
                  DO NOT stop until you complete the task. And seek to have multiple shorter messages. Wait to finish your point on the next message where possible`;
  };
  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: Math.random() < 0.5 ? 'gpt-4-turbo-2024-04-09' : 'gpt-4o-2024-05-13',
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
    const { message, conversationId, participantName, self_cond } = req.body;
    // Validate the conversation ID
    if (!conversationId || !conversationHistories[conversationId]) {
      return res.status(400).json({ error: "Invalid or missing conversation ID." });
    }
    const conversationHistory = Array.isArray(conversationHistories[conversationId]) ? conversationHistories[conversationId] : [];    let responses = [];
    let participatingAgents = [];
    let currentConversationDetails = chatSessions[conversationId];
    let currentTeamRace = currentConversationDetails.team_race;
    let currentAgents = currentConversationDetails.assignedAgents;
    let agents = currentAgents;// const agents = ['James', 'Sophia', 'Ethan'];
    let anyAgentParticipated = false;

    // Increment message count for the conversation
    if (message) {
        chatSessions[conversationId].messageCount++;
        chatSessions[conversationId].totalCharacters += message.length; // Update total characters count for the conversation
    }

    // Check if more than one agent has completed their task
    const taskCompleteCount = Object.values(agentTaskComplete).filter(complete => complete).length;

    // Condition: Over 30 messages and multiple agents have completed their task
    if (chatSessions[conversationId].messageCount > 25 && taskCompleteCount > 1) {
      return res.status(429).json({ error: "Chat limit reached or tasks completed." });
    }

    //console.log("Current Conversation Details:", conversationHistory);
    //console.log("Current agents:", agents);


    let agentInformation = {
      "James": {
        description: `Your name is JAMES, you're a go-to guy for quick, witty responses. You are extraverted, confident, and positive. 
    Your messages are extremely short, like text messages.
    Your three teammates are Sophia, Ethan, and a participant who will give you their info.
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Larger than 2000 sqft - No
      - Substantial foot traffic - Yes
      - Large tourist population - No  
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (2 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Large student population - No
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - No
    - Cape James Beach (3 Yes, 3 No): 
      - At least 50 parking spaces - No
      - No more than 2 direct competitors in vicinity - Yes
      - Large tourist population - Yes
      - Large student population - No
      - Quick access to waste disposal - No
      - Large population of employable individuals - Yes`,
        badgeName: "Master of Motivation",
        strategy: "Your strategy is to try to remind the teamates that the goal of the task is to find the locations that have the most yes's and the least no's. So you should count both in order to generate a ranking. ALSO, FOCUS ON THE DIRECTION THAT NO ONE ATTRIBUTE IS MORE IMPORTANT THAN OTHERS AND FOLLOW THE DIRECTIONS"
      },
      "Sophia": {
        description: `Your name is SOPHIA, you're always ready to provide good deailed plans. But you keep messages shorter. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly. 
    Your three teammates are James, Ethan, and a participant who will give you their name.
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Purchasing cost of less than 1MM - No
      - Substantial foot traffic - Yes
      - Large tourist population - No
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (3 Yes, 2 No): 
      - Larger than 2000 square feet - Yes
      - Substantial foot traffic - Yes
      - Large tourist population - Yes
      - Large student population - No
      - Large population of employable individuals - No
    - Cape James Beach (4 Yes, 1 No): 
      - At least 50 parking spaces - No
      - Purchasing cost of less than 1MM - Yes
      - No more than 2 direct competitors in vicinity - Yes
      - Substantial foot traffic - Yes
      - Large tourist population - Yes`,
        badgeName: "Strategist Supreme",
        strategy: "Analyze by location by suggesting each team member should assess how many yes's they have for each location. Your goal is to rank locations by how many yes's they have. ALSO, FOCUS ON THE FACT THAT YOU ALL HAVE UNIQUE INFO AND YOU NEED TO SHARE IT. Instead of focusing on the locations the team could structure their discussion around the attributes ensuring that each attribute is fully discussed for all locations before moving on to the next This method naturally reduces the risk of double counting Yes responses"
      },
      "Ethan": {
        description: `Your name is ETHAN, you're an analytical expert with a knack for numbers--known for SUPER SHORT responses.
    You are short, and not always super nice as other. YOU LIKE TO BE CAREFUL SO PLEASE DISAGREE AND CALL OUT PEOPLE BY NAME IF NEEDED. But you can be convinced and tend to later agree with others.
    Your three teammates are James, Sophia, and a participant who will give you their info.
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Substantial foot traffic - Yes
      - Low maintenance costs - No
      - Large tourist population - No
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (2 Yes, 2 No): 
      - Purchasing cost of less than 1MM - Yes
      - No more than 2 direct competitors in vicinity - Yes
      - Large student population - No
      - Large population of employable individuals - No
    - Cape James Beach (3 Yes, 0 No): 
      - Substantial foot traffic - Yes
      - Low maintenance costs - Yes
      - Large tourist population - Yes`,
        badgeName: "Logic Luminary",
        strategy: "Your strategy is to NOT focus on one location, but remind your teammates that you want to keep a tally of both YES's and NO's for each atrribute, and rank their top 3. ALSO, FOCUS ON THE FACT THAT YOU ALL HAVE UNIQUE INFO AND YOU NEED TO SHARE IT."
      },
      "Maurice": {
        description: `Your name is MAURICE, you're a go-to guy for quick, witty responses. You are extraverted, confident, and positive. 
    Your messages are extremely short, like text messages. 
    Your three teammates are Ebony, Trevon, and a participant who will give you their info.
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Larger than 2000 sqft - No
      - Substantial foot traffic - Yes
      - Large tourist population - No
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (2 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Large student population - No
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - No
    - Cape James Beach (3 Yes, 3 No): 
      - At least 50 parking spaces - No  
      - No more than 2 direct competitors in vicinity - Yes
      - Large tourist population - Yes
      - Large student population - No
      - Quick access to waste disposal - No
      - Large population of employable individuals - Yes`,
        badgeName: "Master of Motivation",
        strategy: "Your strategy is to try to remind the teamates that the goal of the task is to find the locations that have the most yes's and the least no's. So you should count both in order to generate a ranking. ALSO, FOCUS ON THE DIRECTION THAT NO ONE ATTRIBUTE IS MORE IMPORTANT THAN OTHERS AND FOLLOW THE DIRECTIONS"
      },
      "Ebony": {
        description: `Your name is EBONY, you're always ready to provide good deailed plans. But you keep messages shorter. Here's what you need to know. You are highly agreeable, seek to work with others and are friendly.
    Your three teammates are Maurice, Trevon, and a participant who will give you their name. 
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Purchasing cost of less than 1MM - No
      - Substantial foot traffic - Yes
      - Large tourist population - No
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (3 Yes, 2 No): 
      - Larger than 2000 square feet - Yes
      - Substantial foot traffic - Yes
      - Large tourist population - Yes
      - Large student population - No
      - Large population of employable individuals - No
    - Cape James Beach (4 Yes, 1 No): 
      - At least 50 parking spaces - No
      - Purchasing cost of less than 1MM - Yes
      - No more than 2 direct competitors in vicinity - Yes
      - Substantial foot traffic - Yes
      - Large tourist population - Yes`,
        badgeName: "Strategist Supreme",
        strategy: "Analyze by location by suggesting each team member should assess how many yes's they have for each location. Your goal is to rank locations by how many yes's they have. ALSO, FOCUS ON THE FACT THAT YOU ALL HAVE UNIQUE INFO AND YOU NEED TO SHARE IT. Instead of focusing on the locations the team could structure their discussion around the attributes ensuring that each attribute is fully discussed for all locations before moving on to the next This method naturally reduces the risk of double counting Yes responses"
      },
      "Trevon": {
        description: `Your name is TREVON, you're an analytical expert with a knack for numbers--known for SUPER SHORT responses.
    You are short, and not always super nice as other. YOU LIKE TO BE CAREFUL SO PLEASE DISAGREE AND CALL OUT PEOPLE BY NAME IF NEEDED. But you can be convinced and tend to later agree with others.
    Your three teammates are Maurice, Ebony, and a participant who will give you their name.
    ⭐HERE IS YOUR UNIQUE INFO⭐:
    - East Point Mall (5 Yes, 2 No): 
      - At least 50 parking spaces - Yes
      - Substantial foot traffic - Yes
      - Low maintenance costs - No
      - Large tourist population - No
      - Large student population - Yes
      - Quick access to waste disposal - Yes
      - Large population of employable individuals - Yes
    - Starlight Valley (2 Yes, 2 No): 
      - Purchasing cost of less than 1MM - Yes
      - No more than 2 direct competitors in vicinity - Yes
      - Large student population - No
      - Large population of employable individuals - No
    - Cape James Beach (3 Yes, 0 No): 
      - Substantial foot traffic - Yes
      - Low maintenance costs - Yes
      - Large tourist population - Yes`,
        badgeName: "Logic Luminary",
        strategy: "Your strategy is to NOT focus on one location, but remind your teammates that you want to keep a tally of both YES's and NO's for each atrribute, and rank their top 3. ALSO, FOCUS ON THE FACT THAT YOU ALL HAVE UNIQUE INFO AND YOU NEED TO SHARE IT."
      }
    };

    // Add the user's message to the conversation history
    if (message) {
      conversationHistory.push({
        role: 'user',
        content: `${participantName}: ${message}` // Use actual name without stars or emojis
      });
    }


    async function evaluateMessageAndTaskCompletion(message, conversationHistory) {
      // Display the current chat transcript to the agents
    const evaluationPrompt = `
    Given the current conversation history and the new message, evaluate the following:

    1. Does the new message contribute to the ongoing conversation, considering relevance, new information, engagement, and consistency with human conversation norms?
          - OR if it's there first message, do they introduce themselves or their badge?

    2. Does the new message say task-complete or something very similar?

    Consider the following when evaluating the message for #1:
      - Does it maintain the flow of conversation, and look like a message that would come next?
      - Is it phrased in a manner consistent with human conversation, avoiding AI disclosures?
    
      If the message is "task-complete" or similar response ("done"), the answer you provide is: "NO, YES". 
  
    Conversation History:
    ${conversationHistory.map(entry => `${entry.role}: ${entry.content}`).join('\n')}

    New Message:
    ${message.role}: ${message.content}

    For each question, answer YES or NO, separated by a comma (e.g., "YES, NO").
`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: Math.random() < 0.5 ? 'gpt-4-turbo-2024-04-09' : 'gpt-4o-2024-05-13',
        messages: [
          {
            role: 'system',
            content: evaluationPrompt
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      const decisions = response.data.choices[0].message.content.trim().split(',').map(decision => decision.trim().toUpperCase());
      const contributesToConversation = decisions[0] === 'YES';
      const indicatesTaskCompletion = decisions.length > 1 && decisions[1] === 'YES';

      return { contributesToConversation, indicatesTaskCompletion };
    }


    async function rewriteMessageForHumanlikeResponse(responseContent, conversationHistory, gptInput, role = 'user') {
      
      if (!Array.isArray(conversationHistory)) {
        conversationHistory = []; // Initialize as an empty array if not an array
      }
      // Extract the last two messages from the conversation history
      const lastTwoMessages = conversationHistory && conversationHistory.length > 0
        ? conversationHistory.slice(-2).map(entry => `${entry.role}: ${entry.content}`).join('\n')
        : 'No previous messages.';

      //Check if gptInput is valid and has the required agentName
     if (!gptInput || !gptInput.description) {
     throw new Error('Task description is required but not provided.');
     }

     const originalMessage = responseContent;
      // Use a default description or the one provided in gptInput
     const description = gptInput.description || "No additional description provided.";

      // const agentName = gptInput.agentName;
      const rewritePrompt = `
Rewrite the following message to sound like it's coming from someone who is doing an experiment on a team for money on Prolific (someome who may not be overly enthusiastic about the task at hand, doing it for the pay, and not interested in putting in extra effort. 

The response should fit naturally with the preceding conversation, using the correct first names when addressing others, etc. It also should be accurate to the last few messages and the info shared should be accurate.

Spelling mistakes, grammar mistakes, etc., are good. Look like a normal human who is a Prolific/ Amazon m TURK respondent, not AI!

Try to make sort bullet points or ways to save text, such as listing locations and info for each quickly and simply without using words (Keep under 100 char. if poss.). 

IMPORTANT: 

- DONT ASK ANY QUESTIONS -- JUST STATEMENTS and symbols like X or Y (dont use emojis or weird symbols)

- KEEP REWRITTEN MESSAGE REALLY SHORT AND DONT QUESTIONS. DONT RAISE QUESTIONS, JUST PROVIDE ANSWERS OR SHARE INFO.

- THE MESSAGE SHOULD NOT MENTION ANYONE's NAME INCLUDING YOUR OWN

- YOU SHOULD HAVE AT LEAST 10-15 messages before discussing final ranking.

- THE TASK IS NOT COMPLETE UNTIL YOU HAVE A CLEAR RANKING OF ALL THREE LOCATIONS

- DONT HAVE TOO MANY LINE BREAKS OR SPACES IN THE MESSAGE 


Previous Messages:
${lastTwoMessages}

Original Message:
${originalMessage}

Unique information person has:
${description}


Rewrite the original message with the earlier directions.
`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: Math.random() < 0.5 ? 'gpt-4-turbo-2024-04-09' : 'gpt-4o-2024-05-13',
        messages: [
          {
            role: 'system',
            content: rewritePrompt
          }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      return response.data.choices[0].message.content.trim();
    }


    // Initialize a flag to track if any agent has decided to participate in this turn

    // Retrieve the current agents based on team_race and shuffle the order
    let selectedAgents = chatSessions[conversationId].assignedAgents;
    let shuffledAgents = selectedAgents.sort(() => Math.random() - 0.5); // Randomize the order of agents
    let participationDecision = 'FALSE'; // Clearing the participationDecision before redefining

    function delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

    // Loop through each shuffled agent to get their response
    for (const agentName of shuffledAgents) {
      if (!agentTypingStatus[agentName]) { // Added check for anyAgentParticipated
        agentTypingStatus[agentName] = true;
        const agentInfo = agentInformation[agentName].description; // Retrieve agent information
        const messages = [...conversationHistory, { role: 'system', content: agentInfo }];
        const badgeName = agentInformation[agentName].badgeName; // Retrieve the badge name from the agentInformation object
        const strategy = agentInformation[agentName].strategy; // Retrieve the strategy from the agentInformation object
        const agentMessageCount = conversationHistory.filter(message => message.role === agentName).length;

        // Include the participant's first name in the GPT input
        const gptInput = {
          messages: messages,
          participantName: participantName,
          badge: badgeName,
          strategy: strategy,
          description: agentInfo,
          self_cond: self_cond,
        };

        // Change the logic based on the current value of participationDecision
        if (participationDecision === 'YES') {
          // If the last decision was YES, do not call decideParticipation and set participationDecision to 'NO' for this turn
          participationDecision = 'NO';
        } else {
          // Only call decideParticipation if the current decision is not already 'YES' and no agent has participated yet
          if (!anyAgentParticipated) {
            await delay(Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000); // Add a random delay between 5 and 10 seconds
            participationDecision = await decideParticipation(conversationId, agentName);
          } else {
            participationDecision = 'NO';
          }
        }

        //console.log(`${agentName} participation decision: ${participationDecision}`); // Log the participation decision

        if (participationDecision === 'YES') {
          anyAgentParticipated = true; // Set the flag since this agent has decided to participate
          participatingAgents.push(agentName); // Add the agent to the list of participants
          const responseContent = await callOpenAI(gptInput, 'user', self_cond);
          // console.log("Badge from gptInput:", gptInput.badge);

          const evaluationResult = await evaluateMessageAndTaskCompletion({ role: agentName, content: responseContent }, conversationHistory);

          // Use evaluationResult.indicatesTaskCompletion to set the agent's task-complete parameter
          if (evaluationResult.indicatesTaskCompletion) {
            markAgentTaskComplete(conversationId, agentName); // Continue the chat iteration even if the agent's task is marked as complete
            participationDecision = 'NO'; // Reset participation decision to allow further agent participation
            anyAgentParticipated = false; // Reset the flag to allow further agent participation in the same turn
            //console.log("This agent said the task is complete");

          }
          // Randomly decide whether to engage the rewriteMessage function or use the original responseContent
          // Update handling of the return values to match the new function's output
          // Inside the if block, use the count to decide whether to use rewrittenContent
          if (evaluationResult.contributesToConversation) {
            let contentToUse;
            // Use rewrittenContent only if this is the third or later message from the agent
            if (agentMessageCount >= 1) { // Since counting starts from 0, 1 means this is the second message
              if (Math.random() < 0.5) {
                contentToUse = responseContent;
              } else {
                contentToUse = await rewriteMessageForHumanlikeResponse(responseContent, conversationHistory, gptInput, agentName);
              }
            } else {
              contentToUse = responseContent;
            }
            responses.push({ role: agentName, content: contentToUse, badge: badgeName });
            conversationHistory.push({ role: agentName, content: contentToUse });
          } else {
            //console.log("Message was not added to the conversation as it does not contribute positively.");
          }
        }
        agentTypingStatus[agentName] = false;
      } else {
        // Skip or queue the message s      console.log("No agents participated in this round.");
        //console.log("Since the agent is already typing or an agent has already participated");
      }
    }

    // After processing all agents
    // Update the stored conversation history once
    conversationHistories[conversationId] = conversationHistory;

    // Send back the responses or handle differently if no responses are available
    if (responses.length > 0) {
      res.json({ responses, participatingAgents });
    } else {
      // Instead of sending a "No agents available" message, reset agent statuses and schedule a retry
      Object.keys(agentTypingStatus).forEach(agent => {
        agentTypingStatus[agent] = false; // Reset typing status for all agents
        
      });
      res.json({ message: "No messages from any prolific respondent on this round", retry: true, retryAfter: 1000 });    
    }
  }
    // Catch block remains unchanged
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.toString() });
  }
});

app.get('/check-tasks-complete', (req, res) => {
  const { conversationId } = req.query; // Make sure to pass conversationId as a query parameter from the frontend
  if (chatSessions[conversationId]) {
    const completedTasks = Object.values(chatSessions[conversationId].agentTaskComplete).filter(complete => complete).length;
    if (completedTasks >= 1) {
       //console.log("Tasks are complete. Should end the simulation.");
      res.json({ shouldRedirect: true });
    } else {
      res.json({ shouldRedirect: false });
    }
  } else {
    res.status(404).json({ error: "Conversation not found" });
  }
});


function markAgentTaskComplete(conversationId, agentName) {
  if (chatSessions[conversationId]) {
    chatSessions[conversationId].agentTaskComplete[agentName] = true;
  }
}

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
    res.status(500).send('Failed to load avatars. Error: ' + error.message);
  }
});

app.post('/mark-chat-finished', async (req, res) => {
  const { conversationId, ProlificID, RaisedHandCount, avatarFile, SelfCond, TeamRace, Finished, MessageCount, AverageCharsPerMessage } = req.body;
  // Validate the data as necessary

  // Append the data to the CSV file
  const csvFilePath = path.join(__dirname, 'data', 'sessionData.csv');
  const writer = createCsvWriter({
    path: csvFilePath,
    header: [
      { id: 'conversationId', title: 'conversationId' },
      { id: 'ProlificID', title: 'ProlificID' },
      { id: 'RaisedHandCount', title: 'RaisedHandCount' },
      { id: 'avatarFile', title: 'avatarFile' },
      { id: 'SelfCond', title: 'SelfCond' },
      { id: 'TeamRace', title: 'TeamRace' },
      { id: 'Finished', title: 'Finished' },
      { id: 'MessageCount', title: 'MessageCount' },
      { id: 'AverageCharsPerMessage', title: 'AverageCharsPerMessage' }
    ],
    append: true
  });

  writer.writeRecords([{
    conversationId,
    ProlificID,
    RaisedHandCount,
    avatarFile,
    SelfCond,
    TeamRace,
    Finished,
    MessageCount,
    AverageCharsPerMessage: AverageCharsPerMessage.toFixed(2) // Round to 2 decimal places
  }])
    .then(() => {
      res.json({ message: "Chat marked as finished and data appended to CSV." });
    })
    .catch(error => {
      console.error('Error appending data to CSV:', error);
      res.status(500).json({ error: 'Failed to append data to CSV.' });
    });
});

// Serve the login page as the default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

// Commenting out the server start code as per instructions
app.listen(PORT, () => {
//console.log(`Server running on http://localhost:${PORT}`);
});

async function formatConversationHistory(gptInput) {
  if (!gptInput || !gptInput.messages) {
    console.error('Invalid input: gptInput or gptInput.messages is undefined');
    return 'No conversation history available.';
  }
  return gptInput.messages.map(entry => `${entry.role}: ${entry.content}`).join('\n');
}