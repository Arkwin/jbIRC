const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Irc = require('irc-framework');
const { SocksClient } = require('socks');
const tls = require('tls');
const net = require('net');

let mainWindow;
let ircClient;

const createWindow = () => {
    mainWindow = new BrowserWindow({
		width: 1100, 
		height: 800,
		center: true,
		frame: false,
		resizable: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: false,
			contextIsolation: true,
		},
		backgroundColor: '#000000'
    });

    if (app.isPackaged) {
		const productionPath = path.join(__dirname, '../renderer/main_window/index.html');
		mainWindow.loadFile(productionPath);
    } else {
		const devUrl = process.env['MAIN_WINDOW_VITE_DEV_SERVER_URL'] || 'http://localhost:5173';
		mainWindow.loadURL(devUrl);
    }
};

ipcMain.handle('minimize-window', () => {
  	mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
	if (mainWindow.isMaximized()) {
		mainWindow.unmaximize();
	} else {
		mainWindow.maximize();
	}
});

ipcMain.handle('close-window', () => {
  	mainWindow.close();
});

ipcMain.handle('connect-irc', async (event, data) => {
	console.log("Initializing Connection Protocol...", data);
	const { nick, server, port, channels, tls: useTls, proxy } = data;
	
	if (ircClient) {
		ircClient.quit();
	}

	let transportSocket = null;

	try {
		if (proxy && proxy.enabled) {
			console.log(`Routing traffic via ${proxy.type} Proxy: ${proxy.host}:${proxy.port}`);

			const proxyInfo = await SocksClient.createConnection({
				proxy: {
					host: proxy.host,
					port: parseInt(proxy.port),
					type: proxy.type === 'SOCKS5' ? 5 : 4,
				},
				command: 'connect',
				destination: {
					host: server,
					port: parseInt(port)
				}
			});
		
			transportSocket = proxyInfo.socket;
			console.log("Proxy Tunnel Established.");
		}

		if (useTls) {
		console.log("Upgrading Socket to TLS...");
		
		const tlsOptions = {
			host: server, 
			rejectUnauthorized: false,
			servername: server
		};

		if (transportSocket) {
			tlsOptions.socket = transportSocket;
			transportSocket = tls.connect(tlsOptions);
		} 
		}

		if (transportSocket && useTls) {
		await new Promise((resolve, reject) => {
			if (transportSocket.authorized || transportSocket.encrypted) return resolve();
			
			transportSocket.once('secureConnect', () => {
				console.log("TLS Handshake Successful.");
				resolve();
			});
			
			transportSocket.once('error', (err) => {
				console.error("TLS Handshake Failed:", err);
				reject(err);
			});
		});
		}

		ircClient = new Irc.Client();

		const connectOptions = {
			nick: nick,
			username: nick,
			gecos: 'jbIRC',
			encoding: 'utf8',
		};

		if (transportSocket) {
			connectOptions.stream = transportSocket;
		} else {
			connectOptions.host = server;
			connectOptions.port = port;
			connectOptions.tls = useTls;
			connectOptions.rejectUnauthorized = false;
		}

		ircClient.connect(connectOptions);

		ircClient.on('registered', () => {
			if (channels && channels.length > 0) {
				channels.forEach(channel => ircClient.join(channel));
			}

			sendMessageToUI({ type: 'status', message: 'Connected' });
		});

		ircClient.on('join', (event) => {
			sendMessageToUI({ nick: event.nick, target: event.channel, message: 'joined', type: 'system' });
		});

		ircClient.on('message', (event) => {
			sendMessageToUI({ nick: event.nick, target: event.target, message: event.message, type: 'message' });
		});

	} catch (err) {
		console.error("Connection Failed:", err);
		const wins = BrowserWindow.getAllWindows();
		if(wins[0]) wins[0].webContents.send('irc-status', `ERROR: ${err.message}`);
	}

	return { success: true };
});

ipcMain.handle('send-message', async (event, { target, message }) => {
	if (ircClient) {
		ircClient.say(target, message);
	}
});

function sendMessageToUI(data) {
	if (mainWindow && !mainWindow.isDestroyed()) {
		mainWindow.webContents.send('irc-status', data.message);
		
		if (data.type === 'message' || data.type === 'system') {
			mainWindow.webContents.send('irc-message', {
				nick: data.nick || 'System',
				target: data.target,
				message: data.message,
				type: data.type,
				time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
			});
		}
	}
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});