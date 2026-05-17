import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useStore } from '../store/useStore';
import { useEffect, useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Sun, Moon } from 'lucide-react';

export function SettingsModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user, githubToken, setGithubToken, geminiKey, setGeminiKey, currentModel, setCurrentModel } = useStore();
  
  const [ghToken, setGh] = useState(githubToken || '');
  const [gKey, setGk] = useState(geminiKey || '');

  const [theme, setTheme] = useState(document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  const handleSave = () => {
    setGithubToken(ghToken);
    setGeminiKey(gKey);
    onOpenChange(false);
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setTheme(isDark ? 'dark' : 'light');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Account</h4>
              <p className="text-xs text-muted-foreground">Sign in to save settings</p>
            </div>
            {user ? (
               <Button variant="outline" onClick={() => signOut(auth)}>Sign Out</Button>
            ) : (
               <Button onClick={handleLogin}>Sign In with Google</Button>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="github">GitHub Personal Access Token</Label>
            <Input 
              id="github" 
              type="password" 
              value={ghToken} 
              onChange={e => setGh(e.target.value)} 
              placeholder="ghp_..." 
            />
            <p className="text-xs text-muted-foreground">Required for reading/committing to repositories.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gemini">Gemini API Key (Optional)</Label>
            <Input 
              id="gemini" 
              type="password" 
              value={gKey} 
              onChange={e => setGk(e.target.value)} 
              placeholder="AIza..." 
            />
            <p className="text-xs text-muted-foreground">Leave blank to use the default AI Studio preview key.</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="model">Gemini Model</Label>
            <select
              id="model"
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option className="bg-background text-foreground" value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Default)</option>
              <option className="bg-background text-foreground" value="gemini-3.1-flash-preview">Gemini 3.1 Flash</option>
              <option className="bg-background text-foreground" value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option className="bg-background text-foreground" value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option className="bg-background text-foreground" value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </select>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Label>Theme</Label>
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
