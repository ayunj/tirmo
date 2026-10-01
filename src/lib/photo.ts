"use client";

import { createClient } from "@/lib/supabase/client";

/** 긴 변 1600px JPEG 로 줄여서 올려요 (휴대폰 사진이 너무 커서) */
async function shrink(file: File, max = 1600): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k);
    c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise((res) => c.toBlob((b) => res(b ?? file), "image/jpeg", 0.85));
  } catch {
    return file; // HEIC 등 브라우저가 못 읽으면 원본
  }
}

export async function uploadPhoto(tripId: string, file: File) {
  const supabase = createClient();
  const blob = await shrink(file);
  const ext = blob.type === "image/jpeg" ? "jpg" : (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${tripId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("photos").upload(path, blob, { contentType: blob.type || file.type, upsert: false });
  if (error) throw error;
  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}

/** 사진 주소로 저장소에서 지우기 (실패해도 넘어가요) */
export async function removePhotos(urls: string[]) {
  const paths = urls.map((u) => u.split("/object/public/photos/")[1]).filter(Boolean);
  if (paths.length) await createClient().storage.from("photos").remove(paths);
}
