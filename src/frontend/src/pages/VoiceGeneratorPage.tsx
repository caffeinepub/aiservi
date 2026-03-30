import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Download, Mic, Square, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function VoiceGeneratorPage() {
  const [text, setText] = useState(
    "Okay\u2026 imagine this is you.\nYou have 10 rupees.\nAb tum bank jaate ho...",
  );
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIndex, setSelectedVoiceIndex] = useState("0");
  const [rate, setRate] = useState(0.9);
  const [pitch, setPitch] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const prevAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    function loadVoices() {
      const all = window.speechSynthesis.getVoices();
      const indian = all.filter(
        (v) => v.lang.includes("en-IN") || v.lang.includes("hi-IN"),
      );
      const finalVoices = indian.length > 0 ? indian : all;
      setVoices(finalVoices);
      setSelectedVoiceIndex("0");
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Revoke old object URL on change
  useEffect(() => {
    const prev = prevAudioUrlRef.current;
    if (prev && prev !== audioUrl) {
      URL.revokeObjectURL(prev);
    }
    prevAudioUrlRef.current = audioUrl;
  }, [audioUrl]);

  const stopRecorder = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleSpeak = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text first");
      return;
    }

    window.speechSynthesis.cancel();
    stopRecorder();

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error(
        "Microphone access denied \u2014 cannot record audio for download.",
      );
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices[Number.parseInt(selectedVoiceIndex)];
      if (voice) utterance.voice = voice;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return;
    }

    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
    };

    recorder.start();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices[Number.parseInt(selectedVoiceIndex)];
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      stopRecorder();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      stopRecorder();
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    stopRecorder();
  };

  const handleDownload = () => {
    if (!audioBlob) {
      toast.error("Play voice first to record it!");
      return;
    }
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "voice.wav";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
          \ud83c\uddee\ud83c\uddf3 Indian Voice Generator
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Uses your browser\u2019s built-in speech synthesis with Indian English
          and Hindi voices.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 space-y-6"
      >
        {/* Text input */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Text to Speak
          </Label>
          <Textarea
            data-ocid="voice.textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your text here... Mix Hindi and English freely!"
            className="bg-input border-border text-foreground min-h-[120px] resize-none text-sm"
          />
        </div>

        {/* Voice selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Voice</Label>
          {voices.length === 0 ? (
            <p className="text-xs text-muted-foreground">Loading voices...</p>
          ) : (
            <Select
              value={selectedVoiceIndex}
              onValueChange={setSelectedVoiceIndex}
            >
              <SelectTrigger
                data-ocid="voice.select"
                className="bg-input border-border text-foreground"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                {voices.map((voice, i) => (
                  <SelectItem
                    key={`${voice.name}-${voice.lang}`}
                    value={String(i)}
                  >
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Speed</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {rate.toFixed(1)}x
            </span>
          </div>
          <Slider
            min={0.7}
            max={1.3}
            step={0.1}
            value={[rate]}
            onValueChange={([v]) => setRate(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slow (0.7x)</span>
            <span>Fast (1.3x)</span>
          </div>
        </div>

        {/* Pitch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-foreground">Pitch</Label>
            <span className="text-xs text-muted-foreground font-mono">
              {pitch.toFixed(1)}
            </span>
          </div>
          <Slider
            min={0.8}
            max={1.5}
            step={0.1}
            value={[pitch]}
            onValueChange={([v]) => setPitch(v)}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Low (0.8)</span>
            <span>High (1.5)</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 pt-2">
          <Button
            data-ocid="voice.primary_button"
            onClick={handleSpeak}
            disabled={isSpeaking}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            {isSpeaking ? (
              <>
                <Volume2 className="w-4 h-4 animate-pulse" />
                Speaking...
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Play
              </>
            )}
          </Button>
          <Button
            data-ocid="voice.secondary_button"
            onClick={handleStop}
            variant="outline"
            className="flex-1 border-border text-foreground gap-2"
            disabled={!isSpeaking}
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
          <Button
            data-ocid="voice.download_button"
            onClick={handleDownload}
            variant="outline"
            className="flex-1 border-border text-foreground gap-2"
            disabled={!audioBlob}
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>

        {/* Audio player */}
        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <Label className="text-sm font-medium text-foreground mb-2 block">
              Recorded Audio
            </Label>
            {/* biome-ignore lint/a11y/useMediaCaption: user-generated speech audio, no caption file available */}
            <audio
              data-ocid="voice.panel"
              controls
              src={audioUrl}
              className="w-full rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Click Download to save as voice.wav
            </p>
          </motion.div>
        )}

        {voices.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            No Indian voices found \u2014 using all available system voices
            instead.
          </p>
        )}
      </motion.div>
    </div>
  );
}
