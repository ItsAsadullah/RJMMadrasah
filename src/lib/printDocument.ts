export function triggerPrint(newTitle: string) {
        const originalTitle = document.title;
        
        // 1. Change document property
        document.title = newTitle;
        
        // 2. Change all <title> elements
        const titleTags = document.getElementsByTagName('title');
        const originalTitleTags: string[] = [];
        for (let i = 0; i < titleTags.length; i++) {
            originalTitleTags.push(titleTags[i].innerText);
            titleTags[i].innerText = newTitle;
        }

        // 3. Change all meta title elements (og:title, etc)
        const metaTags = document.querySelectorAll('meta[property="og:title"], meta[name="title"], meta[name="twitter:title"]');
        const originalMetaTags: {el: Element, val: string|null}[] = [];
        metaTags.forEach(meta => {
            originalMetaTags.push({ el: meta, val: meta.getAttribute('content') });
            meta.setAttribute('content', newTitle);
        });

        // Wait longer (800ms) for mobile OS webview to sync metadata
        setTimeout(() => window.print(), 800);
        
        const cleanup = () => {
            document.title = originalTitle;
            for (let i = 0; i < titleTags.length; i++) {
                if (originalTitleTags[i]) titleTags[i].innerText = originalTitleTags[i];
            }
            originalMetaTags.forEach(m => {
                if (m.val !== null) m.el.setAttribute('content', m.val);
            });
            window.removeEventListener('afterprint', cleanup);
            window.removeEventListener('focus', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.addEventListener('focus', cleanup);
        setTimeout(cleanup, 20000); // 20s absolute fallback
    };
