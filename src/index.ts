import { Component } from './components';
import { Ecs, Timer } from './ecs';
import { Entity } from './entity';
import { System, QueryParams, system } from './system';
import { performance } from 'node:perf_hooks';

type QueryResult<T extends unknown[]> = [entity: Entity, ...components: T];
type QueryResults<T extends unknown[]> = QueryResult<T>[];

const ecs = new Ecs();

@Component()
class Position {
  constructor(public x: number, public y: number) {}
}

@Component()
class Volume {}

/* ecs.spawn().insert(new Position(1, 2)); */
/* ecs.spawn().insert(new Position(3, 4)).insert(new Volume()); */
/* ecs.spawn().insert(new Position(5, 6)).insert(new Volume()); */

for (let i = 0; i < 10000; i++) {
  ecs
    .spawn()
    .insert(new Position(i, i + 1))
    .insert(new Volume());
}

/* console.log(ecs); */

/* ecs.registerSystem(PositionSystem); */
/* ecs.registerSystem(VolumeSystem); */

const PositionSystem = system({ has: [Position] }, (results) => {
  for (const [entity, position] of results) {
    /* console.log(position); */
    position.x = position.y;
  }
});

const VolumeSystem = system({ has: [Volume] }, (results) => {
  for (const [entity, volume] of results) {
    1 + 1;
  }
});

ecs.registerNewSystem(PositionSystem);
ecs.registerNewSystem(VolumeSystem);

/* ecs.registerNewSystem(new PositionSystem()); */
/* ecs.registerNewSystem(new VolumeSystem()); */

let i = 0;
const iterations = 10000;
const framerate = 0;

ecs.timer.reset();
const timeout = setInterval(() => {
  /* console.time('tick'); */
  ecs.tick();
  /* console.log(ecs.timer.deltaTime); */
  /* console.timeEnd('tick'); */

  if (i >= iterations) {
    clearInterval(timeout);
  }

  i++;
}, framerate);
