import { useStore } from '../store/useStore';

const GITHUB_API_URL = 'https://api.github.com';

function getHeaders() {
  const token = useStore.getState().githubToken;
  if (!token) throw new Error("Not authenticated with GitHub");
  return {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token}`
  };
}

export async function fetchUserRepos() {
  const res = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
    headers: getHeaders()
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid GitHub token. Please update it in Settings.");
    throw new Error(`Failed to fetch repos: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchRepoTree(owner: string, repo: string, defaultBranch: string = 'main') {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch repo tree");
  return res.json();
}

export async function fetchFileContent(owner: string, repo: string, path: string) {
  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to fetch file");
  const data = await res.json();
  if (data.encoding === 'base64') {
    return atob(data.content);
  }
  return data.content;
}

export async function commitChange(owner: string, repo: string, path: string, message: string, content: string, branch: string = 'main') {
  // 1. Get current file sha
  const fileRes = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: getHeaders()
  });
  let sha;
  if (fileRes.ok) {
    const fileData = await fileRes.json();
    sha = fileData.sha;
  }

  // 2. Commit
  const body: any = {
    message,
    content: btoa(content),
    branch
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error("Failed to commit change");
  return res.json();
}
