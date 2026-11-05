import { errorResponse, readJson } from "@/lib/http";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/server/services/category.service";
import { updateCategorySchema } from "@/server/validators/category";
import { idSchema } from "@/server/validators/common";
import { requireAdmin } from "@/server/auth/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const id = idSchema.parse((await params).id);
    return Response.json({ data: await getCategory(id) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    requireAdmin(req);
    const id = idSchema.parse((await params).id);
    const input = updateCategorySchema.parse(await readJson(req));
    return Response.json({ data: await updateCategory(id, input) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    requireAdmin(req);
    const id = idSchema.parse((await params).id);
    await deleteCategory(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}