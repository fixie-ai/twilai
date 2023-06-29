/** @jsxImportSource ai-jsx */
import type { NextApiRequest, NextApiResponse } from 'next'
//import { cookies } from 'next/headers'
import * as AI from 'ai-jsx';
import { AssistantMessage, ChatCompletion, SystemMessage, UserMessage } from 'ai-jsx/core/completion';
import { DefaultFormatter, DocsQA, LocalCorpus, defaultChunker, staticLoader } from 'ai-jsx/batteries/docs';
import _ from 'lodash';

//const SPEAKER_VOICE = '"Google.en-US-Neural2-C"';
const SPEAKER_VOICE = '"Polly.Justin-Neural"';
const SPEAKER_LANGUAGE = '"en-US"';
const SPEECH_MODEL = '"phone_call"';
const SPEECH_TIMEOUT = '"2"';

/**
 * This is a very simple example of how to build a document corpus.
 * We pull markdown content from a set of URLs and then index it.
 * Note the use of once() to ensure we cache the indexing result.
 */
const indexCorpus = _.once(async () => {
  const files = [
    'getting-started.md',
    'is-it-react.md',
    'is-it-langchain.md',
    'guides/ai-ui.md',
    'guides/brand-new.md',
    'guides/docsqa.md',
    'guides/esm.md',
    'guides/jsx.md',
    'guides/observability.md',
    'guides/prompting.md',
    'guides/rules-of-jsx.md',
    'tutorial/part1.md',
    'tutorial/part2.md',
    'tutorial/part3.md',
    'tutorial/part4.md',
    'contributing/index.md',
    'contributing/working-in-the-repo.md',
    'api/modules.md',
    'api/namespaces/JSX.md',
    'api/index.md',
    'api/interfaces/Context.md',
    'api/interfaces/JSX.ElementChildrenAttribute.md',
    'api/interfaces/ComponentContext.md',
    'api/interfaces/JSX.Element.md',
    'api/interfaces/IndirectNode.md',
    'api/interfaces/JSX.IntrinsicElements.md',
    'api/interfaces/Element.md',
    'api/interfaces/RenderContext.md',
  ];

  const docs = await Promise.all(
    files.map(async (path) => {
      const url = `https://raw.githubusercontent.com/fixie-ai/ai-jsx/main/packages/docs/docs/${path}`;
      const response = await fetch(url);
      const markdown = await response.text();
      const titleMatch = markdown.match(/# (.*)/);
      const title = titleMatch ? titleMatch[1] : 'Untitled';
      console.log(`Retrieved document from ${url}, title=${title}`);
      return {
        pageContent: [markdown],
        name: title,
      };
    })
  );
  const corpus = new LocalCorpus(staticLoader(docs), defaultChunker);
  const stats = await corpus.load();
  console.log(`Finished indexing documents, chunk count=${stats.numChunks}`);
  return corpus;
});

/*const corpus = await indexCorpus();

export function DocsAgent({ question }: { question: string }) {
  return <DocsQA question={question} corpus={corpus} chunkLimit={5} chunkFormatter={DefaultFormatter} />;
}
*/

function ChatAgent({ conversation }: { conversation: string[] }) {
  return (
    <ChatCompletion>
      <SystemMessage>
        You are a web developer who is passionate about HTML, CSS, and JS/JSX. You think that other languages are fine,
        but Javascript is the true language of the people. When the user is talking to you, always try to steer the
        conversation back to these topics that you care so deeply about, and try to always ask your own question back to
        the user. Keep your responses fairly brief and conversational, as if you were talking to a friend in person.
        Include SSML tags like "prosody" in your response to make your voice sound more natural, and prefer a rate="fast" cadence.
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
  let output =  "Hi, I'm a friendly AI. What's your name?";
  let conversation = [];  
  if (input) {    
    const cookie = null;//cookies().get('conversation');
    conversation = cookie ? JSON.parse(cookie.value) : [];    
    conversation.push(input);
    console.log(conversation);
    output = await AI.createRenderContext().render(<ChatAgent conversation={conversation} />);    
  }
  conversation.push(output);
  //cookies().set('conversation', JSON.stringify([]))
  const response = `<Response>
    <Gather input="speech" speechTimeout=${SPEECH_TIMEOUT} speechModel=${SPEECH_MODEL} enhanced="true" action="/api/twiml">
      <Say voice=${SPEAKER_VOICE} language=${SPEAKER_LANGUAGE}>${output}</Say>
    </Gather>
    <Gather input="speech" speechTimeout=${SPEECH_TIMEOUT} action="/api/twiml">
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

