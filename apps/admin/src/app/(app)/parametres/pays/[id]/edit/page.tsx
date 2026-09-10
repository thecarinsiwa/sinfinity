import { CountryEditPage } from "@/components/settings/country-edit-page";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PaysEditPage({ params }: PageProps) {
  const { id } = await params;
  return <CountryEditPage countryId={id} />;
}
