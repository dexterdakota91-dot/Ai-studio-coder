import { create } from 'zustand';
import { User } from 'firebase/auth';

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

type AppState = {
  user: User | null;
  setUser: (user: User | null) => void;
  githubToken: string | null;
  setGithubToken: (token: string | null) => void;
  geminiKey: string | null;
  setGeminiKey: (key: string | null) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  chats: ChatSession[];
  setChats: (chats: ChatSession[]) => void;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;

  // Github Workspace State
  selectedRepo: any | null;
  setSelectedRepo: (repo: any | null) => void;
  selectedFile: any | null;
  setSelectedFile: (file: any | null) => void;
  fileTree: any[];
  setFileTree: (tree: any[]) => void;
  fileContent: string;
  setFileContent: (content: string) => void;
  isLeftDrawerOpen: boolean;
  setIsLeftDrawerOpen: (open: boolean) => void;
  isRightDrawerOpen: boolean;
  setIsRightDrawerOpen: (open: boolean) => void;
};

export const useStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  githubToken: localStorage.getItem('githubToken') || null,
  setGithubToken: (token) => {
    if (token) localStorage.setItem('githubToken', token);
    else localStorage.removeItem('githubToken');
    set({ githubToken: token });
  },
  geminiKey: localStorage.getItem('geminiKey') || null,
  setGeminiKey: (key) => {
    if (key) localStorage.setItem('geminiKey', key);
    else localStorage.removeItem('geminiKey');
    set({ geminiKey: key });
  },
  currentModel: 'gemini-3-flash-preview',
  setCurrentModel: (model) => set({ currentModel: model }),
  chats: [],
  setChats: (chats) => set({ chats }),
  currentChatId: null,
  setCurrentChatId: (id) => set({ currentChatId: id }),
  addMessage: (chatId, message) => set((state) => {
    const updatedChats = state.chats.map((c) => {
      if (c.id === chatId) {
        return { ...c, messages: [...c.messages, message], updatedAt: Date.now() };
      }
      return c;
    });
    return { chats: updatedChats };
  }),
  selectedRepo: null,
  setSelectedRepo: (repo) => set({ selectedRepo: repo }),
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),
  fileTree: [],
  setFileTree: (tree) => set({ fileTree: tree }),
  fileContent: '',
  setFileContent: (content) => set({ fileContent: content }),
  isLeftDrawerOpen: false,
  setIsLeftDrawerOpen: (open) => set({ isLeftDrawerOpen: open }),
  isRightDrawerOpen: false,
  setIsRightDrawerOpen: (open) => set({ isRightDrawerOpen: open }),
}));
