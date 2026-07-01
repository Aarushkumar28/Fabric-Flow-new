import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function MillsPage() {
  const config = masterDataConfig.find((item) => item.entity === "mills");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
