export const getRelativeTime = (timestamp) => {
    // Handle both Date objects and ISO strings
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'unknown';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const seconds = Math.floor(diffMs / 1000);

    if (seconds < 0) return 'in the future';
    if (seconds < 30) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;

    const months = Math.floor(days / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
};
