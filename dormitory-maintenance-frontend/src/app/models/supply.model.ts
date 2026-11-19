export type SupplyStatus = 'Requested' | 'Ordered' | 'Delivered';

export interface SupplyRequest {
  id: string;
  reportId: string;
  janitorId: string;
  janitorName?: string;
  item: string;
  quantity: number;
  justification: string;
  status: SupplyStatus;
  arrivalAt?: string;
  createdAt: string;
}

export interface CreateSupplyRequestDto {
  reportId: string;
  item: string;
  quantity: number;
  justification: string;
}
