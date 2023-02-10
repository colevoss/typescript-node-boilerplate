import { ComponentList, getComponentName } from './components';
import { Entity, EntityAllocator } from './entity';
import {
  QueryParams,
  System,
  ComponentTypeTuple,
  ComponentTupleInstances,
  ComponentResults,
  ComponentResult,
  SystemRunner,
} from './system';
import { performance } from 'perf_hooks';

export class Timer {
  start: number;

  constructor() {
    this.start = performance.now();
  }

  public reset() {
    this.start = performance.now();
  }

  public get deltaTime(): number {
    return performance.now() - this.start;
  }
}

export class ComponentListMap {
  private componentListMap: Map<string, ComponentList<unknown>> = new Map();

  public getMap<T>(t: unknown): ComponentList<T> | null {
    const componentName = getComponentName(t);

    if (!componentName) {
      throw new Error(`Not a component ${t}`);
    }

    if (!this.componentListMap.has(componentName)) {
      const componentList = new ComponentList<T>();
      this.componentListMap.set(componentName, componentList);
      return componentList;
    }

    return this.componentListMap.get(componentName) as ComponentList<T>;
  }

  public get maps(): Map<string, ComponentList<unknown>> {
    return this.componentListMap;
  }
}

export class EntityBuilder {
  private entity: Entity;
  private ecs: Ecs;

  constructor(ecs: Ecs, entity: Entity) {
    this.ecs = ecs;
    this.entity = entity;
  }

  public insert<T>(component: T): EntityBuilder {
    this.ecs.insertComponentForEntity(this.entity, component);
    return this;
  }
}

export class Ecs {
  public allocator: EntityAllocator;
  public componentListMap: ComponentListMap;
  private systems: SystemRunner[];
  public timer: Timer;

  constructor() {
    this.allocator = new EntityAllocator();
    this.componentListMap = new ComponentListMap();
    this.systems = [];
    this.timer = new Timer();
  }

  public insert(entity: Entity) {
    return new EntityBuilder(this, entity);
  }

  public registerComponents(...components: unknown[]) {
    const entity = this.allocator.allocate();

    for (const component of components) {
      const componentList =
        this.componentListMap.getMap<typeof component>(component);
      componentList.set(entity, component);
    }
  }

  public insertComponentForEntity<T>(entity: Entity, component: T) {
    this.componentListMap.getMap<T>(component).set(entity, component);
  }

  public spawn(): EntityBuilder {
    const entity = this.allocator.allocate();
    const entityBuilder = new EntityBuilder(this, entity);

    return entityBuilder;
  }

  public registerNewSystem(system: SystemRunner) {
    this.systems.push(system);
    return this;
  }

  public tick() {
    for (const system of this.systems) {
      system(this);
    }
  }

  public runQuery<H extends ComponentTypeTuple>(
    query: QueryParams<H>,
  ): ComponentResults<H> {
    const results: ComponentResults<H> = [];

    for (const entry of this.allocator.entities) {
      const entity: ComponentResult<H> = [
        entry,
      ] as unknown as ComponentResult<H>;

      let shouldSkip = false;
      for (const q of query.has) {
        const list = this.componentListMap.getMap<typeof q>(q);
        const component = list.get(entry);

        if (!component) {
          shouldSkip = true;
        }

        entity.push(component as InstanceType<typeof q>);
      }

      if (shouldSkip) {
        continue;
      }

      results.push(entity);
    }

    return results;
  }
}
