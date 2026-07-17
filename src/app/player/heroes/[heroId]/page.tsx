import { HeroDetail } from '@/features/hero-pool/hero-detail';

export default function PlayerHeroDetailPage({
  params,
}: {
  params: { heroId: string };
}) {
  return <HeroDetail heroId={params.heroId} />;
}
