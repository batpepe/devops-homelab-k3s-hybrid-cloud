import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { fetchGallery } from "@/lib/queries";
import Gallery3D from "@/components/gallery/Gallery3D";

export const dynamic = "force-dynamic";

// generateMetadata and the page render in the same request; cache() collapses
// their two fetchGallery calls into one database round-trip.
const getGallery = cache(fetchGallery);

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getGallery(slug);
  if (!data) return {};
  return {
    title: `${data.era.name} wing`,
    description:
      data.era.blurb ||
      `Walk the ${data.era.name} wing of the Batman Museum: ${data.exhibits.length} exhibits.`
  };
}

export default async function MuseumPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getGallery(slug);
  if (!data) notFound();
  return <Gallery3D era={data.era} exhibits={data.exhibits} />;
}
