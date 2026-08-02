export interface EventTypeOption {
  id: string;
  eventName: string;
  colorCode: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

// Served by GET /users/options — just enough to fill an "Assigned To"/"Coordinator" picker.
export interface UserOption {
  id: string;
  fullName: string;
  username: string;
}

export interface CustomerOption {
  id: string;
  customerCode: string;
  customerName: string;
  mobile: string;
}
