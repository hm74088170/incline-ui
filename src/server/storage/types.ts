export type UploadedAsset = { url: string; publicId: string };

export interface IconStorage {
  uploadSvg(svg: string, publicId: string): Promise<UploadedAsset>;
  deleteAsset(publicId: string): Promise<void>;
}