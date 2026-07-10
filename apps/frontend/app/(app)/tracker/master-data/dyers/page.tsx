import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function DyersPage() {
  const config = masterDataConfig.find((item) => item.entity === "dyers");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
