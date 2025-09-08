let audioCtx, noiseNode, gainNode;
let currentPreset = localStorage.getItem("preset") || "radio";
let savedVolume = localStorage.getItem("volume") || 0.3;

document.getElementById("volume").value = savedVolume;

function createNoise(type = "radio") {
  if (audioCtx) audioCtx.close();

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const bufferSize = 2 * audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    if (type === "radio") {
      output[i] = (Math.random() * 2 - 1) * 0.6; // ラジカセ風ノイズ
    } else if (type === "cafe") {
      output[i] = (Math.random() * 2 - 1) * 0.3 + Math.sin(i / 50) * 0.02; // カフェ雑音風
    } else {
      output[i] = Math.random() * 2 - 1; // ホワイトノイズ
    }
  }

  noiseNode = audioCtx.createBufferSource();
  noiseNode.buffer = buffer;
  noiseNode.loop = true;

  gainNode = audioCtx.createGain();
  gainNode.gain.value = savedVolume;

  noiseNode.connect(gainNode).connect(audioCtx.destination);
}

document.getElementById("playBtn").onclick = () => {
  if (!audioCtx || audioCtx.state === "closed") {
    createNoise(currentPreset);
    noiseNode.start();
  }
};

document.getElementById("stopBtn").onclick = () => {
  if (noiseNode) noiseNode.stop();
  if (audioCtx) audioCtx.close();
};

document.getElementById("volume").oninput = (e) => {
  if (gainNode) gainNode.gain.value = e.target.value;
  localStorage.setItem("volume", e.target.value);
};

document.querySelectorAll(".preset").forEach(btn => {
  btn.onclick = () => {
    currentPreset = btn.dataset.type;
    localStorage.setItem("preset", currentPreset);
    if (audioCtx && audioCtx.state !== "closed") {
      noiseNode.stop();
      createNoise(currentPreset);
      noiseNode.start();
    }
  };
});
