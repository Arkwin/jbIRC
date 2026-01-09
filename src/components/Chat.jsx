import { useState, useEffect, useRef } from 'react';

const COMMANDS = [
    { command: '/msg', params: '<nick> <message>', desc: 'Send a private message' },
    { command: '/join', params: '<channel>', desc: 'Join a specific channel' },
    { command: '/part', params: '<channel>', desc: 'Leave the current or specified channel' },
    { command: '/nick', params: '<new_nick>', desc: 'Change your nickname' },
    { command: '/clear', params: '', desc: 'Clear the current chat buffer' },
    { command: '/raw', params: '<command>', desc: 'Send a raw IRC command' },
    { command: '/quote', params: '<command>', desc: 'Alias for /raw' },
];

const getNickColor = (nick) => {
    if (!nick) return 'text-gray-400';
    const colors = [
        'text-cyan-400', 'text-green-400', 'text-emerald-400', 
        'text-blue-400', 'text-indigo-400', 'text-purple-400', 
        'text-fuchsia-400', 'text-pink-400', 'text-rose-400', 'text-yellow-400'
    ];
    let hash = 0;
    for (let i = 0; i < nick.length; i++) {
        hash = nick.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function Chat({ connectionDetails, onDisconnect }) {
    const [currentNick, setCurrentNick] = useState(connectionDetails.nick);
    const [activeBuffer, setActiveBuffer] = useState(connectionDetails.channels[0] || 'System');
    const [buffers, setBuffers] = useState(() => {
        const initial = connectionDetails.channels.length > 0 ? connectionDetails.channels : ['System'];
        return initial;
    });
    const [bufferMessages, setBufferMessages] = useState({});
    const [bufferUsers, setBufferUsers] = useState({});
    const [unreadBuffers, setUnreadBuffers] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showAutocomplete, setShowAutocomplete] = useState(false);
    const [filteredCommands, setFilteredCommands] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        const initialUsers = {};
        connectionDetails.channels.forEach(chan => {
            initialUsers[chan] = [{ nick: connectionDetails.nick, mode: '@', client: connectionDetails.client }];
        });
        setBufferUsers(initialUsers);
    }, [connectionDetails]);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [bufferMessages[activeBuffer], activeBuffer]);

    useEffect(() => {
        const handleIncoming = (msg) => {
            let targetBuffer = msg.target;
            const myNick = currentNick;

            if (msg.type === 'quit') {
                setBufferUsers(prev => {
                    const newState = { ...prev };
                    let affected = false;
                    Object.keys(newState).forEach(bufferName => {
                        const userExists = newState[bufferName]?.find(u => u.nick === msg.nick);
                        if (userExists) {
                            newState[bufferName] = newState[bufferName].filter(u => u.nick !== msg.nick);
                            affected = true;
                            setBufferMessages(prevMsgs => ({
                                ...prevMsgs,
                                [bufferName]: [...(prevMsgs[bufferName] || []), { ...msg, target: bufferName }]
                            }));
                        }
                    });
                    return affected ? newState : prev;
                });
                return; 
            }

            if (msg.type === 'part' && msg.nick === myNick) {
                 setBuffers(prev => prev.filter(b => b !== targetBuffer));
                 if (activeBuffer === targetBuffer) setActiveBuffer('System');
                 return;
            }

            if (targetBuffer === myNick) {
                targetBuffer = msg.nick;
            }

            if (!targetBuffer && msg.type === 'status') {
                targetBuffer = activeBuffer; 
            }

            if (!targetBuffer) return;

            setBuffers(prev => {
                if (!prev.includes(targetBuffer)) return [...prev, targetBuffer];
                return prev;
            });

            setBufferMessages(prev => ({
                ...prev,
                [targetBuffer]: [...(prev[targetBuffer] || []), msg]
            }));

            if (targetBuffer !== activeBuffer) {
                setUnreadBuffers(prev => prev.includes(targetBuffer) ? prev : [...prev, targetBuffer]);
            }

            if (msg.type === 'part' || msg.type === 'kick') {
                setBufferUsers(prev => ({
                    ...prev,
                    [targetBuffer]: (prev[targetBuffer] || []).filter(u => u.nick !== msg.nick)
                }));
            } else if (msg.nick && msg.type !== 'system' && msg.type !== 'status') {
                setBufferUsers(prev => {
                    const currentList = prev[targetBuffer] || [];
                    if (currentList.find(u => u.nick === msg.nick)) return prev;
                    return {
                        ...prev,
                        [targetBuffer]: [...currentList, { nick: msg.nick, mode: '' }]
                    };
                });
            }
        };

        let removeMessageListener;
        if (window.ircAPI) {
            removeMessageListener = window.ircAPI.onMessage(handleIncoming);
        }

        return () => {
            if (removeMessageListener) removeMessageListener();
        };
    }, [activeBuffer, currentNick]);

    const switchBuffer = (bufferName) => {
        setActiveBuffer(bufferName);
        setUnreadBuffers(prev => prev.filter(b => b !== bufferName));
        setShowAutocomplete(false);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        if (val.startsWith('/')) {
            const commandPart = val.split(' ')[0].toLowerCase();
            if (!val.includes(' ')) {
                const matches = COMMANDS.filter(c => c.command.startsWith(commandPart));
                setFilteredCommands(matches);
                setShowAutocomplete(matches.length > 0);
                setSelectedIndex(0);
            } else {
                setShowAutocomplete(false);
            }
        } else {
            setShowAutocomplete(false);
        }
    };

    const executeCommand = (cmdObj) => {
        setInputText(`${cmdObj.command} `);
        setShowAutocomplete(false);
    };

    const handleKeyDown = (e) => {
        if (showAutocomplete && filteredCommands.length > 0) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                executeCommand(filteredCommands[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowAutocomplete(false);
            }
        }
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        if (showAutocomplete) return;

        if (inputText.trim() === '/clear') {
            setBufferMessages(prev => ({
                ...prev,
                [activeBuffer]: []
            }));
            setInputText('');
            return;
        }

        if (inputText.startsWith('/msg ')) {
            const parts = inputText.split(' ');
            if (parts.length >= 3) {
                const targetNick = parts[1];
                const msgContent = parts.slice(2).join(' ');
                
                setBuffers(prev => !prev.includes(targetNick) ? [...prev, targetNick] : prev);
                
                const outMsg = {
                    nick: currentNick,
                    message: msgContent,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    type: 'message',
                    client: connectionDetails.client
                };
                
                setBufferMessages(prev => ({
                    ...prev,
                    [targetNick]: [...(prev[targetNick] || []), outMsg]
                }));
            }
        } else if (inputText.startsWith('/join ')) {
            const parts = inputText.split(' ');
            if (parts.length >= 2) {
                const channel = parts[1];
                setBuffers(prev => !prev.includes(channel) ? [...prev, channel] : prev);
                setActiveBuffer(channel);
            }
        } else if (inputText.startsWith('/part')) {
            const parts = inputText.split(' ');
            const target = parts.length >= 2 ? parts[1] : activeBuffer;
            
            if (target !== 'System') {
                setBuffers(prev => prev.filter(b => b !== target));
                if (activeBuffer === target) setActiveBuffer('System');
            }
        } else if (inputText.startsWith('/nick ')) {
            const parts = inputText.split(' ');
            if (parts.length >= 2) {
                const newNick = parts[1];
                const oldNick = currentNick;
                
                setCurrentNick(newNick);
                
                setBufferUsers(prev => {
                    const newState = { ...prev };
                    Object.keys(newState).forEach(key => {
                         newState[key] = newState[key].map(u => 
                             u.nick === oldNick ? { ...u, nick: newNick } : u
                         );
                    });
                    return newState;
                });

                const outMsg = {
                    nick: 'System',
                    message: `You are now known as ${newNick}`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    type: 'system'
                };
                setBufferMessages(prev => ({
                    ...prev,
                    [activeBuffer]: [...(prev[activeBuffer] || []), outMsg]
                }));
            }
        } else {
            if (!inputText.startsWith('/') || inputText.startsWith('/me ')) {
                const outMsg = {
                    nick: currentNick,
                    message: inputText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                    type: 'message',
                    client: connectionDetails.client
                };

                setBufferMessages(prev => ({
                    ...prev,
                    [activeBuffer]: [...(prev[activeBuffer] || []), outMsg]
                }));
            }
        }

        if (window.ircAPI) {
            window.ircAPI.sendMessage({
                target: activeBuffer,
                message: inputText,
                client: "jbIRC"
            });
        }

        setInputText('');
    };

    const handleOpenLogs = (e) => {
        e.preventDefault();
        if (window.ircAPI) window.ircAPI.openLogs();
    }

    const currentMessages = bufferMessages[activeBuffer] || [];
    const currentUsers = bufferUsers[activeBuffer] || [];

    return (
        <div className="flex h-full bg-black text-gray-300 font-sans text-sm overflow-hidden selection:bg-purple-900 selection:text-white">
            <div className="w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col">
                <div className="h-10 flex justify-center items-center px-4 bg-neutral-900 border-b border-neutral-800 font-semibold text-gray-100 tracking-wide">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    {connectionDetails.server}
                </div>
                
                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    <div className="px-4 py-2 text-xs font-bold text-neutral-500 uppercase tracking-widest">Messages</div>
                    
                    {buffers.map(buffer => {
                        const isActive = buffer === activeBuffer;
                        const isUnread = unreadBuffers.includes(buffer);
                        
                        return (
                            <div 
                                key={buffer}
                                onClick={() => switchBuffer(buffer)}
                                className={`mx-2 px-3 py-1 mb-1 flex justify-between items-center cursor-pointer transition-colors
                                    ${isActive 
                                        ? 'bg-neutral-800 text-white border-l-2 border-purple-500' 
                                        : 'text-gray-400 hover:bg-neutral-800 hover:text-gray-200 border-l-2 border-transparent'}
                                `}
                            >
                                <span className={`font-mono truncate ${isUnread ? 'text-white font-bold' : ''}`}>
                                    {buffer}
                                </span>
                                {isUnread && (
                                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-3 bg-neutral-950 border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-400 font-bold truncate max-w-[100px]">{currentNick}</span>
                        <button onClick={onDisconnect} className="flex justify-center align-middle text-xs font-bold text-red-500 hover:text-red-400 cursor-pointer">
                            QUIT
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-black">
                <div className="h-10 border-b border-neutral-800 flex align-start justify-between items-center px-4 bg-neutral-950">
                    <span className="font-mono text-gray-400 font-bold">{activeBuffer}</span>
                    <button className='group border h-[25px] flex items-center border-red-900/50 bg-red-950/20 px-6 py-2 rounded text-xs text-red-500 hover:bg-red-900 hover:text-white hover:border-red-500 transition-all uppercase tracking-wider font-mono' onClick={handleOpenLogs}>
                        [ Open Logs ]
                    </button>
                </div>

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 font-mono text-[13px] leading-6 custom-scrollbar">
                    <div className="mb-4 text-neutral-500 text-center text-xs opacity-50">
                        --- Beginning of history for {activeBuffer} ---
                    </div>

                    {currentMessages.map((msg, i) => (
                        <div key={i} className={`flex hover:bg-neutral-900/50 -mx-2 px-2 ${msg.type === 'system' ? 'text-neutral-500' : ''}`}>
                            <span className="text-neutral-600 mr-3 select-none w-45px text-right shrink-0">
                                {msg.time}
                            </span>

                            <div className="flex-1 wrap-break-word break-words overflow-hidden">
                                {msg.type === 'system' ? (
                                    <span>* {msg.nick} {msg.message}</span>
                                ) : (
                                    <>
                                        <span className={`font-bold mr-2 ${getNickColor(msg.nick || '')}`}>
                                            &lt;{msg.nick}&gt;
                                        </span>
                                        <span className="text-gray-200">{msg.message}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="relative">
                    {showAutocomplete && (
                        <div className="absolute bottom-full left-2 mb-1 w-96 bg-neutral-900 border border-neutral-700 shadow-2xl rounded-t overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-100">
                            <div className="bg-neutral-950 px-2 py-1 text-[10px] text-neutral-500 uppercase font-bold border-b border-neutral-800 flex justify-between">
                                <span>Command Completion</span>
                                <span>[TAB] to select</span>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {filteredCommands.map((cmd, idx) => (
                                    <div 
                                        key={cmd.command}
                                        onClick={() => executeCommand(cmd)}
                                        className={`px-3 py-2 cursor-pointer flex flex-col border-l-2 transition-colors ${
                                            idx === selectedIndex 
                                            ? 'bg-neutral-800 border-purple-500' 
                                            : 'border-transparent hover:bg-neutral-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold font-mono ${idx === selectedIndex ? 'text-purple-400' : 'text-gray-300'}`}>
                                                {cmd.command}
                                            </span>
                                            <span className="text-xs text-neutral-500 font-mono">
                                                {cmd.params}
                                            </span>
                                        </div>
                                        <span className="text-xs text-neutral-400">
                                            {cmd.desc}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-1 bg-neutral-950 border-t border-neutral-800">
                        <form onSubmit={handleSend} className="flex gap-2">
                            <span className="text-purple-500 font-mono pl-2 py-2 hidden sm:block">{currentNick} &gt;</span>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                className="flex-1 bg-transparent outline-none border-none focus:ring-0 text-white font-mono placeholder-neutral-600 ml-2 sm:ml-0"
                                placeholder={`Message ${activeBuffer}...`}
                                autoFocus
                            />
                        </form>
                    </div>
                </div>
            </div>

            <div className="w-48 bg-neutral-900 border-l border-neutral-800 flex flex-col hidden md:flex">
                <div className="h-10 flex items-center px-4 bg-neutral-900 border-b border-neutral-800 text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    Users ({currentUsers.length})
                </div>
                <div className="flex-1 overflow-y-auto p-2 font-mono text-xs custom-scrollbar">
                    {currentUsers.map((u, i) => {
                        return (
                        <div key={`${u.nick}-${i}`} className="px-2 py-1 text-gray-400 hover:bg-neutral-800 hover:text-gray-200 cursor-pointer rounded flex justify-between items-center group">
                            <span className="truncate">
                                <span className={`${u.mode === '@' ? 'text-yellow-500' : 'text-gray-500'} mr-1`}>
                                    {u.mode || ''}
                                </span>
                                {u.nick}
                            </span>
                        </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
