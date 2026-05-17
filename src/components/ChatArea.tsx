import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Send, Upload, Square } from 'lucide-react';
import { generateChatResponse } from '../lib/gemini';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function ChatArea() {
  const { currentChatId, chats, addMessage } = useStore();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentChat = chats.find(c => c.id === currentChatId);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector<HTMLDivElement>('[data-slot="scroll-area-viewport"]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [currentChat?.messages]);

  if (!currentChatId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-xl font-medium">Welcome to AI Studio Coder</p>
        <p className="text-sm">Select a chat or start a new conversation to begin.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput('');
    
    addMessage(currentChatId, {
      id: Math.random().toString(),
      role: 'user',
      text: userText,
      timestamp: Date.now()
    });

    setIsGenerating(true);

    try {
      const responseStream = generateChatResponse(currentChatId, userText, useStore.getState().currentModel);
      
      let fullResponse = '';
      const messageId = Math.random().toString();
      
      // Add empty model message first
      addMessage(currentChatId, {
        id: messageId,
        role: 'model',
        text: '',
        timestamp: Date.now()
      });

      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        // Update the message in store
        useStore.setState(state => ({
          chats: state.chats.map(c => 
            c.id === currentChatId 
              ? { ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, text: fullResponse } : m) }
              : c
          )
        }));
      }
    } catch (error: any) {
      console.error(error);
      addMessage(currentChatId, {
        id: Math.random().toString(),
        role: 'model',
        text: `**Error:** ${error.message || 'Failed to generate response.'}`,
        timestamp: Date.now()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col h-full bg-background relative overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
          {currentChat?.messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground ml-12' 
                  : 'bg-muted/50 text-foreground mr-12'
              }`}>
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                  <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-muted/50 text-foreground rounded-2xl px-5 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-75" />
                <span className="w-2 h-2 rounded-full bg-primary/50 animate-bounce delay-150" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 bg-background/80 backdrop-blur-md absolute bottom-0 left-0 right-0">
        <div className="max-w-3xl mx-auto relative rounded-2xl border bg-card shadow-sm flex items-end p-2 focus-within:ring-1 focus-within:ring-primary overflow-hidden">
          <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground rounded-full h-8 w-8 mb-1">
            <Upload className="w-4 h-4" />
          </Button>
          <Textarea 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Gemini to write code or analyze files..."
            className="border-0 shadow-none focus-visible:ring-0 resize-none min-h-[44px] max-h-32 rounded-none bg-transparent"
            rows={1}
          />
          <Button 
            onClick={isGenerating ? () => {} : handleSend} 
            size="icon" 
            className={`shrink-0 rounded-full h-8 w-8 mb-1 ${input.trim() && !isGenerating ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            disabled={(!input.trim() && !isGenerating)}
          >
            {isGenerating ? <Square className="w-4 h-4 fill-current" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
