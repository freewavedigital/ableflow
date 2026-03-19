import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, X } from "lucide-react";

export default function LeadPhotoUpload({ enquiry, onPhotosUpdated }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const photos = enquiry.photo_urls || [];

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of Array.from(files)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    const updated = [...photos, ...newUrls];
    await base44.entities.Enquiry.update(enquiry.id, { photo_urls: updated });
    onPhotosUpdated(updated);
    setUploading(false);
  };

  const removePhoto = async (url) => {
    const updated = photos.filter((p) => p !== url);
    await base44.entities.Enquiry.update(enquiry.id, { photo_urls: updated });
    onPhotosUpdated(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ImagePlus className="w-4 h-4" />
          Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((url, i) => (
              <div key={i} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Lead photo ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border"
                />
                <button
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Uploading...</>
          ) : (
            <><ImagePlus className="w-4 h-4 mr-1.5" /> Add Photos</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}