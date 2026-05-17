import { useState } from 'react';
import { Button } from './ui/button';
import { Settings, Plus, MessageSquare, Menu, Moon, Sun, Github } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useStore } from '../store/useStore';
import { SettingsModal } from './SettingsModal';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function Sidebar() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { chats, currentChatId, setCurrentChatId } = useStore();

  const handleNewChat = () => {
    const newId = Math.random().toString(36).substring(7);
    useStore.getState().setChats([...chats, { id: newId, title: 'New Conversation', messages: [], updatedAt: Date.now() }]);
    setCurrentChatId(newId);
  }

  return (
    <div className="w-64 h-full flex flex-col bg-sidebar text-sidebar-foreground transition-all">
      <div className="p-4 flex items-center justify-between">
        <div className="font-semibold text-lg flex items-center gap-2">
          <Github className="w-5 h-5" />
          AI Studio Coder
        </div>
      </div>
      
      <div className="px-4 py-2">
        <Button onClick={handleNewChat} className="w-full justify-start gap-2 bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          <p className="text-xs font-medium text-sidebar-foreground/50 mb-2 px-2">Recent</p>
          {chats.map(chat => (
            <Button 
              key={chat.id} 
              variant={currentChatId === chat.id ? 'secondary' : 'ghost'} 
              className="w-full justify-start gap-2 text-left font-normal truncate h-10 px-2"
              onClick={() => setCurrentChatId(chat.id)}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">{chat.title}</span>
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border/50">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsSettingsOpen(true)}>
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </div>
  );
}
