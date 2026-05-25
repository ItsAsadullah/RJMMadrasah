'use client';

import { useEffect } from 'react';

const bengaliToEnglishMap: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

export default function BengaliNumberConverter() {
  useEffect(() => {
    const handleBeforeInput = (e: InputEvent) => {
      // Only intercept if there's text data being inputted and it contains Bengali digits
      if (e.data && /[০-৯]/.test(e.data)) {
        // Convert the input string
        const engData = e.data.replace(/[০-৯]/g, m => bengaliToEnglishMap[m]);
        
        // Prevent the default Bengali characters from being inserted
        e.preventDefault();
        
        // Insert the converted English characters
        // document.execCommand is the most reliable cross-browser way to insert text 
        // while preserving undo history and triggering React's onChange correctly.
        try {
            document.execCommand('insertText', false, engData);
        } catch (err) {
            // Fallback for some environments if execCommand fails
            const target = e.target as HTMLInputElement | HTMLTextAreaElement;
            if (target && typeof target.selectionStart === 'number') {
                try {
                    const start = target.selectionStart;
                    const end = target.selectionEnd || start;
                    const val = target.value;
                    
                    const newValue = val.slice(0, start) + engData + val.slice(end);
                    
                    const nativeSetter = Object.getOwnPropertyDescriptor(
                        target instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
                        'value'
                    )?.set;
                    
                    if (nativeSetter) {
                        nativeSetter.call(target, newValue);
                        target.dispatchEvent(new Event('input', { bubbles: true }));
                        target.selectionStart = target.selectionEnd = start + engData.length;
                    }
                } catch (fallbackErr) {
                    // Ignore errors on input types that don't support selection range (like type="number")
                }
            }
        }
      }
    };

    // Use capture phase to intercept before any other handlers or state changes
    document.addEventListener('beforeinput', handleBeforeInput as EventListener, { capture: true });

    return () => {
      document.removeEventListener('beforeinput', handleBeforeInput as EventListener, { capture: true });
    };
  }, []);

  return null;
}
