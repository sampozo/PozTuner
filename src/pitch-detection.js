/**
 * Robust Pitch Detection using the YIN algorithm.
 * Optimized for guitar frequencies (approx 70Hz - 400Hz).
 */
export class PitchDetector {
    constructor(sampleRate, bufferSize = 2048) {
        this.sampleRate = sampleRate;
        this.bufferSize = bufferSize;
        this.threshold = 0.15; // Absolute threshold for step 4
        this.difference = new Float32Array(bufferSize / 2);
        this.cumulativeMeanNormalizedDifference = new Float32Array(bufferSize / 2);
    }

    getPitch(buffer) {
        const tauEstimate = this.calculateYin(buffer);
        if (tauEstimate === -1) return -1;

        // Refine tau using parabolic interpolation
        const refinedTau = this.parabolicInterpolation(tauEstimate);
        return this.sampleRate / refinedTau;
    }

    calculateYin(buffer) {
        const halfSize = this.bufferSize / 2;

        // Step 1 & 2: Difference function
        for (let tau = 0; tau < halfSize; tau++) {
            let diff = 0;
            for (let i = 0; i < halfSize; i++) {
                const delta = buffer[i] - buffer[i + tau];
                diff += delta * delta;
            }
            this.difference[tau] = diff;
        }

        // Step 3: Cumulative mean normalized difference function
        this.cumulativeMeanNormalizedDifference[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < halfSize; tau++) {
            runningSum += this.difference[tau];
            this.cumulativeMeanNormalizedDifference[tau] = this.difference[tau] / (runningSum / tau);
        }

        // Step 4: Absolute threshold
        let tau = -1;
        for (let t = 1; t < halfSize; t++) {
            if (this.cumulativeMeanNormalizedDifference[t] < this.threshold) {
                while (t + 1 < halfSize && this.cumulativeMeanNormalizedDifference[t + 1] < this.cumulativeMeanNormalizedDifference[t]) {
                    t++;
                }
                tau = t;
                break;
            }
        }

        // If no tau is below threshold, find the global minimum
        if (tau === -1) {
            let minVal = Infinity;
            for (let t = 1; t < halfSize; t++) {
                if (this.cumulativeMeanNormalizedDifference[t] < minVal) {
                    minVal = this.cumulativeMeanNormalizedDifference[t];
                    tau = t;
                }
            }
            // If the global minimum is still too high, it's probably noise
            if (minVal > 0.4) return -1;
        }

        return tau;
    }

    parabolicInterpolation(tau) {
        const halfSize = this.bufferSize / 2;
        if (tau < 1 || tau >= halfSize - 1) return tau;

        const s0 = this.cumulativeMeanNormalizedDifference[tau - 1];
        const s1 = this.cumulativeMeanNormalizedDifference[tau];
        const s2 = this.cumulativeMeanNormalizedDifference[tau + 1];

        const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        return tau + adjustment;
    }
}
