export interface IntegrationDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  authType: "oauth2" | "apikey" | "webhook";
  officialLogoSvg: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  scope: string;
  token_type: string;
  expiry_date?: number;
  email?: string;
}
