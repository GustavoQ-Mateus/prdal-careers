export type ServiceName = 'web' | 'api' | 'ai-service' | 'doc-service';

export interface HealthResponse {
  service: ServiceName;
  status: 'ok';
}

export interface HelloHop {
  service: ServiceName;
  message: string;
}

export interface HelloResponse {
  service: ServiceName;
  message: string;
  chain: HelloHop[];
}
