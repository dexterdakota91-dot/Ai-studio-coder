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
  
  let allParts = [];
  for await (const chunk of responseStream) {
     if (chunk.candidates?.[0]?.content?.parts) {
       for (const p of chunk.candidates[0].content.parts) {
         if (!p.text) {
           allParts.push(p);
         }
       }
     }
  }
  console.log(JSON.stringify(allParts, null, 2));
}

main().catch(console.error);
