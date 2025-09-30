// Simple alert sound generator using Web Audio API
export const createAlertSound = (frequency = 800, duration = 200) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration / 1000);
};

// Different alert sounds for different severities
export const alertSounds = {
  low: () => createAlertSound(600, 150),
  medium: () => createAlertSound(800, 200),
  high: () => createAlertSound(1000, 300),
  critical: () => {
    // Critical alert: two quick beeps
    createAlertSound(1200, 150);
    setTimeout(() => createAlertSound(1200, 150), 200);
  }
};

export default alertSounds;