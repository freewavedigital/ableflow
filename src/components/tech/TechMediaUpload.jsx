import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Video, X, Loader2, ImagePlus } from "lucide-react";

export default function TechMediaUpload({ photoUrls = [], videoUrls = [], onPhotosChange, onVideosChange }) {
  const photoRef = useRef();
  const videoRef = useRef();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const handlePhotos = async (files) => {
    if (!files?.length) return;
    setUploadingPhoto(true);
    const newUrls = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    onPhotosChange([...photoUrls, ...newUrls]);
    setUploadingPhoto(false);
  };

  const handleVideos = async (files) => {
    if (!files?.length) return;
    setUploadingVideo(true);
    const newUrls = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    onVideosChange([...videoUrls, ...newUrls]);
    setUploadingVideo(false);
  };

  const removePhoto = (url) => onPhotosChange(photoUrls.filter((u) => u !== url));
  const removeVideo = (url) => onVideosChange(videoUrls.filter((u) => u !== url));

  return (
    <div className="space-y-4">
      {/* Photo grid */}
      {photoUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photoUrls.map((url, i) => (
            <div key={i} className="relative aspect-square">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-border" />
              </a>
              <button
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video list */}
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          {videoUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 bg-muted rounded-xl">
              <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 text-xs text-primary truncate">
                Video {i + 1}
              </a>
              <button onClick={() => removeVideo(url)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload buttons — large tap targets */}
      <div className="grid grid-cols-2 gap-3">
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handlePhotos(e.target.files)}
        />
        <button
          onClick={() => photoRef.current?.click()}
          disabled={uploadingPhoto}
          className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-border rounded-2xl bg-card text-muted-foreground active:bg-muted transition-colors disabled:opacity-60"
        >
          {uploadingPhoto ? (
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          ) : (
            <Camera className="w-7 h-7" />
          )}
          <span className="text-sm font-medium">{uploadingPhoto ? "Uploading…" : "Add Photo"}</span>
        </button>

        <input
          ref={videoRef}
          type="file"
          accept="video/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => handleVideos(e.target.files)}
        />
        <button
          onClick={() => videoRef.current?.click()}
          disabled={uploadingVideo}
          className="flex flex-col items-center justify-center gap-2 py-5 border-2 border-dashed border-border rounded-2xl bg-card text-muted-foreground active:bg-muted transition-colors disabled:opacity-60"
        >
          {uploadingVideo ? (
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          ) : (
            <Video className="w-7 h-7" />
          )}
          <span className="text-sm font-medium">{uploadingVideo ? "Uploading…" : "Add Video"}</span>
        </button>
      </div>
    </div>
  );
}