import { IconUploadForm } from "@/components/admin/icon-upload-form";
import { IconsAdmin } from "@/components/admin/icons-admin";

export default function AdminIconsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight">Icons</h1>
      <IconUploadForm />
      <IconsAdmin />
    </div>
  );
}