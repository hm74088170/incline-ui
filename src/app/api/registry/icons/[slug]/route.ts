import { ForbiddenError } from "@/lib/errors";
import { errorResponse } from "@/lib/http";
import { buildIconRegistryItem } from "@/server/registry/icon-item";
import { getIcon } from "@/server/services/icon.service";
import { slugSchema } from "@/server/validators/common";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const slug = slugSchema.parse((await params).slug);
    const icon = await getIcon(slug);

    // Part 8 me yahan API key + subscription check aayega.
    // Tab tak premium icons band rahenge (fail closed).
    if (icon.isPremium) {
      throw new ForbiddenError("This is a premium icon. A subscription is required.");
    }

    return Response.json({ data: buildIconRegistryItem(icon) });
  } catch (err) {
    return errorResponse(err);
  }
}