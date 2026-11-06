export default async function IconPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">{slug}</h1>
      <p className="mt-2 text-subtle">Icon details are coming in the next step.</p>
    </div>
  );
}