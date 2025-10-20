// Custom audio UI: builds native <audio> under the hood and provides styled controls
(function(){
  const customBlocks = Array.from(document.querySelectorAll('.custom-audio'));
  if(!customBlocks.length) return;

  let currentAudio = null;

  function formatTime(s){
    if(isNaN(s)) return '0:00';
    const m = Math.floor(s/60); const sec = Math.floor(s%60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  customBlocks.forEach((block, idx)=>{
    const src = block.dataset.src;
    const title = block.dataset.title || '';

    // create native audio element (visually hidden)
    const audio = document.createElement('audio');
    audio.src = src;
    audio.preload = 'none';
    audio.setAttribute('aria-hidden','true');
    audio.style.display = 'none';
    block.appendChild(audio);

      const playBtn = block.querySelector('.audio-play');
      const progressBar = block.querySelector('.audio-progress');
      const filled = progressBar ? progressBar.querySelector('.filled') : null;
      const time = block.querySelector('.audio-time');
      // Defensive: require at least a play button and progress bar container
      if(!playBtn || !progressBar){ return; }

    // Ensure only one plays at a time
    audio.addEventListener('play', ()=>{
      if(currentAudio && currentAudio !== audio){ currentAudio.pause(); }
      currentAudio = audio;
        if(playBtn){ playBtn.textContent = '\u275a\u275a'; playBtn.setAttribute('aria-label','Pausar'); }
    });
    audio.addEventListener('pause', ()=>{
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label','Reproducir');
      if(currentAudio === audio) currentAudio = null;
    });

    // Update progress
    audio.addEventListener('timeupdate', ()=>{
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
        if(filled) filled.style.width = pct + '%';
        if(progressBar) progressBar.setAttribute('aria-valuenow', Math.floor(pct));
        if(time) time.textContent = formatTime(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', ()=>{ time.textContent = formatTime(0); });
    audio.addEventListener('ended', ()=>{ audio.currentTime = 0; audio.pause(); });

    // Play/pause button
    playBtn.addEventListener('click', ()=>{
      if(audio.paused) audio.play(); else audio.pause();
    });

    // Click to seek
    progressBar.addEventListener('click', (e)=>{
      if(!audio.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = pct * audio.duration;
    });

    // Keyboard support
    playBtn.addEventListener('keydown', (e)=>{
      if(e.key === ' ' || e.key === 'Spacebar'){ e.preventDefault(); if(audio.paused) audio.play(); else audio.pause(); }
    });

  });

  // Expose stopAll
  window.audioManager = { stopAll(){ if(currentAudio){ currentAudio.pause(); currentAudio.currentTime = 0; currentAudio=null;} } };

})();
