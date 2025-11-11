export default class MediaManager {
  
  constructor( contextConfig ) {

    this.mediaRegistry    = contextConfig.mediaRegistry;
    this.sounds           = new Map(); // Cache loaded sounds
    this.currentlyPlaying = new Map(); // Track playing sounds
    this.initializeSounds();
  }


   /* Initialization
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  initializeSounds() {
    if (!this.mediaRegistry?.sounds) return;
    
    // Pre-register all sounds from registry
    for (const [soundId, soundConfig] of Object.entries(this.mediaRegistry.sounds)) {
      const soundPath = soundConfig.path || `/sounds/${soundId}.mp3`;
      const volume = soundConfig.volume ?? 1.0;
      const loop = soundConfig.loop ?? false;
      
      this.sounds.set(soundId, {
        path: soundPath,
        volume,
        loop,
        audio: null // Will be lazy-loaded
      });
    }
  }

  /* Sound Playback
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  playSound(soundId, options = {}) {
    const soundData = this.sounds.get(soundId);
    
    if (!soundData) {
      console.warn(`[MediaManager] Sound "${soundId}" not found in registry`);
      return null;
    }

    // Create or reuse Audio instance
    const audio = new Audio(soundData.path);
    audio.volume = options.volume ?? soundData.volume;
    audio.loop = options.loop ?? soundData.loop;

    // Play the sound
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Track currently playing
          this.currentlyPlaying.set(soundId, audio);
        })
        .catch(error => {
          console.error(`[MediaManager] Failed to play sound "${soundId}":`, error);
        });
    }

    // Cleanup when sound ends
    audio.addEventListener('ended', () => {
      if (!audio.loop) {
        this.currentlyPlaying.delete(soundId);
      }
    });

    return audio; // Return audio instance for direct control
  }

  stopSound(soundId) {
    const audio = this.currentlyPlaying.get(soundId);
    
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.currentlyPlaying.delete(soundId);
    }
  }

  stopAllSounds() {
    for (const audio of this.currentlyPlaying.values()) {
      audio.pause();
      audio.currentTime = 0;
    }
    this.currentlyPlaying.clear();
  }

  pauseSound(soundId) {
    const audio = this.currentlyPlaying.get(soundId);
    if (audio) {
      audio.pause();
    }
  }

  resumeSound(soundId) {
    const audio = this.currentlyPlaying.get(soundId);
    if (audio) {
      audio.play();
    }
  }

  setVolume(soundId, volume) {
    const audio = this.currentlyPlaying.get(soundId);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume)); // Clamp 0-1
    }
  }

  setGlobalVolume(volume) {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    for (const audio of this.currentlyPlaying.values()) {
      audio.volume = clampedVolume;
    }
  }

  /* Image Loading (for future)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  imgSrc( imageId ) {
    return this.getImagePath(imageId);
  }

  getImagePath(imageId) {
    const imageConfig = this.mediaRegistry?.images?.[imageId];
    if (!imageConfig) {
      console.warn(`[MediaManager] Image "${imageId}" not found in registry`);
      return null;
    }
    return imageConfig.path || `/images/${imageId}.png`;
  }

}