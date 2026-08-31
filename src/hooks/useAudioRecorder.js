import { useCallback, useEffect, useRef, useState } from 'react';

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

const pickMimeType = () => {
  if (typeof MediaRecorder === 'undefined') {
    return '';
  }
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) || '';
};

const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState(null);
  const [localBlob, setLocalBlob] = useState(null);
  const [mediaStream, setMediaStream] = useState(null);

  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const accumulatedMsRef = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopTracks = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  const resetRecorder = useCallback(() => {
    clearTimer();
    stopTracks();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    startedAtRef.current = 0;
    accumulatedMsRef.current = 0;
    setIsRecording(false);
    setIsPaused(false);
    setDurationMs(0);
    setLocalBlob(null);
    setError(null);
    setMediaStream(null);
  }, [clearTimer, stopTracks]);

  const startTimer = useCallback(() => {
    clearTimer();
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setDurationMs(accumulatedMsRef.current + (Date.now() - startedAtRef.current));
    }, 250);
  }, [clearTimer]);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone is not supported in this browser.');
      return false;
    }

    try {
      resetRecorder();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      setMediaStream(stream);
      const mimeType = pickMimeType();
      const recorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 32000 }
        : { audioBitsPerSecond: 32000 };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, recorderOptions);
      } catch {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      }

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onerror = () => {
        setError('Recording failed. Please try again.');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setIsPaused(false);
      startTimer();
      return true;
    } catch (err) {
      const message = err?.name === 'NotAllowedError'
        ? 'Microphone permission denied. You can upload an existing file instead.'
        : 'Unable to access microphone.';
      setError(message);
      stopTracks();
      return false;
    }
  }, [resetRecorder, startTimer, stopTracks]);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }
    recorder.pause();
    accumulatedMsRef.current += Date.now() - startedAtRef.current;
    clearTimer();
    setDurationMs(accumulatedMsRef.current);
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }
    recorder.resume();
    startTimer();
    setIsPaused(false);
  }, [startTimer]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        clearTimer();
        if (recorder.state === 'recording' || startedAtRef.current) {
          accumulatedMsRef.current += Date.now() - startedAtRef.current;
        }
        setDurationMs(accumulatedMsRef.current);
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setLocalBlob(blob);
        setIsRecording(false);
        setIsPaused(false);
        stopTracks();
        setMediaStream(null);
        resolve(blob);
      };

      recorder.stop();
    });
  }, [clearTimer, stopTracks]);

  useEffect(() => () => {
    clearTimer();
    stopTracks();
  }, [clearTimer, stopTracks]);

  return {
    isRecording,
    isPaused,
    durationMs,
    error,
    localBlob,
    mediaStream,
    setLocalBlob,
    start,
    pause,
    resume,
    stop,
    resetRecorder,
  };
};

export default useAudioRecorder;
