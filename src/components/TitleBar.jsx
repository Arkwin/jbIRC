import React, { useState, useEffect } from 'react';

const SYSTEM_TITLES = [
    "jbIRC, the best IRC client",
];

export default function TitleBar() {
    const [title, setTitle] = useState("SYSTEM_BOOT...");

    useEffect(() => {
        const randomTitle = SYSTEM_TITLES[Math.floor(Math.random() * SYSTEM_TITLES.length)];
        setTitle(randomTitle);
    }, []);
    
    const handleMinimize = () => window.windowAPI?.minimize();
    const handleMaximize = () => window.windowAPI?.toggleMaximize();
    const handleClose = () => window.windowAPI?.close();

    return (
        <div className="h-8 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between select-none titlebar-drag">
            
            <div className="px-3 flex items-center gap-2">
                <span className="text-[10px] font-mono text-neutral-500 font-bold tracking-widest uppercase pt-0.5 min-w-150px">
                    {title}
                </span>
            </div>

            <div className="flex h-full titlebar-no-drag">
                <button 
                    onClick={handleMinimize}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                </button>

                <button 
                    onClick={handleMaximize}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>

                <button 
                    onClick={handleClose}
                    className="w-10 h-full flex items-center justify-center text-gray-500 hover:bg-red-900/50 hover:text-red-200 transition-colors focus:outline-none group"
                >
                    <svg className="w-3 h-3 group-hover:text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}