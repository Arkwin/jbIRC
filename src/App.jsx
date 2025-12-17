import React, { useState, useEffect } from 'react';
import Intro from './components/Intro';
import Chat from './components/Chat';
import TitleBar from './components/TitleBar';

export default function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionDetails, setConnectionDetails] = useState(null);

    const handleConnect = (details) => {
        setConnectionDetails(details);
        if (window.ircAPI) {
            window.ircAPI.connect(details);
        }
    };

    useEffect(() => {
        let removeListener;
        if (window.ircAPI) {
            removeListener = window.ircAPI.onStatus((statusMsg) => {
                if (statusMsg === "Connected") {
                    setIsConnected(true);
                }
            });
        }
        
        return () => {
            if (removeListener) removeListener();
        };
    }, []);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-black">
            {window.ircAPI && <TitleBar />}
            <div className="flex-1 overflow-hidden relative">
                {!isConnected ? (
                    <Intro onConnect={handleConnect} />
                ) : (
                    <Chat 
                        connectionDetails={connectionDetails} 
                        onDisconnect={() => setIsConnected(false)} 
                    />
                )}
            </div>
        </div>
    );
}