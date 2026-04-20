import Redirector from "@/components/Redirector";

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Redirector tmdbId={id} type="movie" />;
}
