declare module "express-validator" {
  import { RequestHandler, Request } from "express";

  export function query(field: string): ValidationChain;
  export function validationResult(req: Request): ValidationResult;
  export function matchedData(req: Request): matchedData;

  interface ValidationChain {
      notEmpty(): ValidationChain;
      escape(): string;
    // Add other methods you use...
  }

  interface ValidationResult {
    isEmpty(): boolean;
      array(): any[];
    // Add other methods you use...
  }
}

// users.d.ts
declare module '../dist/routes/users.js' {
  const usersRouter: any; // or specify a more accurate type if known
  export default usersRouter;
}
declare module '../dist/routes/users.ts' {
  const usersRouter: any; // or specify a more accurate type if known
  export default usersRouter;
}
