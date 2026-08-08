import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
  PHOTO_MAX_AGE_DAYS,
} from '@machinebazaar/shared';
import type { ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { Button, ErrorBanner, Field, Input, Select } from './ui';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  PhotoIcon,
  StarIcon,
  TrashIcon,
  UploadIcon,
  VideoIcon,
} from './icons';

interface Props {
  listingId: string;
  media: ListingMediaDto[];
  onChange: (media: ListingMediaDto[]) => void;
}

type UploadKind = 'PHOTO' | 'VIDEO';

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200MB

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/**
 * Handles uploading and removing listing media, and surfaces the exact
 * server-side media gate (project_spec.md Â§8.3) so sellers can see what's
 * still missing before they submit for review:
 *   - 5—10 timestamped photos, each captured within the last 30 days
 *   - exactly one running-machine video, >= 60 seconds, with timestamp overlay
 */
export function ListingMediaManager({ listingId, media, onChange }: Props) {
  const { t } = useTranslation();
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<UploadKind>('PHOTO');
  const [capturedAt, setCapturedAt] = useState(todayIso());
  const [durationSeconds, setDurationSeconds] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ fileIndex: number; fileCount: number; pct: number } | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [primaryPending, setPrimaryPending] = useState<string | null>(null);

  const photos = media.filter((m) => m.type === 'PHOTO').sort((a, b) => a.orderIndex - b.orderIndex);
  const video = media.find((m) => m.type === 'VIDEO');

  const photoCountOk = photos.length >= MIN_LISTING_PHOTOS && photos.length <= MAX_LISTING_PHOTOS;
  const videoOk = !!video && (video.durationSeconds ?? 0) >= MIN_VIDEO_DURATION_SECONDS;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = fileInput.current?.files;
    if (!files || files.length === 0) {
      setError(t('components.listingMediaManager.errors.chooseFile'));
      return;
    }
    if (kind === 'VIDEO' && video) {
      setError(t('components.listingMediaManager.errors.videoAlreadyExists'));
      return;
    }
    if (kind === 'VIDEO' && files.length > 1) {
      setError(t('components.listingMediaManager.errors.onlyOneVideo'));
      return;
    }
    if (kind === 'PHOTO' && photos.length + files.length > MAX_LISTING_PHOTOS) {
      setError(t('components.listingMediaManager.errors.tooManyPhotos', { max: MAX_LISTING_PHOTOS, selected: files.length }));
      return;
    }
    if (kind === 'VIDEO' && (!durationSeconds || Number(durationSeconds) < MIN_VIDEO_DURATION_SECONDS)) {
      setError(t('components.listingMediaManager.errors.videoTooShort', { min: MIN_VIDEO_DURATION_SECONDS }));
      return;
    }

    // Client-side type/size checks — the accept attribute is advisory only.
    const maxBytes = kind === 'PHOTO' ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES;
    for (const file of Array.from(files)) {
      const expectedType = kind === 'PHOTO' ? 'image/' : 'video/';
      if (!file.type.startsWith(expectedType)) {
        setError(t('components.listingMediaManager.errors.invalidFileType', {
          fileName: file.name,
          expected: kind === 'PHOTO' ? t('components.listingMediaManager.fileTypeImage') : t('components.listingMediaManager.fileTypeVideo'),
        }));
        return;
      }
      if (file.size > maxBytes) {
        setError(t('components.listingMediaManager.errors.fileTooLarge', { fileName: file.name, size: formatMb(file.size), limit: formatMb(maxBytes) }));
        return;
      }
    }

    setError(null);
    setUploading(true);
    try {
      const uploaded: ListingMediaDto[] = [];
      const fileList = Array.from(files);
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        setUploadProgress({ fileIndex: i, fileCount: fileList.length, pct: 0 });
        const form = new FormData();
        form.append('file', file);
        form.append('type', kind);
        if (kind === 'PHOTO') {
          form.append('capturedAt', new Date(capturedAt).toISOString());
        } else {
          form.append('durationSeconds', durationSeconds);
        }
        const { data } = await api.post<ListingMediaDto>(`/listings/${listingId}/media`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            const pct = evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0;
            setUploadProgress({ fileIndex: i, fileCount: fileList.length, pct });
          },
        });
        uploaded.push(data);
      }
      onChange([...media, ...uploaded]);
      if (fileInput.current) fileInput.current.value = '';
      setDurationSeconds('');
    } catch (err) {
      setError(apiErrorMessage(err, t('components.listingMediaManager.errors.uploadFailed')));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleMove = async (mediaId: string, direction: -1 | 1) => {
    const index = photos.findIndex((p) => p.id === mediaId);
    const swapIndex = index + direction;
    if (index === -1 || swapIndex < 0 || swapIndex >= photos.length) return;

    const reordered = [...photos];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    setError(null);
    setReorderingId(mediaId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${listingId}/media/reorder`, {
        mediaIds: reordered.map((p) => p.id),
      });
      const untouched = media.filter((m) => m.type !== 'PHOTO');
      onChange([...untouched, ...data.filter((m) => m.type === 'PHOTO')]);
    } catch (err) {
      setError(apiErrorMessage(err, t('components.listingMediaManager.errors.reorderFailed')));
    } finally {
      setReorderingId(null);
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    setError(null);
    setPrimaryPending(mediaId);
    try {
      const { data } = await api.patch<ListingMediaDto[]>(`/listings/${listingId}/media/${mediaId}/primary`);
      const untouched = media.filter((m) => m.type !== 'PHOTO');
      onChange([...untouched, ...data.filter((m) => m.type === 'PHOTO')]);
    } catch (err) {
      setError(apiErrorMessage(err, t('components.listingMediaManager.errors.setPrimaryFailed')));
    } finally {
      setPrimaryPending(null);
    }
  };

  const handleRemove = async (mediaId: string) => {
    setError(null);
    setRemovingId(mediaId);
    try {
      await api.delete(`/listings/${listingId}/media/${mediaId}`);
      onChange(media.filter((m) => m.id !== mediaId));
    } catch (err) {
      setError(apiErrorMessage(err, t('components.listingMediaManager.errors.removeFailed')));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <GateRow
          ok={photoCountOk}
          icon={PhotoIcon}
          label={t('components.listingMediaManager.photosGateLabel', { count: photos.length, min: MIN_LISTING_PHOTOS, max: MAX_LISTING_PHOTOS })}
          hint={t('components.listingMediaManager.photosGateHint', { days: PHOTO_MAX_AGE_DAYS })}
        />
        <GateRow
          ok={videoOk}
          icon={VideoIcon}
          label={video ? t('components.listingMediaManager.videoGateLabelUploaded', { seconds: video.durationSeconds ?? 0 }) : t('components.listingMediaManager.videoGateLabelNotUploaded')}
          hint={t('components.listingMediaManager.videoGateHint', { min: MIN_VIDEO_DURATION_SECONDS })}
        />
      </div>

      <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 text-sm text-navy/55">
        <p>
          {t('components.listingMediaManager.tipPrefix')} <span className="font-semibold text-navy">{t('components.listingMediaManager.tipAppName')}</span> {t('components.listingMediaManager.tipSuffix')}
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 rounded-2xl border border-navy/10 bg-white p-5 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <Field label={t('components.listingMediaManager.mediaTypeLabel')}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as UploadKind)}>
            <option value="PHOTO">{t('components.listingMediaManager.mediaTypePhoto')}</option>
            <option value="VIDEO">{t('components.listingMediaManager.mediaTypeVideo')}</option>
          </Select>
        </Field>

        {kind === 'PHOTO' ? (
          <Field label={t('components.listingMediaManager.capturedOnLabel')} hint={t('components.listingMediaManager.capturedOnHint')}>
            <Input type="date" value={capturedAt} max={todayIso()} onChange={(e) => setCapturedAt(e.target.value)} required />
          </Field>
        ) : (
          <Field label={t('components.listingMediaManager.durationLabel')} hint={t('components.listingMediaManager.durationHint', { min: MIN_VIDEO_DURATION_SECONDS })}>
            <Input
              type="number"
              min={MIN_VIDEO_DURATION_SECONDS}
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="75"
              required
            />
          </Field>
        )}

        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept={kind === 'PHOTO' ? 'image/*' : 'video/*'}
            multiple={kind === 'PHOTO'}
            className="block w-full text-sm text-navy/60 file:mr-3 file:rounded-lg file:border-0 file:bg-navy/[0.06] file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
          />
        </div>

        <div className="sm:col-span-3 space-y-2.5">
          <Button type="submit" disabled={uploading}>
            <UploadIcon className="h-4 w-4" />
            {uploading ? t('components.listingMediaManager.uploading') : kind === 'PHOTO' ? t('components.listingMediaManager.uploadPhotos') : t('components.listingMediaManager.uploadVideo')}
          </Button>
          {uploadProgress && (
            <div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy/10">
                <div
                  className="h-full rounded-full bg-forest transition-[width]"
                  style={{ width: `${uploadProgress.pct}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-navy/45">
                {t('components.listingMediaManager.uploadingFileProgress', { index: uploadProgress.fileIndex + 1, count: uploadProgress.fileCount, pct: uploadProgress.pct })}
              </p>
            </div>
          )}
        </div>
      </form>

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[...photos, ...(video ? [video] : [])].map((item, idx) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-navy/10 bg-navy/[0.03]">
              <div className="flex aspect-square items-center justify-center">
                {item.type === 'PHOTO' ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                )}
              </div>

              {item.type === 'PHOTO' && item.isPrimary && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-forest px-2 py-1 text-[10.5px] font-bold text-white">
                  <StarIcon className="h-3 w-3 fill-white stroke-white" />
                  {t('components.listingMediaManager.primary')}
                </span>
              )}

              {item.type === 'PHOTO' && (
                <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition group-hover:opacity-100">
                  {!item.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(item.id)}
                      disabled={primaryPending === item.id}
                      className="rounded-md bg-white/85 p-1.5 text-navy transition hover:bg-white"
                      aria-label={t('components.listingMediaManager.setAsPrimary')}
                      title={t('components.listingMediaManager.setAsPrimary')}
                    >
                      <StarIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, -1)}
                    disabled={reorderingId === item.id || idx === 0}
                    className="rounded-md bg-white/85 p-1.5 text-navy transition hover:bg-white disabled:opacity-40"
                    aria-label={t('components.listingMediaManager.moveEarlierAria')}
                    title={t('components.listingMediaManager.moveEarlier')}
                  >
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, 1)}
                    disabled={reorderingId === item.id || idx === photos.length - 1}
                    className="rounded-md bg-white/85 p-1.5 text-navy transition hover:bg-white disabled:opacity-40"
                    aria-label={t('components.listingMediaManager.moveLaterAria')}
                    title={t('components.listingMediaManager.moveLater')}
                  >
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2.5 py-2 text-xs text-white">
                <span>
                  {item.type === 'PHOTO'
                    ? item.capturedAt
                      ? new Date(item.capturedAt).toLocaleDateString('en-IN')
                      : t('components.listingMediaManager.photo')
                    : t('components.listingMediaManager.videoDuration', { seconds: item.durationSeconds ?? '?' })}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  className="rounded-md bg-white/15 p-1.5 transition hover:bg-rose-500"
                  aria-label={t('components.listingMediaManager.removeMediaAria')}
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GateRow({
  ok,
  icon: ItemIcon,
  label,
  hint,
}: {
  ok: boolean;
  icon: (props: { className?: string }) => React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <span className={ok ? 'text-emerald-600' : 'text-amber-600'}>
        {ok ? <CheckCircleIcon className="h-5 w-5" /> : <AlertCircleIcon className="h-5 w-5" />}
      </span>
      <div>
        <p className={`flex items-center gap-1.5 text-sm font-semibold ${ok ? 'text-emerald-800' : 'text-amber-800'}`}>
          <ItemIcon className="h-4 w-4" />
          {label}
        </p>
        <p className={`mt-0.5 text-xs ${ok ? 'text-emerald-700/80' : 'text-amber-700/80'}`}>{hint}</p>
      </div>
    </div>
  );
}
