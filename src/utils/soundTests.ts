// Test functions for sound system
// Run in browser console to test all sounds

import { 
  initSoundOnUserGesture, 
  playMove, 
  playMerge, 
  playDenied, 
  playGameOver, 
  setMuted, 
  isMuted, 
  setVolume, 
  getVolume 
} from './sound';

/**
 * Test all sound effects
 * Run in console: window.testSounds()
 */
export const testSounds = () => {
  console.log('🎵 Testing Sound System...\n');
  
  // Initialize sound
  initSoundOnUserGesture();
  setMuted(false);
  setVolume(0.8);
  
  console.log('Testing sounds in sequence:');
  
  setTimeout(() => {
    console.log('1. Playing Move sound...');
    playMove();
  }, 500);
  
  setTimeout(() => {
    console.log('2. Playing Merge sound...');
    playMerge();
  }, 1500);
  
  setTimeout(() => {
    console.log('3. Playing Denied sound...');
    playDenied();
  }, 2500);
  
  setTimeout(() => {
    console.log('4. Playing Game Over sound...');
    playGameOver();
  }, 3500);
  
  setTimeout(() => {
    console.log('✅ Sound test complete!');
    console.log(`Muted: ${isMuted()}, Volume: ${getVolume()}`);
  }, 5000);
};

/**
 * Test volume levels
 */
export const testVolumes = () => {
  console.log('🔊 Testing Volume Levels...\n');
  
  initSoundOnUserGesture();
  setMuted(false);
  
  const volumes = [0.2, 0.4, 0.6, 0.8, 1.0];
  
  volumes.forEach((vol, index) => {
    setTimeout(() => {
      setVolume(vol);
      console.log(`Volume: ${vol}`);
      playMerge();
    }, index * 1000);
  });
  
  setTimeout(() => {
    setVolume(0.6); // Reset to default
    console.log('✅ Volume test complete! Reset to 0.6');
  }, volumes.length * 1000);
};

/**
 * Test mute functionality
 */
export const testMute = () => {
  console.log('🔇 Testing Mute Functionality...\n');
  
  initSoundOnUserGesture();
  setVolume(0.8);
  
  console.log('Playing sound while unmuted...');
  setMuted(false);
  playMerge();
  
  setTimeout(() => {
    console.log('Playing sound while muted (should be silent)...');
    setMuted(true);
    playMerge();
  }, 1500);
  
  setTimeout(() => {
    console.log('Playing sound while unmuted again...');
    setMuted(false);
    playMerge();
  }, 3000);
  
  setTimeout(() => {
    console.log('✅ Mute test complete!');
  }, 4500);
};

// Make test functions available globally
if (typeof window !== 'undefined') {
  (window as any).testSounds = testSounds;
  (window as any).testVolumes = testVolumes;
  (window as any).testMute = testMute;
  
  console.log('🎵 Sound test functions loaded! Run in console:');
  console.log('  window.testSounds()    - Test all sound effects');
  console.log('  window.testVolumes()   - Test volume levels');
  console.log('  window.testMute()      - Test mute functionality');
}