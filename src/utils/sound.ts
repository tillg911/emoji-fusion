/**
 * ZzFX - Procedural Audio System for Emoji Fusion
 * Refactored and simplified version with working sounds
 */

// Global AudioContext
let audioCtx: AudioContext | null = null;
let isInitialized = false;
let isAutoInitSetup = false;

// Configuration
const STORAGE_KEY = 'emojiFusion:sound';
const DEFAULT_VOLUME = 0.2;

// ZzFX core function - simplified and working
const zzfx = (
  volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0,
  release = 0.1, shape = 0, shapeCurve = 1, slide = 0, _deltaSlide = 0,
  pitchJump = 0, pitchJumpTime = 0, _repeatTime = 0, noise = 0, modulation = 0,
  bitCrush = 0, _delay = 0, sustainVolume = 1, _decay = 0, tremolo = 0
): AudioBufferSourceNode | undefined => {
  
  if (!audioCtx || !isInitialized) return;
  
  try {
    // Initialize parameters
    let b, f, i, r, t, z;
    
    // Calculate lengths and rates
    let length = 44100 * (attack + sustain + release + 0.15);
    let attackLength = attack * 44100;
    let sustainLength = sustain * 44100;
    let releaseLength = release * 44100;
    let releaseStart = attackLength + sustainLength;
    
    // Create audio buffer
    b = audioCtx.createBuffer(1, length | 0, 44100);
    f = b.getChannelData(0);
    
    // Generate waveform
    for (i = r = t = z = 0; i < length; f[i++] = z) {
      // Calculate time-based parameters
      let timeRatio = i / length;
      let attackRatio = i < attackLength ? i / attackLength : 0;
      let releaseRatio = i >= releaseStart ? (length - i) / releaseLength : 0;
      
      // Calculate envelope
      let envelope = i < attackLength ? attackRatio :
                    i < releaseStart ? sustainVolume :
                    releaseRatio;
      
      // Calculate frequency with slide
      let currentFreq = frequency + slide * timeRatio;
      
      // Add pitch jump
      if (pitchJump && pitchJumpTime && i > pitchJumpTime * 44100) {
        currentFreq += pitchJump;
      }
      
      // Calculate phase
      r += currentFreq * Math.PI * 2 / 44100;
      
      // Generate base waveform
      t = shape < 0.5 ? 
          Math.sin(r) : 
          shape < 1.5 ? 
          (r % (Math.PI * 2) > Math.PI ? -1 : 1) :
          ((r * 2) % (Math.PI * 2) - Math.PI) / Math.PI;
      
      // Apply shape curve
      if (shapeCurve !== 1) {
        t = Math.sign(t) * Math.pow(Math.abs(t), shapeCurve);
      }
      
      // Add noise
      if (noise) {
        t += (Math.random() * 2 - 1) * noise;
      }
      
      // Apply modulation
      if (modulation) {
        t *= 1 + Math.sin(i * modulation * Math.PI * 2 / 44100) * 0.5;
      }
      
      // Apply tremolo
      if (tremolo) {
        t *= 1 + Math.sin(i * tremolo * Math.PI * 2 / 44100) * 0.3;
      }
      
      // Apply bit crush
      if (bitCrush) {
        t = Math.round(t * bitCrush) / bitCrush;
      }
      
      // Apply envelope and volume
      z = t * envelope * volume;
      
      // Add randomness
      if (randomness) {
        z *= 1 + (Math.random() - 0.5) * randomness;
      }
      
      // Clamp output
      z = Math.max(-1, Math.min(1, z));
    }
    
    // Create and play audio source
    let source = audioCtx.createBufferSource();
    source.buffer = b;
    source.connect(audioCtx.destination);
    source.start();
    
    return source;
    
  } catch (error) {
    console.warn('ZzFX playback error:', error);
    return undefined;
  }
};

// State
let muted = false;
let volume = DEFAULT_VOLUME;

/**
 * Load sound settings from localStorage
 */
const loadSoundSettings = (): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      muted = settings.muted === true;
      volume = typeof settings.volume === 'number' && settings.volume >= 0 && settings.volume <= 1 
        ? settings.volume 
        : DEFAULT_VOLUME;
    }
  } catch (error) {
    console.warn('Failed to load sound settings:', error);
    muted = false;
    volume = DEFAULT_VOLUME;
  }
};

/**
 * Setup auto-initialization on first user interaction
 */
const setupAutoInit = (): void => {
  if (isAutoInitSetup || typeof window === 'undefined') return;
  
  isAutoInitSetup = true;
  
  // Events that indicate user interaction
  const events = ['click', 'touchstart', 'touchend', 'keydown', 'keyup', 'mousedown'];
  
  const autoInitHandler = () => {
    if (!isInitialized) {
      initSoundOnUserGesture();
    }
    
    // Remove all listeners after first initialization
    events.forEach(event => {
      document.removeEventListener(event, autoInitHandler, true);
    });
  };
  
  // Add listeners with capture=true to ensure we catch the first interaction
  events.forEach(event => {
    document.addEventListener(event, autoInitHandler, true);
  });
  
  console.log('🎵 Auto-initialization setup complete - sound will activate on first user interaction');
};

/**
 * Save sound settings to localStorage
 */
const saveSoundSettings = (): void => {
  try {
    const settings = { muted, volume };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save sound settings:', error);
  }
};

/**
 * Initialize sound system on app load (loads settings, sets up auto-init)
 */
export const initSoundSystem = (): void => {
  // Load settings immediately
  loadSoundSettings();
  
  // Setup auto-initialization for when user first interacts
  setupAutoInit();
  
  console.log('🎵 Sound system ready - settings loaded, auto-init configured');
};

/**
 * Initialize sound system on first user gesture
 */
export const initSoundOnUserGesture = (): void => {
  if (isInitialized) return;
  
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        console.log('🎵 Audio context resumed');
      }).catch(error => {
        console.warn('Failed to resume audio context:', error);
      });
    }
    
    isInitialized = true;
    console.log('🎵 Sound system initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize audio context:', error);
    isInitialized = false;
  }
};

/**
 * Set muted state
 */
export const setMuted = (shouldMute: boolean): void => {
  muted = shouldMute;
  saveSoundSettings();
};

/**
 * Get muted state
 */
export const isMuted = (): boolean => {
  return muted;
};

/**
 * Set volume (0.0 to 1.0)
 */
export const setVolume = (level: number): void => {
  volume = Math.max(0, Math.min(1, level));
  saveSoundSettings();
};

/**
 * Get current volume
 */
export const getVolume = (): number => {
  return volume;
};

/**
 * Check if sound system is ready (settings loaded)
 */
export const isSoundSystemReady = (): boolean => {
  return isAutoInitSetup;
};

/**
 * Play a sound if conditions are met
 */
const playSound = (soundFn: () => AudioBufferSourceNode | undefined): void => {
  if (!isInitialized || !audioCtx || muted || volume <= 0) {
    return;
  }
  
  try {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (audioCtx.state === 'running') {
      soundFn();
    }
  } catch (error) {
    console.warn('Failed to play sound:', error);
  }
};

// SOUND FUNCTIONS - Using your exact parameters but with correct ZzFX order

/**
 * Play move sound (tiles moving) – sehr leiser, kurzer Tick (weich)
 */
export const playMove = (): void => {
  playSound(() => zzfx(0.06 * volume, 0, 420, 0.002, 0.015, 0.08, 0, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0));
};

/**
 * Play merge sound (tiles merging) – weiches Pop mit mini Pitch-Rise
 */
export const playMerge = (): void => {
  playSound(() => zzfx(0.08 * volume, 0, 360, 0.004, 0.028, 0.12, 0, 1.1, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0.85, 0, 0));
};

/**
 * Play denied sound (invalid move) – sehr leises, dumpfes Thud
 */
export const playDenied = (): void => {
  playSound(() => zzfx(0.05 * volume, 0, 140, 0.002, 0.012, 0.085, 0, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0));
};

/**
 * Play game over sound – sanfter Downfall, warm
 */
export const playGameOver = (): void => {
  playSound(() => zzfx(0.10 * volume, 0, 220, 0.01, 0.06, 0.45, 0, 1, -220, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0, 0));
};

/**
 * Play button click (UI) – sehr dezenter Tap
 */
export const playButtonClick = (): void => {
  playSound(() => zzfx(0.04 * volume, 0, 320, 0.001, 0.008, 0.05, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0));
};

/**
 * Play new game – leiser Start-Ping mit mini Rise (zweistufig)
 */
export const playNewGame = (): void => {
  playSound(() => zzfx(0.07 * volume, 0, 520, 0.003, 0.02, 0.14, 0, 1.1, 140, 0, 120, 0.04, 0, 0, 0, 0, 0, 0.8, 0, 0));
};

/**
 * Play resume game – warmes, sehr kurzes Tap
 */
export const playResumeGame = (): void => {
  playSound(() => zzfx(0.06 * volume, 0, 340, 0.002, 0.015, 0.10, 0, 1, 60, 0, 0, 0, 0, 0, 0, 0, 0, 0.75, 0, 0));
};

/**
 * Play undo – sanfter "rewind" (kurz abwärts, dann mini Anstieg)
 */
export const playUndo = (): void => {
  playSound(() => zzfx(0.06 * volume, 0, 260, 0.003, 0.02, 0.14, 0, 1, -120, 0, 120, 0.04, 0, 0, 0, 0, 0, 0.75, 0, 0));
};

/**
 * Play top-100 – sanfte, kleine Fanfare (ein Ton mit weichem Up-Glide + leichtes Vibrato)
 */
export const playTop100 = (): void => {
  playSound(() => zzfx(0.09 * volume, 0, 440, 0.005, 0.05, 0.25, 0, 1, 220, 0, 0, 0, 0, 0, 5, 0, 0, 0.8, 0, 0));
};

// TEST FUNCTIONS

/**
 * Test all game sounds
 */
export const testSounds = (): void => {
  if (!isInitialized) {
    initSoundOnUserGesture();
    setTimeout(testSounds, 100);
    return;
  }
  
  console.log('🎵 Testing game sounds...');
  setMuted(false);
  setVolume(0.5);
  
  const sounds = [
    { name: 'Move', fn: playMove, delay: 0 },
    { name: 'Merge', fn: playMerge, delay: 600 },
    { name: 'Denied', fn: playDenied, delay: 1200 },
    { name: 'Game Over', fn: playGameOver, delay: 1800 }
  ];
  
  sounds.forEach(({ name, fn, delay }) => {
    setTimeout(() => {
      console.log(`🔊 ${name}`);
      fn();
    }, delay);
  });
};

/**
 * Test UI sounds
 */
export const testUISounds = (): void => {
  if (!isInitialized) {
    initSoundOnUserGesture();
    setTimeout(testUISounds, 100);
    return;
  }
  
  console.log('🎵 Testing UI sounds...');
  setMuted(false);
  setVolume(0.5);
  
  const sounds = [
    { name: 'Button Click', fn: playButtonClick, delay: 0 },
    { name: 'New Game', fn: playNewGame, delay: 400 },
    { name: 'Resume Game', fn: playResumeGame, delay: 800 },
    { name: 'Undo', fn: playUndo, delay: 1200 },
    { name: 'Top 100', fn: playTop100, delay: 1600 }
  ];
  
  sounds.forEach(({ name, fn, delay }) => {
    setTimeout(() => {
      console.log(`🔊 ${name}`);
      fn();
    }, delay);
  });
};

// Make functions available globally
if (typeof window !== 'undefined') {
  (window as any).testSounds = testSounds;
  (window as any).testUISounds = testUISounds;
  console.log('🎵 Sound system loaded! Test: window.testSounds() or window.testUISounds()');
}