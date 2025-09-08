const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let whiteNoise1, whiteNoise2, lowBoom, gainNoise, gainBoom;
let bassFilter, midFilter, trebleFilter;
let playing = false;
let clickOn = true;

function createWhiteNoise() {
    const bufferSize = 2 * audioCtx.sampleRate;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    return source;
}

function createLowBoom() {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, audioCtx.currentTime);
    return osc;
}

function playClick() {
    if (!playing || !clickOn) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.02);
    setTimeout(playClick, Math.random() * 2000 + 500);
}

function startVolumeModulation(node) {
    let gainVal = node.gain.value;
    let increasing = true;
    function modulate() {
        if (!playing) return;
        if (increasing) gainVal += 0.001;
        else gainVal -= 0.001;
        if (gainVal > 0.25) increasing = false;
        if (gainVal < 0.15) increasing = true;
        node.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        requestAnimationFrame(modulate);
    }
    modulate();
}

function createEQ() {
    bassFilter = audioCtx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.setValueAtTime(200, audioCtx.currentTime);

    midFilter = audioCtx.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.setValueAtTime(1000, audioCtx.currentTime);
    midFilter.Q.setValueAtTime(1, audioCtx.currentTime);

    trebleFilter = audioCtx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.setValueAtTime(5000, audioCtx.currentTime);
}

document.getElementById('start').onclick = () => {
    if (playing) return;
    playing = true;

    createEQ();

    gainNoise = audioCtx.createGain();
    gainBoom = audioCtx.createGain();
    gainNoise.gain.value = parseFloat(document.getElementById('noiseVolume').value);
    gainBoom.gain.value = parseFloat(document.getElementById('boomVolume').value);

    whiteNoise1 = createWhiteNoise();
    whiteNoise2 = createWhiteNoise();
    lowBoom = createLowBoom();

    whiteNoise1.connect(bassFilter);
    whiteNoise2.connect(bassFilter);
    bassFilter.connect(midFilter);
    midFilter.connect(trebleFilter);
    trebleFilter.connect(gainNoise);
    gainNoise.connect(audioCtx.destination);

    lowBoom.connect(gainBoom);
    gainBoom.connect(audioCtx.destination);

    whiteNoise1.start();
    whiteNoise2.start();
    lowBoom.start();

    startVolumeModulation(gainNoise);
    startVolumeModulation(gainBoom);

    clickOn = document.getElementById('clickToggle').checked;
    playClick();
}

document.getElementById('stop').onclick = () => {
    if (!playing) return;
    whiteNoise1.stop();
    whiteNoise2.stop();
    lowBoom.stop();
    playing = false;
}

document.getElementById('noiseVolume').oninput = e => { if(gainNoise) gainNoise.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime); }
document.getElementById('boomVolume').oninput = e => { if(gainBoom) gainBoom.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime); }
document.getElementById('clickToggle').onchange = e => { clickOn = e.target.checked; }

document.getElementById('bass').oninput = e => { if(bassFilter) bassFilter.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime); }
document.getElementById('mid').oninput = e => { if(midFilter) midFilter.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime); }
document.getElementById('treble').oninput = e => { if(trebleFilter) trebleFilter.gain.setValueAtTime(parseFloat(e.target.value), audioCtx.currentTime); }

const presets = {
    light: { noise: 0.15, boom: 0.1, bass: 0, mid: 0, treble: 0 },
    heavy: { noise: 0.3, boom: 0.15, bass: 0, mid: 5, treble: 10 },
    deep: { noise: 0.2, boom: 0.3, bass: 10, mid: 0, treble: -5 }
};

document.querySelectorAll('.preset').forEach(btn => {
    btn.onclick = () => {
        const p = presets[btn.dataset.name];
        document.getElementById('noiseVolume').value = p.noise;
        document.getElementById('boomVolume').value = p.boom;
        document.getElementById('bass').value = p.bass;
        document.getElementById('mid').value = p.mid;
        document.getElementById('treble').value = p.treble;

        if(gainNoise) gainNoise.gain.setValueAtTime(p.noise, audioCtx.currentTime);
        if(gainBoom) gainBoom.gain.setValueAtTime(p.boom, audioCtx.currentTime);
        if(bassFilter) bassFilter.gain.setValueAtTime(p.bass, audioCtx.currentTime);
        if(midFilter) midFilter.gain.setValueAtTime(p.mid, audioCtx.currentTime);
        if(trebleFilter) trebleFilter.gain.setValueAtTime(p.treble, audioCtx.currentTime);
    }
});
