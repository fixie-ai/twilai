/** @jsxImportSource ai-jsx */
import type { NextApiRequest, NextApiResponse } from 'next'
import * as AI from 'ai-jsx';
import { AssistantMessage, ChatCompletion, SystemMessage, UserMessage } from 'ai-jsx/core/completion';
import _ from 'lodash';

//const SPEAKER_VOICE = '"Google.en-US-Neural2-C"';
const SPEAKER_VOICE = '"Polly.Justin-Neural"';
const SPEAKER_LANGUAGE = '"en-US"';
const SPEECH_MODEL = '"phone_call"';
const SPEECH_TIMEOUT = '"2"';

const ANIMALS = [
  "Kangaroo",
  "Lion",
  "Chicken",
  "Swan",
  "Elephant",
  "Platypus",
  "Bee",
  "Ferret",
  "Turkey",
  "Goat",
  "Horse",
  "Deer",
  "Fish",
  "Frog",
  "Seal",
  "Bear",
  "Hare",
  "Goose",
  "Eagle",
  "Duck",
  "Dog",
  "Cat",
  "Giraffe",
  "Zebra",
  "Cheetah",
  "Leopard",
  "Penguin",
  "Dolphin",
  "Whale",
  "Shark",
  "Badger",
  "Otter",
  "Squirrel",
  "Rabbit",
  "Pig",
  "Mouse",
  "Parrot",
  "Owl",
  "Wolf",
  "Hippopotamus",
  "Rhinoceros",
  "Polar Bear",
  "Buffalo",
  "Coyote",
  "Fox",
  "Moose",
  "Llama",
  "Koala",
  "Sloth",
  "Panda",
  "Porcupine"
];


function ChatAgent({ animal, conversation }: { animal: string, conversation: string[] }) {
  return (
    <ChatCompletion>
      <SystemMessage>
        You are an energetic and friendly {animal} who loves to talk to people. Carry on a conversation, always trying
        to include interesting details about yourself, and also try to always ask your own question back to
        the user. Keep your responses fairly brief and conversational, as if you were talking to a friend in person.
        Include SSML tags like "prosody" in your response to make your voice sound more natural, and prefer a rate="fast" cadence.
      </SystemMessage>
      {conversation.map((message, index) =>
        index % 2 == 0 ? <AssistantMessage>{message}</AssistantMessage> : <UserMessage>{message}</UserMessage>
      )}
    </ChatCompletion>
  );
}


export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {  
  const json = req.body;
  const input = json.SpeechResult
  const state = req.cookies['state']
  let output;
  let animal;
  let conversation;
  if (input && state) {    
    const obj = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));    
    console.log(`obj: ${obj}`)
    conversation = obj["conversation"];
    animal = obj["animal"];
    conversation.push(input);
    console.log(conversation);
    output = await AI.createRenderContext().render(<ChatAgent animal={animal} conversation={conversation} />);    
  } else {
    animal = _.sample(ANIMALS);
    conversation = [];
    output = `Hi, I'm a friendly ${animal}. What's your name?`;    
  }
  conversation.push(output);
  console.log(`animal: ${animal}`);
  console.log(`conversation: ${conversation}`);
  const twiml = `<Response>
    <Gather input="speech" speechTimeout=${SPEECH_TIMEOUT} speechModel=${SPEECH_MODEL} enhanced="true" action="/api/twiml">
      <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>${output}</Say>
    </Gather>
    <Gather input="speech" speechTimeout=${SPEECH_TIMEOUT} action="/api/twiml">
      <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>Are you still there?</Say>
    </Gather>
    <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>Goodbye!</Say>
  </Response>`;
  console.log(`twiml: ${twiml}`);
  const newState = Buffer.from(JSON.stringify({ "animal": animal, "conversation": conversation })).toString('base64');
  res.status(200)
  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Set-Cookie', `state=${newState}`);  
  res.write(twiml);
  res.end()
}

