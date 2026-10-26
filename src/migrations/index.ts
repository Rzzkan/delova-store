import * as migration_20261026_080242_awal from './20261026_080242_awal';

export const migrations = [
  {
    up: migration_20261026_080242_awal.up,
    down: migration_20261026_080242_awal.down,
    name: '20261026_080242_awal'
  },
];
