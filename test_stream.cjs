const { GoogleGenAI } = require("@google/genai");

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const tools = [{
    functionDeclarations: [
      {
        name: 'fetchFileContent',
        description: 'Fetch file content.',
        parameters: { type: 'OBJECT', properties: { path: { type: 'STRING' } } }
      }
    ]
  }];
  
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents: "Please fetch ErrorBoundary.tsx",
    config: { tools }
  });
  
  for await (const chunk of responseStream) {
    // iterating
  }
  
  const final = await responseStream.response;
  console.log("FINAL:", JSON.stringify(final.candidates[0].content.parts, null, 2));
}

main().catch(console.error);
