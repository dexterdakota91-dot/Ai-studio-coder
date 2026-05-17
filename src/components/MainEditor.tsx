import { useState } from 'react';
import { useStore } from '../store/useStore';
import { commitChange } from '../lib/github';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Check, Loader2, Sparkles } from 'lucide-react';

export function MainEditor() {
  const { selectedFile, selectedRepo, fileContent, setFileContent } = useStore();
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [committing, setCommitting] = useState(false);

  const handleCommit = async () => {
    if (!selectedFile || !selectedRepo) return;
    try {
      setCommitting(true);
      await commitChange(
        selectedRepo.owner.login, 
        selectedRepo.name, 
        selectedFile.path, 
        commitMessage || `Update ${selectedFile.path}`,
        fileContent,
        selectedRepo.default_branch
      );
      setCommitModalOpen(false);
      setCommitMessage('');
    } catch (e) {
      console.error(e);
    } finally {
      setCommitting(false);
    }
  };

  if (!selectedFile) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-card text-muted-foreground p-8 text-center">
        <Sparkles className="w-12 h-12 mb-4 opacity-20" />
        <h2 className="text-xl font-medium text-foreground mb-2">Workspace Editor</h2>
        <p className="text-sm max-w-sm">
          Open the Workspace menu to select a repository and open a file to start editing.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-background relative min-h-0">
      <div className="p-2 border-b flex items-center justify-between bg-muted/20 text-xs font-medium shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="truncate">{selectedFile.path}</span>
        </div>
        <Button size="sm" className="h-6 px-3 text-xs shrink-0 ml-2" onClick={() => setCommitModalOpen(true)}>Commit</Button>
      </div>
      <div className="flex-1 w-full relative min-h-0">
        <textarea 
          value={fileContent}
          onChange={e => setFileContent(e.target.value)}
          className="absolute inset-0 w-full h-full bg-transparent p-4 text-sm font-mono resize-none focus:outline-none focus:ring-0 leading-relaxed"
          spellCheck={false}
        />
      </div>

      <Dialog open={commitModalOpen} onOpenChange={setCommitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Commit Changes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              value={commitMessage} 
              onChange={e => setCommitMessage(e.target.value)} 
              placeholder="Commit message..."
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleCommit();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommitModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCommit} disabled={committing}>
              {committing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
