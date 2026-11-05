import { errorResponse } from "@/lib/http";
import { requireAdmin } from "@/server/auth/admin";
import { deleteIcon, getIcon } from "@/server/services/icon.service";
import { slugSchema } from "@/server/validators/common";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const slug = slugSchema.parse((await params).slug);
    return Response.json({ data: await getIcon(slug) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    requireAdmin(req);
    const slug = slugSchema.parse((await params).slug);
    await deleteIcon(slug);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}