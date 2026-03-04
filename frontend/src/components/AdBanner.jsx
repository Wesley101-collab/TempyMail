import React, { useEffect, useRef } from 'react';

/**
 * AdBanner component — renders a non-intrusive ad banner.
 * 
 * Recommended ad networks (AdSense alternatives):
 * 1. Monetag (PropellerAds) — No minimum traffic, instant approval
 * 2. A-Ads — Crypto-based, anonymous, no approval needed  
 * 3. Adsterra — Good CPM rates, easy approval
 * 4. PopAds — Pop-under ads, instant approval
 * 
 * To integrate: Sign up at one of these networks, get your ad script/tag,
 * and paste it into the AD_SCRIPT_SRC and AD_ZONE_ID below.
 */

// Replace these with your actual ad network values after signing up
const AD_CONFIG = {
    // Set to true once you have an ad network configured
    enabled: false,
    // Your ad network script URL (e.g., from Monetag, Adsterra, etc.)
    scriptSrc: '',
    // Your ad zone/placement ID
    zoneId: '',
};

export default function AdBanner({ position = 'sidebar', className = '' }) {
    const adRef = useRef(null);
    const loaded = useRef(false);

    useEffect(() => {
        if (!AD_CONFIG.enabled || loaded.current) return;
        loaded.current = true;

        // Load ad network script dynamically
        if (AD_CONFIG.scriptSrc && adRef.current) {
            const script = document.createElement('script');
            script.src = AD_CONFIG.scriptSrc;
            script.async = true;
            script.setAttribute('data-zone', AD_CONFIG.zoneId);
            adRef.current.appendChild(script);
        }
    }, []);

    // Placeholder ad banner when no ad network is configured
    if (!AD_CONFIG.enabled) {
        return (
            <div className={`ad-banner ad-${position} ${className}`}>
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-textMuted font-medium mb-1">📢 Advertisement</p>
                    <div className="bg-surface/50 rounded-lg p-3 border border-border/50">
                        <p className="text-sm font-semibold text-textMain">Your Ad Here</p>
                        <p className="text-xs text-textMuted mt-1">Reach thousands of privacy-conscious users</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`ad-banner ad-${position} ${className}`} ref={adRef}>
            <p className="text-[10px] text-textMuted text-center mb-1">Advertisement</p>
        </div>
    );
}
