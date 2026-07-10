import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function CompactersPage() {
  const config = masterDataConfig.find((item) => item.entity === "compacters");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
