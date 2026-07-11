'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Camera,
  Download,
  RefreshCw,
  UserCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Upload,
  ImageIcon,
  Loader2,
  ArrowLeft,
  Sparkles,
  Video,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Resume } from '@/types/resume';

const API_KEY_STORAGE_KEY = 'jade_nanobanana_api_key';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', desc: 'LinkedIn / WeChat' },
  { label: '3:4', value: '3:4', desc: 'ID Photo' },
  { label: '2:3', value: '2:3', desc: 'Portrait' },
  { label: '4:3', value: '4:3', desc: 'Landscape' },
];

function getHeaders() {
  const fingerprint =
    typeof window !== 'undefined'
      ? getStoredFingerprint()
      : null;
  return {
    'Content-Type': 'application/json',
    ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
  };
}

function resizeImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeDataUrl(
  dataUrl: string,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export default function LinkedInPhotoPage() {
  const t = useTranslations('linkedinPhoto');

  // API Key
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  // Upload
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Prompt
  const [prompt, setPrompt] = useState('');
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [requirements, setRequirements] = useState('');

  // Aspect ratio
  const [aspectRatio, setAspectRatio] = useState('1:1');

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // Resume list for avatar
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Load API key, default prompt, and resume list on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) setApiKey(stored);
    setPrompt(t('promptDefault'));

    // Fetch resume list
    fetch('/api/resume', { headers: getHeaders() })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Resume[]) => {
        setResumes(data);
        if (data.length > 0) setSelectedResumeId(data[0].id);
      })
      .catch(() => {});
  }, [t]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Persist API key
  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
  };

  // File handling
  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('uploadHint'));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(t('uploadHint'));
        return;
      }
      const dataUrl = await resizeImage(file, 1024);
      setUploadedImage(dataUrl);
    },
    [t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  // Camera functions
  const openCamera = async () => {
    try {
      setCameraActive(true);
      setCameraReady(false);
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch {
      toast.error(t('cameraError'));
      setCameraActive(false);
    }
  };

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
  };

  const confirmCapture = () => {
    if (capturedImage) {
      setUploadedImage(capturedImage);
      closeCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  // Generate
  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      toast.error(t('errorNoApiKey'));
      return;
    }
    if (!uploadedImage) {
      toast.error(t('errorNoImage'));
      return;
    }

    setIsGenerating(true);
    setResultImage(null);

    try {
      const res = await fetch('/api/linkedin-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: uploadedImage,
          prompt,
          requirements: requirements.trim(),
          aspectRatio,
          apiKey: apiKey.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'invalid_key') {
          toast.error(t('errorInvalidKey'));
        } else if (data.error === 'safety_filtered') {
          toast.error(t('errorSafety'));
        } else {
          toast.error(t('errorGenerate'));
        }
        return;
      }

      setResultImage(data.image);
    } catch {
      toast.error(t('errorGenerate'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Download
  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `linkedin-photo-${Date.now()}.png`;
    link.click();
  };

  // Set as avatar via API
  const handleSetAsAvatar = async () => {
    if (!resultImage) return;
    if (!selectedResumeId) {
      toast.error(t('setAsAvatarNoResume'));
      return;
    }

    try {
      // 1. Fetch the target resume to find personalInfo section
      const resumeRes = await fetch(`/api/resume/${selectedResumeId}`, {
        headers: getHeaders(),
      });
      if (!resumeRes.ok) {
        toast.error(t('setAsAvatarNoResume'));
        return;
      }
      const resume: Resume = await resumeRes.json();
      const personalInfo = resume.sections.find(
        (s) => s.type === 'personal_info'
      );
      if (!personalInfo) {
        toast.error(t('setAsAvatarNoResume'));
        return;
      }

      // 2. Resize to 200px for avatar
      const avatarUrl = await resizeDataUrl(resultImage, 200, 0.85);

      // 3. Update the section with avatar
      const updatedSections = resume.sections.map((s) =>
        s.id === personalInfo.id
          ? { ...s, content: { ...s.content, avatar: avatarUrl } }
          : s
      );

      const putRes = await fetch(`/api/resume/${selectedResumeId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ sections: updatedSections }),
      });

      if (putRes.ok) {
        toast.success(t('setAsAvatarSuccess'));
      } else {
        toast.error(t('errorGenerate'));
      }
    } catch {
      toast.error(t('errorGenerate'));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-foreground">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-zinc-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column — Settings & Upload */}
        <div className="space-y-6">
          {/* API Key */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Label className="mb-2 block text-sm font-medium">
              {t('apiKey')}
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={t('apiKeyPlaceholder')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">{t('apiKeyHint')}</p>
          </div>

          {/* Image Upload / Camera */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Label className="mb-3 block text-sm font-medium">
              {t('uploadTitle')}
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Camera View */}
            {cameraActive ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full overflow-hidden rounded-xl border border-zinc-200 bg-black dark:border-zinc-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      'w-full -scale-x-100',
                      capturedImage && 'hidden'
                    )}
                  />
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured selfie"
                      className="w-full object-contain"
                    />
                  )}
                  {!cameraReady && !capturedImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                        <p className="text-xs text-white/70">
                          {t('cameraLoading')}
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="absolute right-2 top-2 cursor-pointer rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {capturedImage ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retakePhoto}
                      className="cursor-pointer gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {t('retake')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={confirmCapture}
                      className="cursor-pointer gap-1.5 bg-brand hover:bg-brand-hover"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('useSelfie')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="cursor-pointer gap-1.5 bg-brand hover:bg-brand-hover disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {t('capture')}
                  </Button>
                )}
              </div>
            ) : uploadedImage ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <img
                    src={uploadedImage}
                    alt="Selfie preview"
                    className="max-h-64 w-auto object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer gap-1.5"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {t('changePhoto')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openCamera}
                    className="cursor-pointer gap-1.5"
                  >
                    <Video className="h-3.5 w-3.5" />
                    {t('takeSelfie')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition-colors',
                    isDragging
                      ? 'border-brand bg-brand-muted dark:border-brand dark:bg-brand-muted'
                      : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                  )}
                >
                  <Upload className="mb-2 h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('uploadButton')}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t('uploadHint')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                  <span className="text-xs text-zinc-400">
                    {t('orDivider')}
                  </span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                </div>
                <Button
                  variant="outline"
                  onClick={openCamera}
                  className="w-full cursor-pointer gap-2"
                >
                  <Video className="h-4 w-4" />
                  {t('takeSelfie')}
                </Button>
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Label className="mb-3 block text-sm font-medium">
              {t('imageSize')}
            </Label>
            <div className="flex gap-2">
              {ASPECT_RATIOS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setAspectRatio(r.value)}
                  className={cn(
                    'flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg border px-3 py-2.5 transition-colors',
                    aspectRatio === r.value
                      ? 'border-brand bg-brand-muted text-brand dark:bg-brand-muted dark:text-brand'
                      : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'
                  )}
                >
                  <span className="text-sm font-medium">{r.label}</span>
                  <span className="text-[10px] leading-none opacity-60">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t('promptTitle')}</Label>
              <button
                type="button"
                onClick={() => setPromptExpanded(!promptExpanded)}
                className="flex cursor-pointer items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {promptExpanded ? t('promptCollapse') : t('promptExpand')}
                {promptExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            {promptExpanded && (
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="mt-3 text-sm"
              />
            )}
          </div>

          {/* Requirements */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <Label className="mb-2 block text-sm font-medium">
              {t('requirements')}
            </Label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder={t('requirementsPlaceholder')}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !apiKey.trim() || !uploadedImage}
            className="w-full cursor-pointer gap-2 bg-brand py-6 text-base font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {t('generate')}
              </>
            )}
          </Button>
        </div>

        {/* Right Column — Result */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-foreground">
                {t('resultTitle')}
              </h2>
            </div>

            <div className="p-5">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24">
                  <div className="relative mb-6">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-zinc-200 border-t-brand" />
                  </div>
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('generating')}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t('generatingHint')}
                  </p>
                </div>
              ) : resultImage ? (
                <div className="flex flex-col items-center gap-5">
                  <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={resultImage}
                      alt="LinkedIn headshot"
                      className="w-full max-w-md object-contain"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="cursor-pointer gap-1.5"
                    >
                      <Download className="h-4 w-4" />
                      {t('download')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleGenerate}
                      className="cursor-pointer gap-1.5"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {t('regenerate')}
                    </Button>
                  </div>

                  {/* Set as avatar */}
                  <div className="w-full rounded-lg border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <Label className="mb-2 block text-sm font-medium">
                      {t('selectResume')}
                    </Label>
                    {resumes.length > 0 ? (
                      <div className="flex gap-2">
                        <Select
                          value={selectedResumeId}
                          onValueChange={setSelectedResumeId}
                        >
                          <SelectTrigger className="flex-1 cursor-pointer bg-white dark:bg-zinc-900">
                            <SelectValue
                              placeholder={t('selectResumePlaceholder')}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {resumes.map((r) => (
                              <SelectItem
                                key={r.id}
                                value={r.id}
                                className="cursor-pointer"
                              >
                                {r.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleSetAsAvatar}
                          className="cursor-pointer gap-1.5 bg-brand hover:bg-brand-hover"
                        >
                          <UserCircle className="h-4 w-4" />
                          {t('setAsAvatar')}
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">
                        {t('noResumes')}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-4 rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
                    <ImageIcon className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-500">
                    {t('resultPlaceholder')}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {t('resultPlaceholderHint')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
