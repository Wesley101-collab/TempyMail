import React, { useEffect, useRef } from 'react';

/**
 * AdBanner component — renders Monetag banner ads.
 * Uses zone ID 216487 from Monetag (quge5.com).
 * The sw.js service worker handles push notification monetization separately.
 */

export default function AdBanner({ position = 'sidebar', className = '' }) {
    const adRef = useRef(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (loaded.current || !adRef.current) return;
        loaded.current = true;

        // Load Monetag banner ad script
        const script = document.createElement('script');
        script.src = 'https://quge5.com/88/tag.min.js';
        script.async = true;
        script.setAttribute('data-zone', '216487');
        script.setAttribute('data-cfasync', 'false');
        adRef.current.appendChild(script);
    }, []);

    return (
        <div className={`ad-banner ad-${position} ${className}`} ref={adRef}>
            <p className="text-[10px] text-textMuted text-center mb-1">Advertisement</p>
        </div>
    );
}
