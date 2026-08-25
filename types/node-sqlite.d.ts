declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(filename: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
  }
  export class StatementSync {
    all(...parameters: unknown[]): unknown[];
    run(...parameters: unknown[]): unknown;
  }
}
