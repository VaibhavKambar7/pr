declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      sub: string;
      email: string;
    };
    user: {
      id: string;
      email: string;
    };
  }
}

declare module "fastify" {
  interface FastifyRequest {
    apiKey?: {
      id: string;
      projectId: string;
    };
  }
}
