import Redirector from "@/components/Redirector";

export const runtime = 'edge';


export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Redirector tmdbId={id} type="movie" />;
}
