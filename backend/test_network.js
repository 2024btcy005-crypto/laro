const net = require('net');

const host = 'junction.proxy.rlwy.net';
const port = 22850;

console.log(`Checking connectivity to ${host}:${port}...`);

const socket = net.createConnection(port, host, () => {
    console.log('✅ Connection SUCCESSFUL! The port is open.');
    socket.destroy();
    process.exit(0);
});

socket.on('error', (err) => {
    console.error('❌ Connection FAILED!');
    console.error(`Reason: ${err.message}`);
    console.error('This usually means the port is blocked by your current network (Firewall/Wi-Fi) or the host is down.');
    process.exit(1);
});

socket.setTimeout(10000);
socket.on('timeout', () => {
    console.error('❌ Connection TIMED OUT! No response from the server.');
    socket.destroy();
    process.exit(1);
});
