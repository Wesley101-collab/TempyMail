import React from 'react';

/**
 * Mage Icons — inline SVG icon components from mageicons.com
 * Open source icon system. Using stroke variants.
 */

export function MageRefresh({ className = '', ...props }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M17.6054 7.70537C16.8708 6.96718 15.9972 6.38183 15.0351 5.98308C14.073 5.58435 13.0414 5.38013 12 5.38222C9.89717 5.38222 7.88054 6.21757 6.39364 7.70446C4.90674 9.19136 4.07141 11.208 4.07141 13.3107C4.07141 15.4146 4.9064 17.4323 6.39299 18.9209C7.87958 20.4095 9.89622 21.2472 12 21.25C14.1037 21.2472 16.1204 20.4095 17.607 18.9209C19.0936 17.4323 19.9286 15.4146 19.9286 13.3107" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" />
            <path d="M16.8808 2.75L17.8292 6.60772C17.913 6.94965 17.858 7.31085 17.6763 7.61238C17.4945 7.9139 17.2009 8.13125 16.8594 8.21689L12.9911 9.16532" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MageEmail({ className = '', ...props }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect x="2.68159" y="3.5" width="18.5" height="17" rx="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2.72875 7.58978L9.93399 11.7198C10.5383 12.0709 11.2238 12.2557 11.9216 12.2557C12.6195 12.2557 13.305 12.0709 13.9093 11.7198L21.1344 7.58978" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function MageBell({ className = '', ...props }) {
    return (
        <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <path d="M11.9737 16.2078H16.7603C16.9467 16.2181 17.1327 16.1806 17.3005 16.0988C17.4683 16.0169 17.6124 15.8934 17.7189 15.74C17.8254 15.5867 17.8909 15.4086 17.9092 15.2229C17.9275 15.037 17.8978 14.8496 17.8231 14.6785C17.5707 13.9139 16.5615 12.9963 16.5615 12.094C16.5615 10.0907 16.5615 9.56313 15.5751 8.3856C15.2553 8.00661 14.8593 7.69918 14.4128 7.48334L13.8623 7.21571L10.085 7.21571L9.53451 7.48334C9.08807 7.69918 8.69206 8.00661 8.37227 8.3856C7.3859 9.56313 7.3859 10.0907 7.3859 12.094C7.3859 12.9963 6.42246 13.8221 6.17014 14.6327C6.01721 15.122 5.9331 16.2078 7.21003 16.2078H11.9737Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14.2674 16.208C14.2737 16.511 14.2187 16.8121 14.1055 17.0931C13.9925 17.3743 13.8238 17.6297 13.6095 17.8439C13.3953 18.0582 13.1398 18.2269 12.8587 18.34C12.5776 18.4531 12.2766 18.5082 11.9736 18.5018C11.6706 18.5082 11.3696 18.4531 11.0884 18.34C10.8073 18.2269 10.5519 18.0582 10.3376 17.8439C10.1234 17.6297 9.95463 17.3743 9.84156 17.0931C9.72849 16.8121 9.67343 16.511 9.67968 16.208" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
