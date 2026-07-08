import { useRef, useState } from 'react';
import {
  MAX_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS,
  MIN_VIDEO_DURATION_SECONDS,
  PHOTO_MAX_AGE_DAYS,
} from '@machinebazaar/shared';
import type { ListingMediaDto } from '@machinebazaar/shared';
import { api, apiErrorMessage } from '../lib/api';
import { Button, ErrorBanner, Field, Input, Select } from './ui';
import { CheckCircleIcon, AlertCircleIcon, PhotoIcon, TrashIcon, UploadIcon, VideoIcon } from './icons';

interface Props {
  listingId: string;
  media: ListingMediaDto[];
  onChange: (media: ListingMediaDto[]) => void;
}

type UploadKind = 'PHOTO' | 'VIDEO';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Handles uploading and removing listing media, and surfaces the exact
 * server-side media gate (project_spec.md Â§8.3) so sellers can see what's
 * still missing before they submit for review:
 *   - 5—10 timestamped photos, each captured within the last 30 days
 *   - exactly one running-machine video, >= 60 seconds, with timestamp overlay
 */
export function ListingMediaManager({ listingId, media, onChange }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<UploadKind>('PHOTO');
  const [capturedAt, setCapturedAt] = useState(todayIso());
  const [durationSeconds, setDurationSeconds] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const photos = media.filter((m) => m.type === 'PHOTO');
  const video = media.find((m) => m.type === 'VIDEO');

  const photoCountOk = photos.length >= MIN_LISTING_PHOTOS && photos.length <= MAX_LISTING_PHOTOS;
  const videoOk = !!video && (video.durationSeconds ?? 0) >= MIN_VIDEO_DURATION_SECONDS;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError('Choose a file to upload first.');
      return;
    }
    if (kind === 'VIDEO' && video) {
      setError('This listing already has a running video. Remove it before uploading a new one.');
      return;
    }
    if (kind === 'PHOTO' && photos.length >= MAX_LISTING_PHOTOS) {
      setError(`A listing may have at most ${MAX_LISTING_PHOTOS} photos.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', kind);
      if (kind === 'PHOTO') {
        form.append('capturedAt', new Date(capturedAt).toISOString());
      } else {
        if (!durationSeconds || Number(durationSeconds) < MIN_VIDEO_DURATION_SECONDS) {
          setError(`The running video must be at least ${MIN_VIDEO_DURATION_SECONDS} seconds long.`);
          setUploading(false);
          return;
        }
        form.append('durationSeconds', durationSeconds);
      }

      const { data } = await api.post<ListingMediaDto>(`/listings/${listingId}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange([...media, data]);
      if (fileInput.current) fileInput.current.value = '';
      setDurationSeconds('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not upload that file. Please check the requirements and try again.'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (mediaId: string) => {
    setError(null);
    setRemovingId(mediaId);
    try {
      await api.delete(`/listings/${listingId}/media/${mediaId}`);
      onChange(media.filter((m) => m.id !== mediaId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove that file.'));
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
          label={`Photos: ${photos.length} / ${MIN_LISTING_PHOTOS}—${MAX_LISTING_PHOTOS}`}
          hint={`Each must be timestamped and captured within the last ${PHOTO_MAX_AGE_DAYS} days.`}
        />
        <GateRow
          ok={videoOk}
          icon={VideoIcon}
          label={video ? `Running video: ${video.durationSeconds ?? 0}s` : 'Running video: not uploaded'}
          hint={`Exactly one video, at least ${MIN_VIDEO_DURATION_SECONDS}s, machine actively operating with timestamp overlay.`}
        />
      </div>

      <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-4 text-sm text-navy/55">
        <p>
          Tip: use the <span className="font-semibold text-navy">Timestamp Camera</span> app to
          capture photos and video with a visible date/time overlay — this is what our review team
          checks for.
        </p>
      </div>

      {error && <ErrorBanner message={error} />}

      <form onSubmit={handleUpload} className="grid grid-cols-1 gap-4 rounded-2xl border border-navy/10 bg-white p-5 sm:grid-cols-[160px_1fr_auto] sm:items-end">
        <Field label="Media type">
          <Select value={kind} onChange={(e) => setKind(e.target.value as UploadKind)}>
            <option value="PHOTO">Photo</option>
            <option value="VIDEO">Running video</option>
          </Select>
        </Field>

        {kind === 'PHOTO' ? (
          <Field label="Captured on" hint="Date shown on the timestamp overlay">
            <Input type="date" value={capturedAt} max={todayIso()} onChange={(e) => setCapturedAt(e.target.value)} required />
          </Field>
        ) : (
          <Field label="Duration (seconds)" hint={`Minimum ${MIN_VIDEO_DURATION_SECONDS} seconds`}>
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
            className="block w-full text-sm text-navy/60 file:mr-3 file:rounded-lg file:border-0 file:bg-navy/[0.06] file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-navy hover:file:bg-navy/10"
          />
        </div>

        <div className="sm:col-span-3">
          <Button type="submit" disabled={uploading}>
            <UploadIcon className="h-4 w-4" />
            {uploading ? 'Uploading...' : `Upload ${kind === 'PHOTO' ? 'photo' : 'video'}`}
          </Button>
        </div>
      </form>

      {media.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-xl border border-navy/10 bg-navy/[0.03]">
              <div className="flex aspect-square items-center justify-center">
                {item.type === 'PHOTO' ? (
                  <img src={item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={item.url} className="h-full w-full object-cover" muted />
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent px-2.5 py-2 text-xs text-white">
                <span>
                  {item.type === 'PHOTO'
                    ? item.capturedAt
                      ? new Date(item.capturedAt).toLocaleDateString('en-IN')
                      : 'Photo'
                    : `Video · ${item.durationSeconds ?? '?'}s`}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  className="rounded-md bg-white/15 p-1.5 transition hover:bg-rose-500"
                  aria-label="Remove media"
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
