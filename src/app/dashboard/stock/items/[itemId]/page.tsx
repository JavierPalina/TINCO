import StockItemDetailClient from "./StockItemDetailClient"

type PageProps = { params: Promise<{ itemId: string }> };

export default async function Page({ params }: PageProps) {
  const { itemId } = await params;
  return <StockItemDetailClient itemId={itemId} />;
}
