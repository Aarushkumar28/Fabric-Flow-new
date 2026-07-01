import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function ColoursPage() {
  const config = masterDataConfig.find((item) => item.entity === "colours");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
