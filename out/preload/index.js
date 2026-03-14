"use strict";
const electron = require("electron");
const IPC = {
  // Campaign
  CAMPAIGN_LIST: "campaign:list",
  CAMPAIGN_GET: "campaign:get",
  CAMPAIGN_CREATE: "campaign:create",
  CAMPAIGN_UPDATE: "campaign:update",
  CAMPAIGN_DELETE: "campaign:delete",
  // Scenario
  SCENARIO_LIST: "scenario:list",
  SCENARIO_GET: "scenario:get",
  SCENARIO_CREATE: "scenario:create",
  SCENARIO_UPDATE: "scenario:update",
  SCENARIO_DELETE: "scenario:delete",
  // Map
  MAP_IMPORT: "map:import",
  MAP_GET: "map:get",
  MAP_UPDATE: "map:update",
  MAP_DELETE: "map:delete",
  MAP_GET_IMAGE_URL: "map:get-image-url",
  // Bestiary
  BESTIARY_GET_INDEX: "bestiary:get-index",
  BESTIARY_GET_LETTER: "bestiary:get-letter",
  BESTIARY_GET_MONSTER: "bestiary:get-monster",
  // Dialog
  DIALOG_OPEN_IMAGE: "dialog:open-image",
  DIALOG_OPEN_TOKEN: "dialog:open-token",
  // App
  APP_GET_VERSION: "app:get-version",
  APP_GET_DATA_PATH: "app:get-data-path"
};
const api = {
  campaign: {
    list: () => electron.ipcRenderer.invoke(IPC.CAMPAIGN_LIST),
    get: (id) => electron.ipcRenderer.invoke(IPC.CAMPAIGN_GET, id),
    create: (data) => electron.ipcRenderer.invoke(IPC.CAMPAIGN_CREATE, data),
    update: (id, data) => electron.ipcRenderer.invoke(IPC.CAMPAIGN_UPDATE, id, data),
    delete: (id) => electron.ipcRenderer.invoke(IPC.CAMPAIGN_DELETE, id),
    addPlayerCharacter: (campaignId, pc) => electron.ipcRenderer.invoke("campaign:add-pc", campaignId, pc),
    updatePlayerCharacter: (campaignId, pcId, data) => electron.ipcRenderer.invoke("campaign:update-pc", campaignId, pcId, data),
    deletePlayerCharacter: (campaignId, pcId) => electron.ipcRenderer.invoke("campaign:delete-pc", campaignId, pcId)
  },
  scenario: {
    list: (campaignId) => electron.ipcRenderer.invoke(IPC.SCENARIO_LIST, campaignId),
    get: (campaignId, scenarioId) => electron.ipcRenderer.invoke(IPC.SCENARIO_GET, campaignId, scenarioId),
    create: (data) => electron.ipcRenderer.invoke(IPC.SCENARIO_CREATE, data),
    update: (campaignId, scenarioId, data) => electron.ipcRenderer.invoke(IPC.SCENARIO_UPDATE, campaignId, scenarioId, data),
    delete: (campaignId, scenarioId) => electron.ipcRenderer.invoke(IPC.SCENARIO_DELETE, campaignId, scenarioId)
  },
  map: {
    import: (campaignId, scenarioId) => electron.ipcRenderer.invoke(IPC.MAP_IMPORT, campaignId, scenarioId),
    get: (campaignId, scenarioId, mapId) => electron.ipcRenderer.invoke(IPC.MAP_GET, campaignId, scenarioId, mapId),
    update: (campaignId, scenarioId, mapId, data) => electron.ipcRenderer.invoke(IPC.MAP_UPDATE, campaignId, scenarioId, mapId, data),
    delete: (campaignId, scenarioId, mapId) => electron.ipcRenderer.invoke(IPC.MAP_DELETE, campaignId, scenarioId, mapId),
    getImageUrl: (absolutePath) => electron.ipcRenderer.invoke(IPC.MAP_GET_IMAGE_URL, absolutePath)
  },
  bestiary: {
    getIndex: () => electron.ipcRenderer.invoke(IPC.BESTIARY_GET_INDEX),
    getByLetter: (letter, edition) => electron.ipcRenderer.invoke(IPC.BESTIARY_GET_LETTER, letter, edition),
    getMonster: (name, source) => electron.ipcRenderer.invoke(IPC.BESTIARY_GET_MONSTER, name, source)
  },
  dialog: {
    openImageFile: () => electron.ipcRenderer.invoke(IPC.DIALOG_OPEN_IMAGE),
    openTokenImage: () => electron.ipcRenderer.invoke(IPC.DIALOG_OPEN_TOKEN)
  },
  app: {
    getVersion: () => electron.ipcRenderer.invoke(IPC.APP_GET_VERSION),
    getDataPath: () => electron.ipcRenderer.invoke(IPC.APP_GET_DATA_PATH)
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
