import { ZodType } from "zod";

export type WidgetParamType = "string" | "integer";

export interface WidgetParam {
  name: string;
  type: WidgetParamType;
}

export interface ServiceCredentials {
  // For "oauth2" services: the user's token for that provider (see
  // services/oauth/credentials.ts). For "none"-auth services this is null.
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
}

export interface WidgetDefinition<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique within its service. Combined with the service name this is the
   *  widget's identifier everywhere: about.json, dashboard instances, etc. */
  name: string;
  description: string;
  /** Drives about.json AND the frontend's auto-generated config form. */
  params: WidgetParam[];
  /** Validates a widget instance's config object before it's saved or used. */
  configSchema: ZodType<TConfig>;
  /** Suggested default refresh rate in seconds; the user can override it. */
  defaultRefreshRateSeconds: number;
  /** Fetches the data this widget displays. credentials is null for
   *  authType "none" services. */
  fetchData: (config: TConfig, credentials: ServiceCredentials | null) => Promise<unknown>;
}

export type ServiceAuthType = "none" | "credentials" | "oauth2";

export interface ServiceDefinition {
  /** Unique service identifier, used in about.json and widget instances. */
  name: string;
  authType: ServiceAuthType;
  /** Required when authType === "oauth2": the provider in services/oauth/providers.ts
   *  whose token (the one the user linked) is passed to fetchData as credentials. */
  oauthProvider?: string;
  /** Required when authType === "credentials" (e.g. username/password login). */
  credentialSchema?: ZodType<unknown>;
  widgets: WidgetDefinition<any>[];
}
