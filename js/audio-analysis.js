export function bandLevel(frequencies, sampleRate, fftSize, lowHz, highHz) {
  const hzPerBin = sampleRate / fftSize;
  const start = Math.max(0, Math.ceil(lowHz / hzPerBin));
  const end = Math.min(frequencies.length, Math.floor(highHz / hzPerBin) + 1);
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) sum += frequencies[i];
  return sum / ((end - start) * 255);
}

export function rmsLevel(samples) {
  if (!samples.length) return 0;
  const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
  const power = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length;
  return Math.min(1, Math.sqrt(power));
}

// A consistency gate for preview onsets, not a full-song tempo measurement.
export class PreviewTempoEstimator {
  constructor() { this.reset(); }

  reset() {
    this.baseline = 0;
    this.aboveThreshold = false;
    this.lastOnset = null;
    this.intervals = [];
    this.bpm = null;
  }

  update(bass, timestamp) {
    if (this.lastOnset !== null && timestamp - this.lastOnset > 2500) {
      this.reset();
    }
    const threshold = Math.max(0.1, this.baseline * 1.6);
    const rising = bass > threshold && !this.aboveThreshold;
    if (bass < threshold * 0.7) this.aboveThreshold = false;
    if (rising) {
      this.aboveThreshold = true;
      if (this.lastOnset === null) this.lastOnset = timestamp;
      else if (timestamp - this.lastOnset >= 300) {
        const interval = timestamp - this.lastOnset;
        this.lastOnset = timestamp;
        if (interval <= 1200) {
          this.intervals.push(interval);
          if (this.intervals.length > 12) this.intervals.shift();
        } else this.intervals = [];
        this.bpm = null;
        if (this.intervals.length >= 6 && this.intervals.reduce((a, b) => a + b, 0) >= 3000) {
          const sorted = [...this.intervals].sort((a, b) => a - b);
          const median = (sorted[Math.floor((sorted.length - 1) / 2)] + sorted[Math.floor(sorted.length / 2)]) / 2;
          const relativeDeviation = Math.sqrt(this.intervals.reduce((sum, value) => sum + (value - median) ** 2, 0) / this.intervals.length) / median;
          if (relativeDeviation <= 0.12) this.bpm = Math.round(60000 / median);
        }
      }
    }
    this.baseline = this.baseline * 0.97 + bass * 0.03;
    return this.bpm;
  }
}
