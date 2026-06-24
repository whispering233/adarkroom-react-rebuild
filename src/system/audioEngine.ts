/**
 * AudioEngine — Minimal Web Audio API wrapper
 *
 * Supports: init, playSound (one-shot), setVolume, toggle mute, scene-driven BGM.
 * Files load lazily on first play via fetch + decodeAudioData.
 * Mute state persisted in localStorage key 'adr-audio'.
 */

// ─── 常量 ─────────────────────────────────────────────────

const AUDIO_KEY = 'adr-audio'

// ─── 类型 ─────────────────────────────────────────────────

type AudioBufferCache = Map<string, AudioBuffer>

// ─── 内部状态 ─────────────────────────────────────────────

let audioCtx: AudioContext | null = null
let masterGain: GainNode | null = null
let bufferCache: AudioBufferCache = new Map()
let _muted = false
let _bgmSource: AudioBufferSourceNode | null = null
let _bgmGain: GainNode | null = null
let _bgmUrl: string | null = null

// 模块加载时从 localStorage 恢复静音状态
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(AUDIO_KEY)
  _muted = stored === 'muted'
}

// ─── 初始化 ───────────────────────────────────────────────

/** 初始化 AudioContext（必须由用户交互触发） */
export function initAudio(): void {
  if (audioCtx) return
  try {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.connect(audioCtx.destination)
    masterGain.gain.value = _muted ? 0 : 1
  } catch {
    // Web Audio not supported — silently degrade
  }
}

/** 确保 AudioContext 处于 running 状态（处理 autoplay policy） */
export function resumeAudio(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { /* ignore */ })
  }
}

// ─── 内部辅助 ─────────────────────────────────────────────

/** 加载并缓存音频文件 */
async function loadBuffer(url: string): Promise<AudioBuffer | null> {
  if (!audioCtx) return null
  const cached = bufferCache.get(url)
  if (cached) return cached

  try {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
    bufferCache.set(url, audioBuffer)
    return audioBuffer
  } catch {
    return null
  }
}

// ─── 音效播放 ─────────────────────────────────────────────

/** 播放一次性音效 */
export async function playSound(url: string, volume = 1): Promise<void> {
  if (!audioCtx || !masterGain || _muted) return
  await resumeAudio()
  const buffer = await loadBuffer(url)
  if (!buffer) return

  const source = audioCtx.createBufferSource()
  source.buffer = buffer
  const gain = audioCtx.createGain()
  gain.gain.value = volume
  source.connect(gain)
  gain.connect(masterGain)
  source.start()
}

// ─── 背景音乐 ─────────────────────────────────────────────

/** 播放背景音乐（循环） */
export async function playBGM(url: string, volume = 0.5): Promise<void> {
  if (!audioCtx || !masterGain || _muted) return
  await resumeAudio()

  // 如果已有同 URL 的 BGM 在播放，不做任何事
  if (_bgmUrl === url && _bgmSource) return

  stopBGM()

  const buffer = await loadBuffer(url)
  if (!buffer) return

  _bgmUrl = url
  _bgmGain = audioCtx.createGain()
  _bgmGain.gain.value = volume
  _bgmGain.connect(masterGain)

  _bgmSource = audioCtx.createBufferSource()
  _bgmSource.buffer = buffer
  _bgmSource.loop = true
  _bgmSource.connect(_bgmGain)
  _bgmSource.start()
}

/** 停止背景音乐 */
export function stopBGM(): void {
  if (_bgmSource) {
    try { _bgmSource.stop() } catch { /* already stopped */ }
    _bgmSource.disconnect()
    _bgmSource = null
  }
  if (_bgmGain) {
    _bgmGain.disconnect()
    _bgmGain = null
  }
  _bgmUrl = null
}

// ─── 音量控制 ─────────────────────────────────────────────

/** 设置主音量（0-1） */
export function setVolume(vol: number): void {
  if (masterGain) {
    masterGain.gain.value = vol
  }
}

/** 切换静音，返回当前静音状态 */
export function toggleMute(): boolean {
  _muted = !_muted
  setVolume(_muted ? 0 : 1)

  if (_muted) {
    stopBGM()
  }

  // 持久化
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUDIO_KEY, _muted ? 'muted' : 'unmuted')
  }

  return _muted
}

/** 当前是否静音 */
export function isMuted(): boolean {
  return _muted
}

/** 设置静音状态（不切换） */
export function setMuted(muted: boolean): void {
  if (_muted === muted) return
  _muted = muted
  setVolume(_muted ? 0 : 1)
  if (_muted) stopBGM()
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUDIO_KEY, _muted ? 'muted' : 'unmuted')
  }
}
