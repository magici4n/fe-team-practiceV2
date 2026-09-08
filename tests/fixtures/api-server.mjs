// Use the provided educational API on a separate port for manual verification.
import app from '../../server/server.js';
app.listen(4011, '127.0.0.1', () => console.log('Test API: http://127.0.0.1:4011'));
