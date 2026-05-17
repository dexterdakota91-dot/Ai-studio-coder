const http = require('http');

(async () => {
    try {
        const payload = JSON.stringify({
            userMessage: "Can you edit package.json and set version to 2.0.0?",
            history: [],
            model: "gemini-3-flash-preview",
            repoContext: "A repository",
            githubToken: "fake",
            selectedRepo: { owner: { login: "test" }, name: "test", default_branch: "main" }
        });

        const req = http.request("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            }
        }, (res) => {
            res.on('data', chunk => process.stdout.write(chunk.toString()));
        });
        req.write(payload);
        req.end();
    } catch (e) {
        console.error(e);
    }
})();
