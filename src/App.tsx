/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { useStore } from './store/useStore';
import { Layout } from './components/Layout';
import { ChatArea } from './components/ChatArea';
import { GithubWorkspace } from './components/GithubWorkspace';
import { MainEditor } from './components/MainEditor';
import { TooltipProvider } from './components/ui/tooltip';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from './components/ui/sheet';
import { Button } from './components/ui/button';
import { Menu, Settings2 } from 'lucide-react';
import { Sidebar } from './components/Sidebar';

export default function App() {
  const setUser = useStore((state) => state.setUser);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
    }
    return false;
  });

  const isLeftDrawerOpen = useStore(state => state.isLeftDrawerOpen);
  const setIsLeftDrawerOpen = useStore(state => state.setIsLeftDrawerOpen);
  const isRightDrawerOpen = useStore(state => state.isRightDrawerOpen);
  const setIsRightDrawerOpen = useStore(state => state.setIsRightDrawerOpen);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsub();
  }, [setUser]);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobilePortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport(); // Check initial
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const [isChatExpanded, setIsChatExpanded] = useState(false);

  const mobileHeader = (
    <div className="md:hidden flex items-center justify-between p-2 border-b bg-sidebar text-sidebar-foreground">
      <Sheet open={isLeftDrawerOpen} onOpenChange={setIsLeftDrawerOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" />}>
          <Menu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80 border-r-border bg-sidebar text-sidebar-foreground flex flex-col">
          <SheetTitle className="sr-only">Workspace</SheetTitle>
          <GithubWorkspace />
        </SheetContent>
      </Sheet>

      <span className="font-medium text-sm">AI Studio Coder</span>

      <Sheet open={isRightDrawerOpen} onOpenChange={setIsRightDrawerOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 text-foreground" />}>
          <Settings2 className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-64 border-l-border bg-sidebar text-sidebar-foreground">
          <SheetTitle className="sr-only">Settings</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
    </div>
  );

  return (
    <TooltipProvider>
      <Layout mobileHeader={mobileHeader}>
        {isMobile ? (
          <div className="h-full w-full flex flex-col relative overflow-hidden bg-background">
            <div className="flex-1 min-h-0  overflow-hidden pb-[60px]">
              <MainEditor />
            </div>
            
            {/* Mobile Bottom Chat Sheet */}
            <div 
              className={`absolute bottom-0 left-0 right-0 bg-card border-t border-border transition-all duration-300 ease-in-out flex flex-col ${isChatExpanded ? 'h-[85vh]' : 'h-[60px]'}`}
            >
              <div 
                className="h-[60px] flex items-center justify-between px-4 cursor-pointer shrink-0"
                onClick={() => setIsChatExpanded(!isChatExpanded)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <span className="font-medium text-foreground text-sm">Chat with Gemini</span>
                </div>
                <div className="w-8 h-1 flex justify-center py-4">
                  <div className="w-8 h-1 bg-border rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden opacity-100 transition-opacity duration-300">
                 {isChatExpanded && <ChatArea />}
              </div>
            </div>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="h-full w-full overflow-hidden rounded-tl-xl md:rounded-tl-none border-border">
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="flex flex-col h-full overflow-hidden shrink-0 border-r border-border">
              <GithubWorkspace />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border" />
            <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col h-full overflow-hidden">
              <MainEditor />
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-border" />
            <ResizablePanel defaultSize={30} minSize={20} className="flex flex-col h-full overflow-hidden border-l border-border">
              <ChatArea />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </Layout>
    </TooltipProvider>
  );
}

