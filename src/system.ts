import { Ecs } from './ecs';
import { Entity } from './entity';

export type ComponentTupleInstances<T extends ComponentTypeTuple> = {
  [K in keyof T]: InstanceType<T[K]>;
};

export abstract class System {
  public abstract run(...args: unknown[]): void;
}

export type ComponentType = {
  new (...args: any[]): {};
};

export type ComponentTypeTuple = ComponentType[];

export interface QueryParams<H extends ComponentTypeTuple> {
  has?: [...H];
  with?: [...unknown[]];
}

export type ComponentResult<H extends ComponentTypeTuple> = [
  entity: Entity,
  ...components: ComponentTupleInstances<QueryParams<H>['has']>,
];

export type ComponentResults<H extends ComponentTypeTuple> =
  ComponentResult<H>[];

export type SystemHandlerFn<H extends ComponentTypeTuple> = (
  results: ComponentResults<H>,
  ecs: Ecs,
) => void;

export type SystemFn<H extends ComponentTypeTuple> = (
  query: QueryParams<H>,
  handler: SystemHandlerFn<H>,
) => unknown;

export type SystemRunner = (ecs: Ecs) => void;

export function system<H extends ComponentTypeTuple>(
  query: QueryParams<H>,
  handler: (q: ComponentResults<H>, ecs: Ecs) => void,
): SystemRunner {
  return (ecs: Ecs) => {
    const results = ecs.runQuery(query);
    handler(results, ecs);
  };
}
