let audioCtx, noiseNode, gainNode, filter, lfo, lfoGain;
let savedVolume = localStorage.getItem("volume") || 0.3;

document.getElementById("volume").value = savedVolume;

function createRadioNoise() {
  if (audioCtx) audioCtx.close();

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);

  // --- ホワイトノイズ生成 ---
  for (let i = 0; i < bufferSize; i++) {
    // サンプルレートを落とす（音質を荒く）
    if (i % 2 === 0) {
      output[i] = (Math.random() * 2 - 1) * 0.6;
    } else {
      output[i] = output[i - 1];
    }
  }

  // --- ノード設定 ---
  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = savedVolume;

  // --- バンドパスフィルターでラジオっぽく ---
  filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2000; // 中音域を強調
  filter.Q.value = 1.5;

  // --- AM変調でガサガサ感 ---
  lfo = audioCtx.createOscillator();
  lfo.frequency.value = 6; // 6Hzの揺れ
  lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.5;
  lfo.connect(lfoGain).connect(gainNode.gain);
  lfo.start();

  // --- 電波の不安定さ（音量ランダム揺れ） ---
  setInterval(() => {
    if (gainNode) {
      gainNode.gain.value = savedVolume * (0.7 + Math.random() * 0.6);
    }
  }, 300);

  // --- 接続 ---
  noiseNode.connect(filter).connect(gainNode).connect(audioCtx.destination);
}

document.getElementById("playBtn").onclick = () => {
  if (!audioCtx || audioCtx.state === "closed") {
    createRadioNoise();
    noiseNode.start();
  }
};

document.getElementById("stopBtn").onclick = () => {
  if (noiseNode) noiseNode.stop();
  if (audioCtx) audioCtx.close();
};

document.getElementById("volume").oninput = (e) => {
  if (gainNode) gainNode.gain.value = e.target.value;
  savedVolume = e.target.value;
  localStorage.setItem("volume", e.target.value);
};
