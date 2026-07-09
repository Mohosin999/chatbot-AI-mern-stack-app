export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  status: boolean;
  message: string;
}
