import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function KnittersPage() {
  const config = masterDataConfig.find((item) => item.entity === "knitters");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
