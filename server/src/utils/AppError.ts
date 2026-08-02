export interface FieldError {
  field: string;
  message: string;
}

export class AppError extends Error {
  statusCode: number;
  errors?: FieldError[];

  constructor(statusCode: number, message: string, errors?: FieldError[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
