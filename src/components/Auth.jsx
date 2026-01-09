import React, { useState } from 'react';

export default function Intro({ onConnect }) {
    const [proxyDropdownOpen, setProxyDropdownOpen] = useState(false);

    const [formData, setFormData] = useState({
        nick: '',
        server: 'thepiratesplunder.org',
        port: 6697,
        channels: '#TPP',
        tls: true,
        client: "jbIRC",
        saslPassword: '',
        saslAccount: ''
    });

    const [proxyConfig, setProxyConfig] = useState({
        enabled: false,
        type: 'SOCKS5',
        host: '127.0.0.1',
        port: 9050,
    });

    const [saslEnabled, setSaslEnabled] = useState(false);
    const [status, setStatus] = useState('READY TO INITIALIZE...');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            
            if (name === 'nick') {
                newData.saslAccount = value;
            } else if (name === 'saslAccount') {
                newData.nick = value;
            }
            
            return newData;
        });
        
        setStatus(`INPUT_UPDATE: ${name.toUpperCase()}`);
    };

    const handleProxyChange = (e) => {
        const { name, value } = e.target;
        setProxyConfig(prev => ({ ...prev, [name]: value }));
        setStatus(`PROXY_CONFIG: ${name.toUpperCase()}`);
    };

    const toggleTor = () => {
        const newState = !proxyConfig.enabled;
        setProxyConfig(prev => ({
            ...prev,
            enabled: newState,
        }));
        setStatus(newState ? 'MODULE_LOADED: TOR_SOCKS5' : 'MODULE_UNLOADED: PROXY');
    };

    const toggleSasl = () => {
        const newState = !saslEnabled;
        setSaslEnabled(newState);
        
        if (newState) {
            setFormData(prev => ({ ...prev, saslAccount: prev.nick }));
        }
        
        setStatus(newState ? 'MODULE_LOADED: SASL_AUTH' : 'MODULE_UNLOADED: AUTH');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.nick || !formData.server) {
            setStatus('ERROR: MISSING_REQUIRED_FIELDS');
            return;
        }
        
        setStatus(proxyConfig.enabled ? 'ESTABLISHING_SECURE_TUNNEL...' : 'INITIATING_HANDSHAKE...');
        const channelArray = formData.channels.split(',').map(c => c.trim()).filter(Boolean);
        
        onConnect({ 
            ...formData, 
            channels: channelArray,
            proxy: proxyConfig,
            saslEnabled: saslEnabled 
        });
    };

    return (
        <div className="h-full bg-black text-gray-400 font-mono overflow-y-auto relative">
            
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="w-full max-w-lg border border-neutral-800 bg-neutral-950 shadow-2xl relative z-10">
                    
                    <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2 flex justify-between items-center text-xs tracking-widest">
                        <span>jbIRC</span>
                        <div className="flex gap-2">
                            <div className={`w-2 h-2 rounded-full border ${proxyConfig.enabled ? 'bg-orange-500 border-orange-500' : 'bg-red-500/20 border-red-500'} transition-colors duration-500`}></div>
                            <div className={`w-2 h-2 rounded-full border ${saslEnabled ? 'bg-cyan-500 border-cyan-500' : 'bg-yellow-500/20 border-yellow-500'} transition-colors duration-500`}></div>
                            <div className="w-2 h-2 rounded-full bg-green-500 border border-green-500 animate-pulse"></div>
                        </div>
                    </div>

                    <div className="p-8">
                        <div className="mb-8 text-center">
                            <h1 className="text-2xl text-gray-100 font-bold tracking-tight mb-2">
                                SYSTEM ACCESS
                            </h1>
                            <div className="text-xs text-neutral-600">
                                SECURE CONNECTION PROTOCOL // IRC-V3
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1">
                                <label className={`text-xs font-bold uppercase transition-colors duration-300 ${saslEnabled ? 'text-cyan-500' : 'text-neutral-500'}`}>
                                    Nickname {saslEnabled && '(SASL)'}
                                </label>
                                <div className="relative group">
                                    <span className={`absolute left-3 top-2.5 transition-colors duration-300 ${saslEnabled ? 'text-cyan-600' : 'text-neutral-600'}`}>@</span>
                                    <input 
                                        name="nick"
                                        value={formData.nick}
                                        onChange={handleChange}
                                        placeholder="Enter alias..."
                                        className={`w-full bg-neutral-900 border pl-8 pr-4 py-2 focus:outline-none transition-all placeholder-neutral-700 ${
                                            saslEnabled 
                                            ? 'border-cyan-500 text-cyan-50 shadow-[0_0_8px_rgba(6,182,212,0.15)] focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500' 
                                            : 'border-neutral-800 text-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                                        }`}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Target Host</label>
                                    <input 
                                        name="server"
                                        value={formData.server}
                                        onChange={handleChange}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-gray-200 px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Port</label>
                                    <input 
                                        name="port"
                                        type="number"
                                        value={formData.port}
                                        onChange={handleChange}
                                        className="w-full bg-neutral-900 border border-neutral-800 text-gray-200 px-4 py-2 text-center focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Channels</label>
                                <input 
                                    name="channels"
                                    value={formData.channels}
                                    onChange={handleChange}
                                    placeholder="#channel1, #channel2"
                                    className="w-full bg-neutral-900 border border-neutral-800 text-gray-200 px-4 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-neutral-700"
                                />
                            </div>

                            <div className={`border border-dashed border-neutral-800 p-4 relative mt-6 transition-all duration-300 ${saslEnabled ? 'bg-cyan-950/10 border-cyan-900/50' : ''}`}>
                                <div className="absolute -top-2 left-3 bg-neutral-950 px-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    Authentication
                                    {saslEnabled && <span className="text-cyan-500 animate-pulse">● SASL READY</span>}
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs transition-colors duration-300 ${saslEnabled ? 'text-cyan-400' : 'text-neutral-400'}`}>
                                        Authenticate via SASL?
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={toggleSasl}
                                        className={`cursor-pointer text-[10px] px-2 py-1 border transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                                            saslEnabled 
                                            ? 'border-cyan-500 text-cyan-500 bg-cyan-500/10 shadow-[0_0_8px_rgba(6,182,212,0.2)]' 
                                            : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500'
                                        }`}
                                    >
                                        {saslEnabled ? '[ DISABLE_AUTH ]' : '[ ENABLE_SASL ]'}
                                    </button>
                                </div>

                                <div className={`grid transition-all duration-300 ease-in-out ${saslEnabled ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                    <div className="overflow-hidden min-h-0">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-cyan-600 font-bold uppercase flex items-center gap-2">
                                                    Account Name
                                                </label>
                                                <input 
                                                    name="saslAccount" 
                                                    value={formData.saslAccount} 
                                                    onChange={handleChange} 
                                                    placeholder="Account username"
                                                    className="w-full bg-neutral-900 border border-cyan-500/50 text-cyan-100 text-xs py-2 px-2 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 placeholder-cyan-900/50 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-neutral-600 uppercase">Password</label>
                                                <input 
                                                    name="saslPassword" 
                                                    type="password"
                                                    value={formData.saslPassword} 
                                                    onChange={handleChange} 
                                                    className="w-full bg-neutral-900 border border-neutral-800 text-gray-300 text-xs py-2 px-2 focus:outline-none focus:border-cyan-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`border border-dashed border-neutral-800 p-4 relative mt-6 transition-all duration-300 ${proxyConfig.enabled ? 'bg-orange-950/10 border-orange-900/50' : ''}`}>
                                <div className="absolute -top-2 left-3 bg-neutral-950 px-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-2">
                                    Network Routing
                                    {proxyConfig.enabled && <span className="text-orange-500 animate-pulse">● ACTIVE</span>}
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs transition-colors duration-300 ${proxyConfig.enabled ? 'text-orange-400' : 'text-neutral-400'}`}>
                                        Route traffic via Proxy/Tor?
                                    </span>
                                    <button 
                                        type="button" 
                                        onClick={toggleTor}
                                        className={`cursor-pointer text-[10px] px-2 py-1 border transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                                            proxyConfig.enabled 
                                            ? 'border-orange-500 text-orange-500 bg-orange-500/10 shadow-[0_0_8px_rgba(249,115,22,0.2)]' 
                                            : 'border-neutral-700 text-neutral-500 hover:text-neutral-300 hover:border-neutral-500'
                                        }`}
                                    >
                                        {proxyConfig.enabled ? '[ DISABLE_PROXY ]' : '[ LOAD_TOR_PRESET ]'}
                                    </button>
                                </div>

                                <div className={`grid transition-all duration-300 ease-in-out ${proxyConfig.enabled ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'}`}>
                                    <div className="overflow-hidden min-h-0">
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1 relative">
                                                <label className="text-[10px] text-neutral-600 uppercase">Type</label>
                                                <div className="relative group">
                                                    <button
                                                        type="button"
                                                        onClick={() => setProxyDropdownOpen(!proxyDropdownOpen)}
                                                        className={`w-full bg-neutral-900 border text-left text-xs py-2 px-3 flex items-center justify-between transition-colors focus:outline-none ${
                                                            proxyDropdownOpen 
                                                                ? 'border-orange-500 text-orange-500' 
                                                                : 'border-neutral-800 text-gray-300 hover:border-neutral-600'
                                                        }`}
                                                    >
                                                        <span className="font-mono">{proxyConfig.type}</span>
                                                        <svg 
                                                            className={`w-3 h-3 transition-transform duration-300 ease-in-out ${proxyDropdownOpen ? 'rotate-180 text-orange-500' : 'text-neutral-500'}`} 
                                                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>

                                                    <div className={`absolute top-full left-0 w-full mt-1 bg-neutral-950 border border-neutral-800 shadow-xl z-50 overflow-hidden transition-all duration-200 origin-top ${
                                                        proxyDropdownOpen ? 'max-h-24 opacity-100 scale-y-100' : 'max-h-0 opacity-0 scale-y-95'
                                                    }`}>
                                                        {['SOCKS5', 'SOCKS4'].map((option) => (
                                                            <div
                                                                key={option}
                                                                onClick={() => {
                                                                    handleProxyChange({ target: { name: 'type', value: option } });
                                                                    setProxyDropdownOpen(false);
                                                                }}
                                                                className={`px-3 py-2 text-xs cursor-pointer font-mono border-l-2 transition-all ${
                                                                    proxyConfig.type === option
                                                                        ? 'bg-neutral-900 text-orange-400 border-orange-500'
                                                                        : 'text-gray-400 border-transparent hover:bg-neutral-900 hover:text-gray-200 hover:border-neutral-700'
                                                                }`}
                                                            >
                                                                {option}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-neutral-600 uppercase">Proxy Host</label>
                                                <input 
                                                    name="host" 
                                                    value={proxyConfig.host} 
                                                    onChange={handleProxyChange} 
                                                    className="w-full bg-neutral-900 border border-neutral-800 text-gray-300 text-xs py-2 px-2 focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] text-neutral-600 uppercase">Proxy Port</label>
                                                <input 
                                                    name="port" 
                                                    value={proxyConfig.port} 
                                                    onChange={handleProxyChange} 
                                                    className="w-full bg-neutral-900 border border-neutral-800 text-gray-300 text-xs py-2 px-2 text-center focus:outline-none focus:border-orange-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center space-x-3 cursor-pointer select-none group">
                                    <div className={`w-4 h-4 border flex items-center justify-center transition-colors duration-300 ${formData.tls ? 'border-green-500 bg-green-500/10' : 'border-neutral-600'}`}>
                                        <div className={`w-2 h-2 bg-green-500 transition-all duration-300 ${formData.tls ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
                                    </div>
                                    <input type="checkbox" name="tls" checked={formData.tls} onChange={handleChange} className="hidden" />
                                    <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">SSL_ENCRYPTION</span>
                                </label>
                            </div>

                            <button 
                                type="submit" 
                                className={`w-full font-bold py-3 mt-4 border transition-all duration-300 uppercase tracking-widest text-sm ${
                                    proxyConfig.enabled 
                                        ? 'bg-orange-950/30 border-orange-900 text-orange-500 hover:bg-orange-900/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]' 
                                        : 'bg-gray-100 hover:bg-white cursor-pointer text-black border-transparent hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]'
                                }`}
                            >
                                {proxyConfig.enabled ? '[ INITIALIZE TUNNEL ]' : '[ CONNECT ]'}
                            </button>

                        </form>
                    </div>

                    <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-1.5 text-[10px] text-neutral-500 flex justify-between uppercase">
                        <span>Status: <span className={`transition-colors duration-500 ${proxyConfig.enabled ? "text-orange-400" : "text-purple-400"}`}>{status}</span></span>
                    </div>
                </div>
            </div>
            
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

        </div>
    );
}
