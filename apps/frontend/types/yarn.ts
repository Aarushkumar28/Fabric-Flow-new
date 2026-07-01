// Yarn lot as returned by the backend
export interface YarnLot {
  id: number;
  hfCode: string;
  purchaseOrderNo?: string | null;
  status?: string | null;
  millId: number;
  mill?: { id: number; name: string } | null;
  description?: string | null;
  count?: string | null;
  totalWeight: number;
  ratePerKg: number;
  totalCost: number;
  availableWeight: number;
  knitterStocks?: KnitterStock[];
  createdAt: string;
  updatedAt: string;
}

export interface KnitterStock {
  knitterId: number;
  knitter?: { name: string };
  receivedWeight: number;
  remainingWeight: number;
}

// Data sent to create/update a yarn lot
export interface YarnLotFormData {
  hfCode: string;
  millId: number;
  totalWeight: number;
  ratePerKg: number;
  description?: string;
  count?: string;
}

// A mill reference
export interface Mill {
  id: number;
  name: string;
}

// A knitter reference
export interface Knitter {
  id: number;
  name: string;
}

export interface Dyer {
  id: number;
  name: string;
}
