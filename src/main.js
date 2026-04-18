import { PitchDetector } from './pitch-detection.js';

const tuningsData = {
    standard: { name: "Estándar (E A D G B E)", notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    dropD: { name: "Drop D", notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    openG: { name: "Open G", notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
    dadgad: { name: "DADGAD", notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
    openD: { name: "Open D", notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
    halfStepDown: { name: "Half Step Down", notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
    dropC: { name: "Drop C", notes: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'] },
    openE: { name: "Open E", notes: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'] }
};

const noteFreqs = {
    "C2": 65.41, "C#2": 69.30, "Db2": 69.30, "D2": 73.42, "D#2": 77.78, "Eb2": 77.78, "E2": 82.41, "F2": 87.31, "F#2": 92.50, "Gb2": 92.50, "G2": 98.00, "G#2": 103.83, "Ab2": 103.83, "A2": 110.00, "A#2": 116.54, "Bb2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3": 138.59, "Db3": 138.59, "D3": 146.83, "D#3": 155.56, "Eb3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "Gb3": 185.00, "G3": 196.00, "G#3": 207.65, "Ab3": 207.65, "A3": 220.00, "A#3": 233.08, "Bb3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "Db4": 277.18, "D4": 293.66, "D#4": 311.13, "Eb4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "Gb4": 369.99, "G4": 392.00
};

// State
let audioCtx, analyzer, detector, stream, wakeLock;
let currentTuning = 'standard';
let isRunning = false;

// DOM Elements
const tuningSelect = document.getElementById('tuningSelect');
const stringsBox = document.getElementById('stringsBox');
const startBtn = document.getElementById('startBtn');
const needleGroup = document.getElementById('needleGroup');
const noteNameEl = document.getElementById('noteName');
const centsTextEl = document.getElementById('centsText');
const frequencyEl = document.getElementById('frequency');

function init() {
    // Populate select
    for (let key in tuningsData) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.textContent = tuningsData[key].name;
        tuningSelect.appendChild(opt);
    }

    renderStrings();

    tuningSelect.addEventListener('change', (e) => {
        currentTuning = e.target.value;
        renderStrings();
    });

    startBtn.addEventListener('click', toggleTuner);
}

function renderStrings() {
    stringsBox.innerHTML = '';
    tuningsData[currentTuning].notes.forEach(note => {
        const dot = document.createElement('div');
        dot.className = 'string-dot';
        dot.textContent = note.replace(/\d/, '');
        dot.dataset.note = note;
        stringsBox.appendChild(dot);
    });
}

async function toggleTuner() {
    if (isRunning) {
        stopTuner();
    } else {
        await startTuner();
    }
}

async function startTuner() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        
        const source = audioCtx.createMediaStreamSource(stream);
        analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 4096; // High resolution
        source.connect(analyzer);

        detector = new PitchDetector(audioCtx.sampleRate, 4096);
        
        // Request Wake Lock
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                console.log("Wake Lock activo");
            } catch (err) {
                console.error(`${err.name}, ${err.message}`);
            }
        }

        isRunning = true;
        startBtn.querySelector('.btn-text').textContent = "DETENER";
        startBtn.classList.add('active');

        requestAnimationFrame(update);
    } catch (err) {
        console.error("No se pudo acceder al micrófono:", err);
        alert("Permiso de micrófono denegado o no disponible.");
    }
}

function stopTuner() {
    isRunning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (audioCtx) {
        audioCtx.close();
    }

    if (wakeLock) {
        wakeLock.release().then(() => {
            wakeLock = null;
            console.log("Wake Lock liberado");
        });
    }

    startBtn.querySelector('.btn-text').textContent = "INICIAR AFINADOR";
    startBtn.classList.remove('active');
    
    // Reset UI
    noteNameEl.textContent = "--";
    noteNameEl.style.color = "white";
    centsTextEl.textContent = "0.00 cents";
    frequencyEl.textContent = "0.00 Hz";
    needleGroup.style.transform = `rotate(0deg)`;
    document.querySelectorAll('.string-dot').forEach(d => d.classList.remove('string-active'));
}

const buffer = new Float32Array(4096);

function update() {
    if (!isRunning) return;

    analyzer.getFloatTimeDomainData(buffer);
    const pitch = detector.getPitch(buffer);

    if (pitch > 0 && pitch < 1000) {
        frequencyEl.textContent = `${pitch.toFixed(2)} Hz`;

        // Find closest note in current tuning
        const notes = tuningsData[currentTuning].notes;
        let closest = notes[0];
        let minDiff = Math.abs(pitch - noteFreqs[notes[0]]);

        notes.forEach(n => {
            const d = Math.abs(pitch - noteFreqs[n]);
            if (d < minDiff) {
                minDiff = d;
                closest = n;
            }
        });

        // Calculate cents
        const targetFreq = noteFreqs[closest];
        const cents = 1200 * Math.log2(pitch / targetFreq);
        
        // Update UI
        centsTextEl.textContent = `${cents > 0 ? '+' : ''}${cents.toFixed(1)} cents`;
        
        // Needle rotation (map -50/50 cents to -60/60 degrees)
        const angle = Math.max(-60, Math.min(60, cents * 1.2));
        needleGroup.style.transform = `rotate(${angle}deg)`;

        // Visual feedback
        const isTuned = Math.abs(cents) < 5;
        noteNameEl.textContent = closest.replace(/\d/, '');
        noteNameEl.style.color = isTuned ? 'var(--accent)' : 'white';
        
        const needleLine = needleGroup.querySelector('.needle');
        if (isTuned) {
            needleLine.classList.add('needle-tuned');
        } else {
            needleLine.classList.remove('needle-tuned');
        }

        // Update dot
        document.querySelectorAll('.string-dot').forEach(dot => {
            if (dot.dataset.note === closest) {
                dot.classList.add('string-active');
            } else {
                dot.classList.remove('string-active');
            }
        });

    }

    requestAnimationFrame(update);
}

// Start everything
init();
