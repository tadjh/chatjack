export type ValidateAccessTokenSessionData = {
  client_id: string;
  login: string;
  scopes: string[];
  user_id: string;
  expires_in: number;
};

export type ValidateAccessTokenSuccess = {
  user: ValidateAccessTokenSessionData;
  error?: never;
};

export type ValidateAccessTokenError = {
  status: number;
  message: string;
};

export type ValidateAccessTokenFailure = {
  error: ValidateAccessTokenError;
  user?: never;
};

export type ValidateAccessToken =
  | ValidateAccessTokenSuccess
  | ValidateAccessTokenFailure;

export type ModeratedChannel = {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
};

export type Pagination = {
  cursor?: string;
};

export type ModeratedChannelsResponse = {
  data: ModeratedChannel[];
  pagination: Pagination;
};
