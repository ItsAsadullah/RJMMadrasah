"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableIdProps {
    id: string;
    className?: string;
}

export function CopyableId({ id, className = "" }: CopyableIdProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row click events
        try {
            await navigator.clipboard.writeText(id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy!", err);
        }
    }, [id]);

    return (
        <span 
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 px-1.5 py-0.5 rounded transition-colors group ${className}`}
            title="কপি করতে ক্লিক করুন"
        >
            <span>{id}</span>
            <span className="text-gray-400 group-hover:text-gray-700 transition-colors">
                {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                    <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                )}
            </span>
        </span>
    );
}
