import { fetchTimeline } from "@/lib/queries";
import TimelineCanvas from "@/components/timeline/TimelineCanvas";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { eras, milestones } = await fetchTimeline();
  return <TimelineCanvas eras={eras} milestones={milestones} />;
}
