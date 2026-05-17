import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { fetchUserRepos, fetchRepoTree, fetchFileContent, commitChange } from '../lib/github';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { BookMarked, Folder, FileCode, Check, Loader2, GitCommitHorizontal, RefreshCw } from 'lucide-react';

export function GithubWorkspace() {
  const { 
    githubToken, user, 
    selectedRepo, setSelectedRepo,
    selectedFile, setSelectedFile,
    fileTree, setFileTree,
    fileContent, setFileContent 
  } = useStore();
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorItem, setErrorItem] = useState<string | null>(null);

  useEffect(() => {
    if (githubToken) {
      loadRepos();
    }
  }, [githubToken]);

  const loadRepos = async () => {
    if (!githubToken) return;
    try {
      setLoading(true);
      setErrorItem(null);
      const data = await fetchUserRepos();
      if (!Array.isArray(data)) {
        throw new Error(data.message || "Invalid format returned from GitHub");
      }
      setRepos(data);
    } catch (e: any) {
      console.error(e);
      setErrorItem(e.message || "Failed to load repos.");
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = async (repo: any) => {
    setSelectedRepo(repo);
    setSelectedFile(null);
    setFileContent('');
    try {
      setLoading(true);
      const data = await fetchRepoTree(repo.owner.login, repo.name, repo.default_branch || 'main');
      setFileTree(data.tree || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async (file: any) => {
    if (file.type !== 'blob') return; // Only open files
    setSelectedFile(file);
    useStore.getState().setIsLeftDrawerOpen(false); // auto close mobile drawer
    try {
      setLoading(true);
      const content = await fetchFileContent(selectedRepo.owner.login, selectedRepo.name, file.path);
      setFileContent(content);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!githubToken) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-sidebar/30">
        <GitCommitHorizontal className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">Connect your GitHub account in Settings to access repositories.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-card transition-all">
      <div className="p-4 pr-12 border-b flex items-center justify-between font-medium">
        <div className="flex items-center gap-2">
          <span>Workspace</span>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <Button variant="ghost" size="icon" className="w-6 h-6 hover:bg-transparent" onClick={loadRepos} disabled={loading}>
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'opacity-50' : ''}`} />
        </Button>
      </div>
      
      {!selectedRepo ? (
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <div className="px-2 py-2 flex flex-col gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Repositories</span>
              {errorItem && <div className="text-xs text-destructive p-2 bg-destructive/10 rounded border border-destructive/20 normal-case font-medium leading-tight">{errorItem}</div>}
            </div>
            {!loading && !errorItem && repos.length === 0 && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No repositories found. Make sure your GitHub Personal Access Token has the 'repo' scope enabled.
              </div>
            )}
            {repos.map(repo => (
              <Button 
                key={repo.id} 
                variant="ghost" 
                className="w-full justify-start text-left font-normal h-8 px-2"
                onClick={() => handleSelectRepo(repo)}
              >
                <BookMarked className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <span className="truncate">{repo.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-2 border-b flex items-center justify-between bg-muted/20">
            <Button variant="ghost" size="sm" onClick={() => setSelectedRepo(null)} className="h-7 text-xs px-2">
              Back
            </Button>
            <span className="text-xs font-medium truncate max-w-[150px]" title={selectedRepo.name}>{selectedRepo.name}</span>
          </div>

          <ScrollArea className="flex-1 h-full">
             <div className="p-2 space-y-0.5 mt-1">
               {fileTree.filter(f => !f.path.startsWith('.git')).slice(0, 100).map(file => (
                 <button 
                  key={file.path}
                  onClick={() => handleSelectFile(file)}
                  className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md hover:bg-muted text-left ${selectedFile?.path === file.path ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                 >
                   {file.type === 'tree' ? <Folder className="w-3.5 h-3.5 mr-2 text-blue-400" /> : <FileCode className="w-3.5 h-3.5 mr-2 text-muted-foreground" />}
                   <span className="truncate">{file.path.split('/').pop()}</span>
                 </button>
               ))}
               {fileTree.length > 100 && <div className="text-xs text-muted-foreground px-2 py-1 italic">Showing top 100 files...</div>}
             </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
