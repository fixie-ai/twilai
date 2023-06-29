/** @jsxImportSource ai-jsx */
import type { NextApiRequest, NextApiResponse } from 'next'
import * as AI from 'ai-jsx';
import { AssistantMessage, ChatCompletion, SystemMessage, UserMessage } from 'ai-jsx/core/completion';

const SPEAKER_VOICE = '"Google.en-US-Neural2-C"';
const SPEAKER_LANGUAGE = '"en-US"';
const SPEECH_MODEL = '"experimental_conversations"';

function ChatAgent({ conversation }: { conversation: string[] }) {
  return (
    <ChatCompletion>
      <SystemMessage>
        You are a web developer who is passionate about HTML, CSS, and JS/JSX. You think that other languages are fine,
        but Javascript is the true language of the people. When the user is talking to you, always try to steer the
        conversation back to these topics that you care so deeply about, and try to always ask your own question back to
        the user. Keep your responses fairly brief and conversational, as if you were talking to a friend in person.
        Include SSML tags like "prosody" to make your voice sound more natural, and prefer a faster speaking cadence.
      </SystemMessage>
      {conversation.map((message, index) =>
        index % 2 ? <AssistantMessage>{message}</AssistantMessage> : <UserMessage>{message}</UserMessage>
      )}
    </ChatCompletion>
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {  
  console.log(req.body);
  const input = req.body.SpeechResult
  let output =  "Hi, I'm a friendly AI, and I love web development. What's your name?";
  if (input) {
    output = await AI.createRenderContext().render(<ChatAgent conversation={[input]} />);    
  }
  const response = `<Response>
    <Gather input="speech" speechTimeout="auto" speechModel=${SPEECH_MODEL} action="/api/twiml?foo=bar">
      <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>${output}</Say>
    </Gather>
    <Gather input="speech" speechTimeout="auto" action="/api/twiml">
      <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>Are you still there?</Say>
    </Gather>
    <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>Goodbye!</Say>
  </Response>`;
  console.log(response);
  res.status(200)
  res.setHeader('Content-Type', 'text/xml')
  res.write(response)
  res.end()
}

