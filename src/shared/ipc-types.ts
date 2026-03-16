export const IPC = {
  CAMPAIGNS_LIST: 'db:campaigns:list',
  CAMPAIGNS_CREATE: 'db:campaigns:create',
  CAMPAIGNS_UPDATE: 'db:campaigns:update',
  CAMPAIGNS_DELETE: 'db:campaigns:delete',

  SCENARIOS_LIST: 'db:scenarios:list',
  SCENARIOS_CREATE: 'db:scenarios:create',
  SCENARIOS_UPDATE: 'db:scenarios:update',
  SCENARIOS_DELETE: 'db:scenarios:delete',

  COMBATANTS_LIST: 'db:combatants:list',
  COMBATANTS_UPSERT: 'db:combatants:upsert',
  COMBATANTS_DELETE: 'db:combatants:delete',

  TOKENS_LIST: 'db:tokens:list',
  TOKENS_UPSERT: 'db:tokens:upsert',
  TOKENS_DELETE: 'db:tokens:delete',
  TOKENS_BULK_UPSERT: 'db:tokens:bulk-upsert',

  MAP_NOTES_LIST: 'db:map-notes:list',
  MAP_NOTES_UPSERT: 'db:map-notes:upsert',
  MAP_NOTES_DELETE: 'db:map-notes:delete',

  ACTIVE_COMBAT_LIST: 'db:active-combat:list',
  ACTIVE_COMBAT_UPSERT: 'db:active-combat:upsert',
  ACTIVE_COMBAT_BULK_SET: 'db:active-combat:bulk-set',
  ACTIVE_COMBAT_DELETE: 'db:active-combat:delete',
  ACTIVE_COMBAT_CLEAR: 'db:active-combat:clear',

  MAP_UPLOAD: 'map:upload-image',
  MAP_GET_IMAGE: 'map:get-image',

  DNDBEYOND_FETCH: 'dndbeyond:fetch-character'
} as const
