declare module 'express-rate-limit' {
  interface RateLimitOptions {
    windowMs?: number;
    max?: number | ((req: any) => number | Promise<number>);
    message?: string | ((req: any) => string | Promise<string>);
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    keyGenerator?: (req: any) => string | Promise<string>;
    handler?: (req: any, res: any) => void;
    onLimitReached?: (req: any, res: any) => void;
    skip?: (req: any) => boolean | Promise<boolean>;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    requestWasSuccessful?: (req: any, res: any) => boolean;
  }

  interface RateLimitRequestHandler {
    (req: any, res: any, next: any): void;
  }

  function rateLimit(options: RateLimitOptions): RateLimitRequestHandler;

  export = rateLimit;
}
