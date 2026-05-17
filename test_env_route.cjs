const http = require('http');
http.get('http://localhost:3000/api/env', (res) => {
    res.on('data', d => process.stdout.write(d));
});
