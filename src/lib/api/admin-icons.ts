import { apiFetch } from "@/lib/api/client";

export type UploadIconInput = {
  file: File;
  name: string;
  categoryId: string;
  tags: string[];
};

const auth = (adminKey: string) => ({ Authorization: `Bearer ${adminKey}` });

export function uploadIcon(adminKey: string, input: UploadIconInput) {
  const body = new FormData();
  body.append("file", input.file);
  body.append("name", input.name);
  body.append("categoryId", input.categoryId);
  body.append("tags", input.tags.join(","));

  return apiFetch<unknown>("/api/icons", {
    method: "POST",
    headers: auth(adminKey),
    body,
  });
}

export function deleteIcon(adminKey: string, slug: string) {
  return apiFetch<void>(`/api/icons/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: auth(adminKey),
  });
}