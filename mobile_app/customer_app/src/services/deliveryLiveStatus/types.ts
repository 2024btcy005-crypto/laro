export type DeliveryStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'NEARBY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryLiveStatusData {
  orderId: string;
  restaurantName: string;
  deliveryPartnerName?: string;
  status: DeliveryStatus;
  etaMinutes?: number;
  progress?: number;
  deepLink: string;
}
