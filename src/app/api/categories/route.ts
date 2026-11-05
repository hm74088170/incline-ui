import { errorResponse, readJson } from "@/lib/http";
import { createCategory, listCategories } from "@/server/services/category.service";
import { createCategorySchema } from "@/server/validators/category";
import { requireAdmin } from "@/server/auth/admin";

export async function GET() {
  try {
    return Response.json({ data: await listCategories() });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    requireAdmin(req);
    const input = createCategorySchema.parse(await readJson(req));
    const category = await createCategory(input);
    return Response.json({ data: category }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}