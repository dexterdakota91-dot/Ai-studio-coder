import { useStore } from '../store/useStore';

export async function* generateChatResponse(chatId: string, userMessage: string, model: string = 'gemini-3-flash-preview') {
  const store = useStore.getState();
  const chatContext = store.chats.find(c => c.id === chatId);
  
  if (!chatContext) throw new Error("Chat not found");

  const history = chatContext.messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  let repoContext = "No repository is currently open.";
  if (store.selectedRepo) {
    repoContext = `Currently open repository: ${store.selectedRepo.owner.login}/${store.selectedRepo.name} (Default branch: ${store.selectedRepo.default_branch})\n\n`;
    if (store.fileTree && store.fileTree.length > 0) {
      repoContext += `File tree:\n${store.fileTree.map((item: any) => `- ${item.path} (${item.type})`).join('\n')}`;
    } else {
      repoContext += `File tree is empty or not loaded yet.`;
    }
  }

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userMessage,
      history,
      model,
      repoContext,
      githubToken: store.githubToken,
      selectedRepo: store.selectedRepo,
      customKey: store.geminiKey
    })
  });

  if (!response.ok) {
    throw new Error(`API returned error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("Failed to get response reader");
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.replace('data: ', '').trim();
        if (data === '[DONE]') break;
        if (data) {
          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            // ignore JSON parse error on incomplete chunks
          }
        }
      } else if (line.startsWith('event: error')) {
        const nextLineIndex = lines.indexOf(line) + 1;
        if (nextLineIndex < lines.length && lines[nextLineIndex].startsWith('data: ')) {
           const errorData = JSON.parse(lines[nextLineIndex].replace('data: ', ''));
           throw new Error(errorData.message);
        }
      }
    }
  }
}
