const https = require('https');

const data = JSON.stringify({
    action: 'getMessagingUsers',
    email: 'admin',
    token: 'test'
});

const req = https.request('https://script.google.com/macros/s/AKfycbzubnIQgwD6_WGUuNAn_BNYisU7Jb8-NAMgKXZ3yM9xXC_2fk6YqEBIOv4YH2wxNr2kRQ/exec', {
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(data)
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log('Redirecting to:', res.headers.location);
            https.request(res.headers.location, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Length': Buffer.byteLength(data)
                }
            }, (res2) => {
                let body2 = '';
                res2.on('data', chunk => body2 += chunk);
                res2.on('end', () => console.log('Response:', body2));
            }).on('error', console.error).end(data);
        } else {
            console.log('Response:', body);
        }
    });
});

req.on('error', console.error);
req.end(data);
