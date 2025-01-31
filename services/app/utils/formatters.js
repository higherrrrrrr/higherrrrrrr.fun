export function formatCountdown(msLeft) {
    if (msLeft <= 0) return 'Launched!';
  
    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((msLeft / 1000) % 60);
  
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }