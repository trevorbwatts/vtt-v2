"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const nanoid = require("nanoid");
const fs = require("fs/promises");
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
function registerCampaignHandlers(storage) {
  electron.ipcMain.handle(IPC.CAMPAIGN_LIST, () => storage.listCampaigns());
  electron.ipcMain.handle(IPC.CAMPAIGN_GET, (_e, id) => storage.getCampaign(id));
  electron.ipcMain.handle(
    IPC.CAMPAIGN_CREATE,
    (_e, data) => storage.createCampaign(data)
  );
  electron.ipcMain.handle(
    IPC.CAMPAIGN_UPDATE,
    (_e, id, data) => storage.updateCampaign(id, data)
  );
  electron.ipcMain.handle(IPC.CAMPAIGN_DELETE, (_e, id) => storage.deleteCampaign(id));
  electron.ipcMain.handle(
    "campaign:add-pc",
    (_e, campaignId, pc) => storage.addPlayerCharacter(campaignId, pc)
  );
  electron.ipcMain.handle(
    "campaign:update-pc",
    (_e, campaignId, pcId, data) => storage.updatePlayerCharacter(campaignId, pcId, data)
  );
  electron.ipcMain.handle(
    "campaign:delete-pc",
    (_e, campaignId, pcId) => storage.deletePlayerCharacter(campaignId, pcId)
  );
}
function registerScenarioHandlers(storage) {
  electron.ipcMain.handle(
    IPC.SCENARIO_LIST,
    (_e, campaignId) => storage.listScenarios(campaignId)
  );
  electron.ipcMain.handle(
    IPC.SCENARIO_GET,
    (_e, campaignId, scenarioId) => storage.getScenario(campaignId, scenarioId)
  );
  electron.ipcMain.handle(
    IPC.SCENARIO_CREATE,
    (_e, data) => storage.createScenario(data)
  );
  electron.ipcMain.handle(
    IPC.SCENARIO_UPDATE,
    (_e, campaignId, scenarioId, data) => storage.updateScenario(campaignId, scenarioId, data)
  );
  electron.ipcMain.handle(
    IPC.SCENARIO_DELETE,
    (_e, campaignId, scenarioId) => storage.deleteScenario(campaignId, scenarioId)
  );
}
function registerMapHandlers(storage, image) {
  electron.ipcMain.handle(
    IPC.MAP_IMPORT,
    async (_e, campaignId, scenarioId) => {
      const result = await electron.dialog.showOpenDialog({
        title: "Import Map",
        filters: [
          { name: "Map Files", extensions: ["jpg", "jpeg", "png", "uvtt", "dd2vtt"] },
          { name: "Images", extensions: ["jpg", "jpeg", "png"] },
          { name: "VTT Files", extensions: ["uvtt", "dd2vtt"] }
        ],
        properties: ["openFile"]
      });
      if (result.canceled || !result.filePaths[0]) return null;
      const sourcePath = result.filePaths[0];
      const ext = path.extname(sourcePath).toLowerCase().slice(1);
      const mapId = nanoid.nanoid();
      const destDir = storage.mapImageDir(campaignId, scenarioId, mapId);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      let imagePath;
      let uvttData = void 0;
      if (ext === "uvtt" || ext === "dd2vtt") {
        const parsed = await image.parseUVTT(sourcePath, destDir);
        imagePath = parsed.imagePath;
        uvttData = parsed.uvttData;
      } else {
        const imgExt = ext === "jpeg" ? "jpg" : ext;
        imagePath = await image.copyImage(sourcePath, destDir, `image.${imgExt}`);
      }
      const mapData = {
        id: mapId,
        scenarioId,
        name: path.basename(sourcePath, path.extname(sourcePath)),
        format: ext === "uvtt" || ext === "dd2vtt" ? ext : "image",
        imagePath,
        sourceFilePath: sourcePath,
        gridConfig: {
          cellSize: uvttData ? uvttData.resolution.pixels_per_grid : 96,
          offsetX: uvttData ? uvttData.resolution.map_origin.x : 0,
          offsetY: uvttData ? uvttData.resolution.map_origin.y : 0,
          visible: true,
          color: "#ffffff33",
          snapToGrid: true
        },
        mode: "setup",
        tokens: [],
        monsterInstances: [],
        notes: [],
        uvttData,
        createdAt: now,
        updatedAt: now
      };
      return storage.createMap(campaignId, scenarioId, mapData);
    }
  );
  electron.ipcMain.handle(
    IPC.MAP_GET,
    (_e, campaignId, scenarioId, mapId) => storage.getMap(campaignId, scenarioId, mapId)
  );
  electron.ipcMain.handle(
    IPC.MAP_UPDATE,
    (_e, campaignId, scenarioId, mapId, data) => storage.updateMap(campaignId, scenarioId, mapId, data)
  );
  electron.ipcMain.handle(
    IPC.MAP_DELETE,
    (_e, campaignId, scenarioId, mapId) => storage.deleteMap(campaignId, scenarioId, mapId)
  );
  electron.ipcMain.handle(
    IPC.MAP_GET_IMAGE_URL,
    (_e, absolutePath) => storage.getImageUrl(absolutePath)
  );
}
function registerBestiaryHandlers(bestiary) {
  electron.ipcMain.handle(IPC.BESTIARY_GET_INDEX, () => bestiary.getIndex());
  electron.ipcMain.handle(
    IPC.BESTIARY_GET_LETTER,
    (_e, letter, edition) => bestiary.getByLetter(letter, edition)
  );
  electron.ipcMain.handle(
    IPC.BESTIARY_GET_MONSTER,
    (_e, name, source) => bestiary.getMonster(name, source)
  );
}
function registerDialogHandlers() {
  electron.ipcMain.handle(IPC.DIALOG_OPEN_IMAGE, async () => {
    const result = await electron.dialog.showOpenDialog({
      title: "Select Image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
      properties: ["openFile"]
    });
    return result.canceled ? null : result.filePaths[0];
  });
  electron.ipcMain.handle(IPC.DIALOG_OPEN_TOKEN, async () => {
    const result = await electron.dialog.showOpenDialog({
      title: "Select Token Image",
      filters: [{ name: "Images", extensions: ["png", "jpg", "jpeg", "webp"] }],
      properties: ["openFile"]
    });
    return result.canceled ? null : result.filePaths[0];
  });
}
class StorageService {
  base;
  constructor() {
    this.base = electron.app.getPath("userData");
  }
  // --- Path helpers ---
  campaignsDir() {
    return path.join(this.base, "campaigns");
  }
  campaignDir(id) {
    return path.join(this.campaignsDir(), id);
  }
  campaignFile(id) {
    return path.join(this.campaignDir(id), "campaign.json");
  }
  scenarioDir(campaignId, scenarioId) {
    return path.join(this.campaignDir(campaignId), "scenarios", scenarioId);
  }
  scenarioFile(campaignId, scenarioId) {
    return path.join(this.scenarioDir(campaignId, scenarioId), "scenario.json");
  }
  mapDir(campaignId, scenarioId, mapId) {
    return path.join(this.scenarioDir(campaignId, scenarioId), "maps", mapId);
  }
  mapFile(campaignId, scenarioId, mapId) {
    return path.join(this.mapDir(campaignId, scenarioId, mapId), "map.json");
  }
  mapImageDir(campaignId, scenarioId, mapId) {
    return this.mapDir(campaignId, scenarioId, mapId);
  }
  tokensDir() {
    return path.join(this.base, "tokens");
  }
  // --- Validation ---
  assertWithinBase(filePath) {
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(path.resolve(this.base))) {
      throw new Error(`Path outside app data: ${filePath}`);
    }
  }
  // --- Utilities ---
  async ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
  }
  async readJson(filePath) {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  }
  async writeJson(filePath, data) {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }
  // --- Campaign ---
  async listCampaigns() {
    await this.ensureDir(this.campaignsDir());
    let entries;
    try {
      entries = await fs.readdir(this.campaignsDir());
    } catch {
      return [];
    }
    const campaigns = [];
    for (const entry of entries) {
      const file = this.campaignFile(entry);
      try {
        const campaign = await this.readJson(file);
        campaigns.push(campaign);
      } catch {
      }
    }
    return campaigns.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async getCampaign(id) {
    return this.readJson(this.campaignFile(id));
  }
  async createCampaign(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const campaign = {
      ...data,
      id: nanoid.nanoid(),
      createdAt: now,
      updatedAt: now
    };
    await this.writeJson(this.campaignFile(campaign.id), campaign);
    return campaign;
  }
  async updateCampaign(id, data) {
    const existing = await this.getCampaign(id);
    const updated = {
      ...existing,
      ...data,
      id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.writeJson(this.campaignFile(id), updated);
    return updated;
  }
  async deleteCampaign(id) {
    await fs.rm(this.campaignDir(id), { recursive: true, force: true });
  }
  // --- Player Characters (stored in campaign.json) ---
  async addPlayerCharacter(campaignId, pc) {
    const campaign = await this.getCampaign(campaignId);
    const newPc = { ...pc, id: nanoid.nanoid() };
    campaign.playerCharacters.push(newPc);
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters });
    return newPc;
  }
  async updatePlayerCharacter(campaignId, pcId, data) {
    const campaign = await this.getCampaign(campaignId);
    campaign.playerCharacters = campaign.playerCharacters.map(
      (pc) => pc.id === pcId ? { ...pc, ...data } : pc
    );
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters });
  }
  async deletePlayerCharacter(campaignId, pcId) {
    const campaign = await this.getCampaign(campaignId);
    campaign.playerCharacters = campaign.playerCharacters.filter((pc) => pc.id !== pcId);
    await this.updateCampaign(campaignId, { playerCharacters: campaign.playerCharacters });
  }
  // --- Scenario ---
  async listScenarios(campaignId) {
    const campaign = await this.getCampaign(campaignId);
    const scenarios = [];
    for (const scenarioId of campaign.scenarioIds) {
      try {
        const scenario = await this.readJson(this.scenarioFile(campaignId, scenarioId));
        scenarios.push(scenario);
      } catch {
      }
    }
    return scenarios;
  }
  async getScenario(campaignId, scenarioId) {
    return this.readJson(this.scenarioFile(campaignId, scenarioId));
  }
  async createScenario(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const scenario = {
      ...data,
      id: nanoid.nanoid(),
      createdAt: now,
      updatedAt: now
    };
    await this.writeJson(this.scenarioFile(scenario.campaignId, scenario.id), scenario);
    const campaign = await this.getCampaign(scenario.campaignId);
    if (!campaign.scenarioIds.includes(scenario.id)) {
      campaign.scenarioIds.push(scenario.id);
      await this.updateCampaign(scenario.campaignId, { scenarioIds: campaign.scenarioIds });
    }
    return scenario;
  }
  async updateScenario(campaignId, scenarioId, data) {
    const existing = await this.getScenario(campaignId, scenarioId);
    const updated = {
      ...existing,
      ...data,
      id: scenarioId,
      campaignId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.writeJson(this.scenarioFile(campaignId, scenarioId), updated);
    return updated;
  }
  async deleteScenario(campaignId, scenarioId) {
    await fs.rm(this.scenarioDir(campaignId, scenarioId), { recursive: true, force: true });
    const campaign = await this.getCampaign(campaignId);
    campaign.scenarioIds = campaign.scenarioIds.filter((id) => id !== scenarioId);
    await this.updateCampaign(campaignId, { scenarioIds: campaign.scenarioIds });
  }
  // --- Map ---
  async getMap(campaignId, scenarioId, mapId) {
    return this.readJson(this.mapFile(campaignId, scenarioId, mapId));
  }
  async saveMap(campaignId, scenarioId, mapId, data) {
    const updated = { ...data, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapId), updated);
    return updated;
  }
  async createMap(campaignId, scenarioId, mapData) {
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapData.id), mapData);
    const scenario = await this.getScenario(campaignId, scenarioId);
    if (!scenario.maps.find((m) => m.id === mapData.id)) {
      scenario.maps.push(mapData);
      await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps });
    }
    return mapData;
  }
  async updateMap(campaignId, scenarioId, mapId, data) {
    const existing = await this.getMap(campaignId, scenarioId, mapId);
    const updated = {
      ...existing,
      ...data,
      id: mapId,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await this.writeJson(this.mapFile(campaignId, scenarioId, mapId), updated);
    const scenario = await this.getScenario(campaignId, scenarioId);
    scenario.maps = scenario.maps.map((m) => m.id === mapId ? updated : m);
    await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps });
    return updated;
  }
  async deleteMap(campaignId, scenarioId, mapId) {
    await fs.rm(this.mapDir(campaignId, scenarioId, mapId), { recursive: true, force: true });
    const scenario = await this.getScenario(campaignId, scenarioId);
    scenario.maps = scenario.maps.filter((m) => m.id !== mapId);
    await this.updateScenario(campaignId, scenarioId, { maps: scenario.maps });
  }
  async getImageUrl(absolutePath) {
    this.assertWithinBase(absolutePath);
    return `file://${absolutePath.replace(/\\/g, "/")}`;
  }
}
class ImageService {
  /**
   * Copy an image file to the destination directory, returning the new path.
   */
  async copyImage(sourcePath, destDir, filename) {
    await fs.mkdir(destDir, { recursive: true });
    const destPath = path.join(destDir, filename);
    await fs.copyFile(sourcePath, destPath);
    return destPath;
  }
  /**
   * Parse a UVTT or DD2VTT file.
   * Extracts the base64 image, writes it to destDir as image.png, and returns
   * { imagePath, uvttData }.
   */
  async parseUVTT(sourcePath, destDir) {
    const raw = await fs.readFile(sourcePath, "utf-8");
    const json = JSON.parse(raw);
    const base64Image = json.image || json.map_image || "";
    if (!base64Image) {
      throw new Error("UVTT file does not contain an embedded image");
    }
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");
    await fs.mkdir(destDir, { recursive: true });
    const imagePath = path.join(destDir, "image.png");
    await fs.writeFile(imagePath, imageBuffer);
    const uvttData = {
      format: json.format ?? 0,
      resolution: json.resolution ?? {
        map_origin: { x: 0, y: 0 },
        map_size: { x: 0, y: 0 },
        pixels_per_grid: 70
      },
      line_of_sight: json.line_of_sight ?? [],
      objects_line_of_sight: json.objects_line_of_sight,
      portals: json.portals ?? [],
      lights: json.lights ?? [],
      environment: json.environment
    };
    return { imagePath, uvttData };
  }
}
class BestiaryService {
  index = null;
  letterCache = /* @__PURE__ */ new Map();
  get resourcesPath() {
    if (electron.app.isPackaged) {
      return path.join(process.resourcesPath, "bestiary");
    }
    return path.join(__dirname, "../../../resources/bestiary");
  }
  async getIndex() {
    if (this.index) return this.index;
    let files;
    try {
      files = await fs.readdir(this.resourcesPath);
    } catch {
      this.index = [];
      return [];
    }
    const index = [];
    for (const file of files) {
      if (!file.endsWith(".json") || file.includes("fluff")) continue;
      const letterMatch = file.match(/^bestiary(?:-2024)?-([a-z])\.json$/);
      if (!letterMatch) continue;
      const letterKey = letterMatch[1];
      const edition = file.includes("2024") ? "2024" : "2014";
      try {
        const raw = await fs.readFile(path.join(this.resourcesPath, file), "utf-8");
        const data = JSON.parse(raw);
        for (const m of data.monster) {
          const cr = typeof m.cr === "object" && m.cr !== null && "cr" in m.cr ? m.cr.cr : m.cr;
          const type = typeof m.type === "object" && m.type !== null ? m.type.type : m.type ?? "unknown";
          index.push({
            name: m.name,
            source: m.source,
            page: m.page,
            cr,
            type,
            size: m.size,
            edition,
            letterKey
          });
        }
      } catch {
      }
    }
    this.index = index;
    return index;
  }
  async getByLetter(letter, edition) {
    const cacheKey = `${edition}-${letter}`;
    if (this.letterCache.has(cacheKey)) {
      return this.letterCache.get(cacheKey);
    }
    const filename = edition === "2024" ? `bestiary-2024-${letter}.json` : `bestiary-${letter}.json`;
    const filePath = path.join(this.resourcesPath, filename);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(raw);
      this.letterCache.set(cacheKey, data.monster);
      return data.monster;
    } catch {
      return [];
    }
  }
  async getMonster(name, source) {
    const index = await this.getIndex();
    const entry = index.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.source === source
    );
    if (!entry) return null;
    const monsters = await this.getByLetter(entry.letterKey, entry.edition);
    return monsters.find((m) => m.name === name && m.source === source) ?? null;
  }
}
function registerAllHandlers() {
  const storage = new StorageService();
  const image = new ImageService();
  const bestiary = new BestiaryService();
  registerCampaignHandlers(storage);
  registerScenarioHandlers(storage);
  registerMapHandlers(storage, image);
  registerBestiaryHandlers(bestiary);
  registerDialogHandlers();
  electron.ipcMain.handle(IPC.APP_GET_VERSION, () => electron.app.getVersion());
  electron.ipcMain.handle(IPC.APP_GET_DATA_PATH, () => electron.app.getPath("userData"));
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#1a1a2e",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.vtt.app");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  registerAllHandlers();
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
