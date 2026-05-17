const https = require('https');
https.get('https://ai.google.dev/gemini-api/docs/thought-signatures', res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
     const matches = body.match(/<[^>]+>([^<]+)<\/[^>]+>/g);
     if (matches) {
       for (const m of matches) {
         const t = m.replace(/<[^>]+>/g, '').trim();
         if (t.toLowerCase().includes('signature')) {
            console.log(t);
         }
       }
     }
  });
});
