import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const GITHUB_API_URL = "https://api.github.com";

function getGithubHeaders(token: string) {
  return {
    Accept: "application/vnd.github.v3+json",
    Authorization: `Bearer ${token}`,
  };
}

async function fetchFileContent(owner: string, repo: string, filePath: string, token: string) {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`, {
    headers: getGithubHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to fetch file");
  const data = await res.json();
  if (data.encoding === "base64") {
    return Buffer.from(data.content, "base64").toString("utf8");
  }
  return data.content;
}

async function commitChange(owner: string, repo: string, filePath: string, message: string, content: string, token: string, branch: string = "main") {
  const fileRes = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: getGithubHeaders(token),
  });
  let sha;
  if (fileRes.ok) {
    const fileData = await fileRes.json();
    sha = fileData.sha;
  }

  const body: any = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${filePath}`, {
    method: "PUT",
    headers: {
      ...getGithubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("Failed to commit change");
  return res.json();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.get("/api/env", (req, res) => {
    res.json({
      gemini: !!process.env.GEMINI_API_KEY,
      vite_gemini: !!process.env.VITE_GEMINI_API_KEY,
      keys: Object.keys(process.env).filter(k => k.includes('GEMINI'))
    });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { userMessage, history, model, repoContext, githubToken, selectedRepo, customKey } = req.body;
      
      let rawKey = customKey || process.env.GEMINI_API_KEY || "";
      if (typeof rawKey !== "string") rawKey = "";
      const apiKey = rawKey.trim();
      if (!apiKey) throw new Error("Server configuration error: Gemini API key not found.");
      console.log("Using API Key starting with:", apiKey.substring(0, 5), "Length:", apiKey.length);
      
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });

      const systemInstruction = `You are a helpful AI coding assistant in AI Studio Coder.
You have access to the user's Github workspace.
${repoContext || "No repository is currently open."}

You can use the provided tools to read file contents and commit changes to files. Always explain what you are going to do before calling a tool. If the user asks you to edit a file, read it first using fetchFileContent if you haven't seen its contents. After editing, use commitChange to save it to their repository.`;

      const tools = [{
        functionDeclarations: [
          {
            name: "fetchFileContent",
            description: "Read the contents of a file from the currently open GitHub repository.",
            parameters: {
              type: "OBJECT",
              properties: {
                path: { type: "STRING", description: "The file path within the repository (e.g., src/App.tsx)" },
              },
              required: ["path"],
            },
          },
          {
            name: "commitChange",
            description: "Commit a change to a file in the currently open GitHub repository. This edits the file.",
            parameters: {
              type: "OBJECT",
              properties: {
                path: { type: "STRING", description: "The file path within the repository to modify or create (e.g., src/App.tsx)" },
                message: { type: "STRING", description: "The commit message" },
                content: { type: "STRING", description: "The new full content of the file" },
              },
              required: ["path", "message", "content"],
            },
          },
        ],
      }];

      const contents: any[] = [...history, { role: "user", parts: [{ text: userMessage }] }];
      let isDone = false;

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      while (!isDone) {
        const responseStream = await ai.models.generateContentStream({
          model: model || "gemini-3-flash-preview",
          contents,
          config: {
            systemInstruction,
            tools: tools as any,
          },
        });

        let modelParts: any[] = [];
        let toolCallFound: any = null;

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text, isToolCall: false })}\n\n`);
          }
          if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.text) {
                const lastPart = modelParts[modelParts.length - 1];
                if (lastPart && typeof lastPart.text === 'string') {
                  lastPart.text += part.text;
                } else {
                  modelParts.push({ text: part.text });
                }
              } else {
                // For functionCall, executableCode, etc.
                const existingIndex = modelParts.findIndex(p => p.functionCall && part.functionCall && p.functionCall.name === part.functionCall.name);
                if (existingIndex === -1) {
                  modelParts.push(part);
                } else {
                  // Replace with the latest chunk's version to ensure we get thoughtSignature and full args
                  modelParts[existingIndex] = part;
                }
                
                if (part.functionCall) {
                  toolCallFound = part.functionCall;
                }
              }
            }
          }
        }

        if (toolCallFound) {
          const { name, args } = toolCallFound;
          console.log("TOOL CALL FOUND:", JSON.stringify(toolCallFound));
          contents.push({ role: "model", parts: modelParts });

          let toolOutput = "";
          res.write(`data: ${JSON.stringify({ text: `\n\n*Executing \`${name}\`...*\n\n`, isToolCall: true })}\n\n`);

          try {
            if (!selectedRepo) throw new Error("No repository selected. Ask the user to open a repository first.");
            if (!githubToken) throw new Error("No GitHub token provided.");

            if (name === "fetchFileContent") {
              toolOutput = await fetchFileContent(selectedRepo.owner.login, selectedRepo.name, args.path as string, githubToken);
            } else if (name === "commitChange") {
              const result = await commitChange(selectedRepo.owner.login, selectedRepo.name, args.path as string, args.message as string, args.content as string, githubToken, selectedRepo.default_branch);
              toolOutput = `Successfully committed change: ${result.commit?.html_url || "success"}`;
            } else {
              throw new Error(`Unknown function: ${name}`);
            }
          } catch (err: any) {
            toolOutput = `Error: ${err.message}`;
          }

          contents.push({
            role: "user",
            parts: [{
              functionResponse: {
                name,
                response: { result: toolOutput },
                id: toolCallFound.id
              },
            }],
          });
        } else {
          isDone = true;
          res.write("data: [DONE]\n\n");
          res.end();
        }
      }
    } catch (error: any) {
      console.error(error);
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message || "An error occurred" })}\n\n`);
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
