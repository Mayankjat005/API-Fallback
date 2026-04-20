import Redirector from "@/components/Redirector";

export default async function TVPage({ 
  params 
}: { 
  params: Promise<{ id: string; season: string; episode: string }> 
}) {
  const { id, season, episode } = await params;
  return <Redirector tmdbId={id} type="tv" season={season} episode={episode} />;
}
