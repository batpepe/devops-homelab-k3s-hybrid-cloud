import { notFound } from "next/navigation";
import { fetchGallery } from "@/lib/queries";
import Gallery3D from "@/components/gallery/Gallery3D";

export const dynamic = "force-dynamic";

export default async function MuseumPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchGallery(slug);
  if (!data) notFound();
  return <Gallery3D era={data.era} exhibits={data.exhibits} />;
}
