export const IPC = {
  // Campaign
  CAMPAIGN_LIST: 'campaign:list',
  CAMPAIGN_GET: 'campaign:get',
  CAMPAIGN_CREATE: 'campaign:create',
  CAMPAIGN_UPDATE: 'campaign:update',
  CAMPAIGN_DELETE: 'campaign:delete',

  // Scenario
  SCENARIO_LIST: 'scenario:list',
  SCENARIO_GET: 'scenario:get',
  SCENARIO_CREATE: 'scenario:create',
  SCENARIO_UPDATE: 'scenario:update',
  SCENARIO_DELETE: 'scenario:delete',

  // Map
  MAP_IMPORT: 'map:import',
  MAP_GET: 'map:get',
  MAP_UPDATE: 'map:update',
  MAP_DELETE: 'map:delete',
  MAP_GET_IMAGE_URL: 'map:get-image-url',

  // Bestiary
  BESTIARY_GET_INDEX: 'bestiary:get-index',
  BESTIARY_GET_LETTER: 'bestiary:get-letter',
  BESTIARY_GET_MONSTER: 'bestiary:get-monster',

  // Dialog
  DIALOG_OPEN_IMAGE: 'dialog:open-image',
  DIALOG_OPEN_TOKEN: 'dialog:open-token',

  // App
  APP_GET_VERSION: 'app:get-version',
  APP_GET_DATA_PATH: 'app:get-data-path'
} as const
