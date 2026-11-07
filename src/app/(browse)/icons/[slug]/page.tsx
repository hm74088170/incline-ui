import { IconDetail } from "@/components/browse/icon-detail";

export default async function IconPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <IconDetail slug={slug} />;
}