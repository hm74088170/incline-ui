import { ValidationError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/server/auth/admin";
import { createIcon, listIcons } from "@/server/services/icon.service";
import { MAX_SVG_BYTES } from "@/server/svg/limits";
import { createIconSchema, listIconsQuerySchema } from "@/server/validators/icon";

function parseTags(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") return [];
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

async function readForm(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new ValidationError("Request must be multipart/form-data");
  }
}

export async function GET(req: Request) {
  try {
    const query = listIconsQuerySchema.parse(
      Object.fromEntries(new URL(req.url).searchParams),
    );
    const { items, total, page, limit } = await listIcons(query);
    return Response.json({ data: items, meta: { total, page, limit } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(req); // body padhne se pehle hi check

    const form = await readForm(req);

    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new ValidationError('Attach the SVG as the form field "file"');
    }
    if (file.size > MAX_SVG_BYTES) {
      throw new ValidationError("SVG is too large (max 100 KB)");
    }

    const input = createIconSchema.parse({
      name: form.get("name"),
      categoryId: form.get("categoryId"),
      tags: parseTags(form.get("tags")),
    });

    const icon = await createIcon({ ...input, svg: await file.text() });
    return Response.json({ data: icon }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}