const { GoogleGenAI } = require("@google/genai");

async function main() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const tools = [{
    functionDeclarations: [
      {
        name: 'fetchFileContent',
        description: 'Fetch file content.',
        parameters: {
          type: 'OBJECT',
          properties: { path: { type: 'STRING' } }
        }
      }
    ]
  }];
  
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: "Please fetch ErrorBoundary.tsx",
    config: { tools }
  });
  
  console.log(JSON.stringify(response.candidates[0].content.parts, null, 2));
}

main().catch(console.error);
