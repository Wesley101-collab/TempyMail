import React from 'react';

/**
 * AdBanner component — provides a styled ad container.
 * 
 * Monetag multitag script is loaded globally via index.html:
 * <script src="https://quge5.com/88/tag.min.js" data-zone="216487">
 * 
 * The multitag auto-detects ad placement opportunities and injects ads.
 * The sw.js service worker handles push notification monetization.
 * 
 * This component provides a visible container for the banner placement.
 */

export default function AdBanner({ position = 'sidebar', className = '' }) {
    return (
        <div
            className={`ad-banner ad-${position} ${className}`}
            id={`monetag-ad-${position}`}
            style={{ minHeight: '90px', width: '100%' }}
        >
            {/* Monetag multitag auto-fills this space */}
        </div>
    );
}
