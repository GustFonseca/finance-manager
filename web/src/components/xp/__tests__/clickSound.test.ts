type Played = typeof import('../sound/clickSound');

function param() {
  return { value: 0, setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() };
}

type Param = ReturnType<typeof param>;
type AudioNodeFake<T> = { connect: jest.Mock } & T;

function node<T extends object>(extra: T): AudioNodeFake<T> {
  const self = { connect: jest.fn(), ...extra };
  self.connect.mockImplementation((target: unknown) => target);
  return self;
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state = 'suspended';
  currentTime = 2;
  sampleRate = 1000;
  destination = { id: 'destination' };
  resume = jest.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  gains: AudioNodeFake<{ gain: Param }>[] = [];
  oscillators: AudioNodeFake<{ type: string; frequency: Param; start: jest.Mock; stop: jest.Mock }>[] = [];
  sources: AudioNodeFake<{ buffer: unknown; start: jest.Mock }>[] = [];
  filters: AudioNodeFake<{ type: string; frequency: Param; Q: Param }>[] = [];
  buffers: { getChannelData: jest.Mock; data: Float32Array }[] = [];

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createGain() {
    const gain = node({ gain: param() });
    this.gains.push(gain);
    return gain;
  }

  createOscillator() {
    const osc = node({ type: '', frequency: param(), start: jest.fn(), stop: jest.fn() });
    this.oscillators.push(osc);
    return osc;
  }

  createBuffer(_channels: number, length: number) {
    const data = new Float32Array(length);
    const buffer = { data, getChannelData: jest.fn(() => data) };
    this.buffers.push(buffer);
    return buffer;
  }

  createBufferSource() {
    const source = node({ buffer: null as unknown, start: jest.fn() });
    this.sources.push(source);
    return source;
  }

  createBiquadFilter() {
    const filter = node({ type: '', frequency: param(), Q: param() });
    this.filters.push(filter);
    return filter;
  }
}

function load(): Played {
  let mod: Played | undefined;
  jest.isolateModules(() => {
    mod = require('../sound/clickSound');
  });
  return mod as Played;
}

describe('playClick', () => {
  const win = window as unknown as { AudioContext?: unknown };

  beforeEach(() => {
    FakeAudioContext.instances = [];
  });

  afterEach(() => {
    delete win.AudioContext;
  });

  it('does nothing without Web Audio support', () => {
    delete win.AudioContext;
    expect(() => load().playClick(0.5)).not.toThrow();
  });

  it('does not build a sound when the level is zero', () => {
    win.AudioContext = FakeAudioContext;
    load().playClick(0);
    const [ctx] = FakeAudioContext.instances;
    expect(ctx.resume).toHaveBeenCalled();
    expect(ctx.gains).toHaveLength(0);
  });

  it('synthesizes a click and reuses the audio context', () => {
    win.AudioContext = FakeAudioContext;
    const { playClick } = load();
    playClick(0.4);

    expect(FakeAudioContext.instances).toHaveLength(1);
    const [ctx] = FakeAudioContext.instances;
    const [output, toneGain] = ctx.gains;
    expect(output.gain.value).toBe(0.4);
    expect(output.connect).toHaveBeenCalledWith(ctx.destination);

    const [tone] = ctx.oscillators;
    expect(tone.type).toBe('triangle');
    expect(tone.frequency.setValueAtTime).toHaveBeenCalledWith(1900, 2);
    expect(tone.connect).toHaveBeenCalledWith(toneGain);
    expect(toneGain.connect).toHaveBeenCalledWith(output);
    expect(tone.start).toHaveBeenCalledWith(2);
    expect(tone.stop).toHaveBeenCalledWith(2.05);

    const [buffer] = ctx.buffers;
    expect(buffer.data).toHaveLength(20);
    expect(Array.from(buffer.data).every((sample) => Math.abs(sample) <= 1)).toBe(true);
    const [noise] = ctx.sources;
    const [band] = ctx.filters;
    expect(noise.buffer).toBe(buffer);
    expect(band.type).toBe('bandpass');
    expect(band.frequency.value).toBe(3000);
    expect(band.Q.value).toBe(1.2);
    expect(noise.connect).toHaveBeenCalledWith(band);
    expect(band.connect).toHaveBeenCalledWith(output);
    expect(noise.start).toHaveBeenCalledWith(2);

    playClick(0.4);
    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(ctx.gains).toHaveLength(4);
  });
});
