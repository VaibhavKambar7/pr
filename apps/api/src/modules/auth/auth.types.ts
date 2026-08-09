declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
    };
    apiKey?: {
      id: string;
      projectId: string;
    };
  }
}
