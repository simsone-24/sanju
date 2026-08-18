export interface EventTypeOption {
  id: number;
  eventName: string;
  colorCode: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

// Served by GET /users/options — just enough to fill an "Assigned To"/"Coordinator" picker.
export interface UserOption {
  id: number;
  fullName: string;
  username: string;
}

export interface CustomerOption {
  id: number;
  customerCode: string;
  customerName: string;
  mobile: string;
}
