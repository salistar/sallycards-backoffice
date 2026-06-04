# -*- coding: utf-8 -*-
"""
gen-game-sounds.py — Generate 6 royalty-free game sounds via sinewave synthesis.

Outputs WAV files (expo-av supports WAV natively):
  - flip.wav    : card flip "swoosh" — 200Hz→600Hz sweep, 80ms
  - click.wav   : UI tap click — 1200Hz blip, 30ms
  - win.wav     : victory chime — C-major chord arpeggio, 800ms
  - lose.wav    : defeat tone — descending minor, 600ms
  - shuffle.wav : multi-flip burst — 6×swoosh staggered, 600ms
  - tick.wav    : timer tick — 800Hz blip, 50ms

Copies to assets/sounds/ in all 11 apps.
"""
import wave
import struct
import math
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']
SAMPLE_RATE = 22050  # 22.05kHz sufficient for game SFX, halves file size


def envelope(t, total, attack=0.02, release=0.2):
    """Cosine envelope to avoid clicks at edges."""
    if t < attack:
        return t / attack
    if t > total - release:
        return max(0.0, (total - t) / release)
    return 1.0


def synth(samples, fn, *, gain=0.5):
    """Apply fn(t) over `samples` count, returns int16 buffer."""
    buf = bytearray()
    total_t = samples / SAMPLE_RATE
    for i in range(samples):
        t = i / SAMPLE_RATE
        amp = envelope(t, total_t) * gain * fn(t)
        v = int(max(-1.0, min(1.0, amp)) * 32767)
        buf += struct.pack('<h', v)
    return bytes(buf)


def write_wav(path, audio_bytes):
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        f.writeframes(audio_bytes)


def flip_sound():
    """Card flip: short pitch sweep 200→600Hz with noise."""
    dur = 0.08
    samples = int(dur * SAMPLE_RATE)
    return synth(samples, lambda t: math.sin(2*math.pi*(200 + 5000*t)*t) * 0.7
                                     + (math.sin(2*math.pi*1500*t) * 0.3),
                 gain=0.4)


def click_sound():
    """UI click: short 1200Hz blip."""
    dur = 0.03
    samples = int(dur * SAMPLE_RATE)
    return synth(samples, lambda t: math.sin(2*math.pi*1200*t), gain=0.5)


def win_sound():
    """Victory: C-major arpeggio C5→E5→G5→C6."""
    notes = [(523, 0.15), (659, 0.15), (784, 0.15), (1047, 0.35)]
    audio = b''
    for freq, dur in notes:
        samples = int(dur * SAMPLE_RATE)
        audio += synth(samples, lambda t, f=freq: math.sin(2*math.pi*f*t)
                                                + math.sin(2*math.pi*f*2*t) * 0.3,
                       gain=0.5)
    return audio


def lose_sound():
    """Defeat: descending minor cadence A4→F4→D4."""
    notes = [(440, 0.2), (349, 0.2), (294, 0.4)]
    audio = b''
    for freq, dur in notes:
        samples = int(dur * SAMPLE_RATE)
        audio += synth(samples, lambda t, f=freq: math.sin(2*math.pi*f*t)
                                                * (1 - t/dur*0.3),
                       gain=0.4)
    return audio


def shuffle_sound():
    """Shuffle: 6 staggered swooshes."""
    audio = b''
    for i in range(6):
        # Each swoosh is 80ms
        dur = 0.08
        samples = int(dur * SAMPLE_RATE)
        base_freq = 200 + (i % 3) * 80
        audio += synth(samples, lambda t, f=base_freq: math.sin(2*math.pi*(f + 4000*t)*t) * 0.6
                                                       + math.sin(2*math.pi*1500*t) * 0.2,
                       gain=0.35)
        # Small gap 20ms between swooshes
        audio += b'\x00\x00' * int(0.02 * SAMPLE_RATE)
    return audio


def tick_sound():
    """Timer tick: 800Hz short blip."""
    dur = 0.05
    samples = int(dur * SAMPLE_RATE)
    return synth(samples, lambda t: math.sin(2*math.pi*800*t), gain=0.5)


def main():
    # Generate sounds once
    sounds = {
        'flip.wav':    flip_sound(),
        'click.wav':   click_sound(),
        'win.wav':     win_sound(),
        'lose.wav':    lose_sound(),
        'shuffle.wav': shuffle_sound(),
        'tick.wav':    tick_sound(),
    }
    # Write to a master location + mirror to each app
    master_dir = ROOT / "tools" / "generated-sounds"
    master_dir.mkdir(parents=True, exist_ok=True)
    for name, data in sounds.items():
        write_wav(master_dir / name, data)
        print(f"  Master: {name} ({len(data)//1024}KB)")

    # Copy to each app's assets/sounds/
    for app in APPS:
        for parent in [ROOT / "apps" / "mobile" / app, ROOT / "apps-deploy" / f"sally-{app}"]:
            target = parent / "assets" / "sounds"
            if parent.exists():
                target.mkdir(parents=True, exist_ok=True)
                for name, data in sounds.items():
                    (target / name).write_bytes(data)
        print(f"  OK {app}: 6 sounds installed")

    print(f"\nDONE — {len(sounds)} sounds × {len(APPS)} apps")


if __name__ == "__main__":
    main()
