import { CustomEditor, type ExtensionAPI, type KeybindingsManager } from "@earendil-works/pi-coding-agent";
import {
  Input,
  Key,
  SelectList,
  matchesKey,
  truncateToWidth,
  visibleWidth,
  wrapTextWithAnsi,
  type Component,
  type EditorTheme,
  type Focusable,
  type SelectItem,
  type TUI,
} from "@earendil-works/pi-tui";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

type PromptHistoryEntry = {
  text: string;
  timestamp: number;
};

type ProjectPromptHistoryFile = {
  version: 1;
  cwd: string;
  entries: PromptHistoryEntry[];
};

type WarningSink = (message: string) => void;

type UiTheme = {
  fg: (color: string, text: string) => string;
  bold: (text: string) => string;
};

const HISTORY_VERSION = 1;
const MAX_STORED_ENTRIES = 500;
const MAX_QUICK_BROWSE_ENTRIES = 100;
const PICKER_MAX_VISIBLE = 10;

function getAgentDir(): string {
  const configured = process.env.PI_CODING_AGENT_DIR?.trim();
  if (configured) return configured;
  return join(homedir(), ".pi", "agent");
}

function normalizeProjectPath(cwd: string): string {
  const normalized = resolve(cwd).replace(/\\/g, "/");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

function projectHash(cwd: string): string {
  return createHash("sha256").update(cwd).digest("hex").slice(0, 16);
}

function isPromptHistoryEntry(value: unknown): value is PromptHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.text === "string" && typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp);
}

function isProjectPromptHistoryFile(value: unknown): value is ProjectPromptHistoryFile {
  if (!value || typeof value !== "object") return false;
  const file = value as Record<string, unknown>;
  return (
    file.version === HISTORY_VERSION &&
    typeof file.cwd === "string" &&
    Array.isArray(file.entries) &&
    file.entries.every(isPromptHistoryEntry)
  );
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

function previewPrompt(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lineCount = text.replace(/\r/g, "").split("\n").length;
  const suffix = lineCount > 1 ? ` (+${lineCount - 1} more lines)` : "";
  return normalized.length > 0 ? `${normalized}${suffix}` : `(blank prompt)${suffix}`;
}

function padLine(text: string, width: number): string {
  const truncated = truncateToWidth(text, width, "");
  return truncated + " ".repeat(Math.max(0, width - visibleWidth(truncated)));
}

class PromptHistoryStore {
  private readonly cache = new Map<string, ProjectPromptHistoryFile>();
  private readonly warnedProjects = new Set<string>();

  private getRootDir(): string {
    return join(getAgentDir(), "prompt-history", "projects");
  }

  private getFilePath(normalizedCwd: string): string {
    return join(this.getRootDir(), `${projectHash(normalizedCwd)}.json`);
  }

  private warnOnce(normalizedCwd: string, message: string, onWarning?: WarningSink): void {
    if (this.warnedProjects.has(normalizedCwd)) return;
    this.warnedProjects.add(normalizedCwd);
    onWarning?.(message);
  }

  private emptyFile(normalizedCwd: string): ProjectPromptHistoryFile {
    return {
      version: HISTORY_VERSION,
      cwd: normalizedCwd,
      entries: [],
    };
  }

  private load(normalizedCwd: string, onWarning?: WarningSink): ProjectPromptHistoryFile {
    const cached = this.cache.get(normalizedCwd);
    if (cached) return cached;

    const filePath = this.getFilePath(normalizedCwd);
    if (!existsSync(filePath)) {
      const empty = this.emptyFile(normalizedCwd);
      this.cache.set(normalizedCwd, empty);
      return empty;
    }

    try {
      const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
      if (!isProjectPromptHistoryFile(parsed)) {
        throw new Error("history file has an unexpected shape");
      }

      const loaded: ProjectPromptHistoryFile = {
        version: HISTORY_VERSION,
        cwd: normalizedCwd,
        entries: parsed.entries.slice(0, MAX_STORED_ENTRIES),
      };
      this.cache.set(normalizedCwd, loaded);
      return loaded;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.warnOnce(
        normalizedCwd,
        `Prompt history is unreadable for this project; starting with empty history (${reason}).`,
        onWarning,
      );
      const empty = this.emptyFile(normalizedCwd);
      this.cache.set(normalizedCwd, empty);
      return empty;
    }
  }

  private save(project: ProjectPromptHistoryFile): void {
    mkdirSync(this.getRootDir(), { recursive: true });
    writeFileSync(this.getFilePath(project.cwd), `${JSON.stringify(project, null, 2)}\n`, "utf8");
  }

  getEntries(cwd: string, onWarning?: WarningSink): PromptHistoryEntry[] {
    const normalizedCwd = normalizeProjectPath(cwd);
    return [...this.load(normalizedCwd, onWarning).entries];
  }

  getRecentEntries(cwd: string, limit = MAX_QUICK_BROWSE_ENTRIES, onWarning?: WarningSink): PromptHistoryEntry[] {
    return this.getEntries(cwd, onWarning).slice(0, limit);
  }

  search(cwd: string, query: string, onWarning?: WarningSink): PromptHistoryEntry[] {
    const normalizedQuery = query.trim().toLowerCase();
    const entries = this.getEntries(cwd, onWarning);
    if (!normalizedQuery) return entries;

    return entries.filter((entry) => entry.text.toLowerCase().includes(normalizedQuery));
  }

  add(cwd: string, text: string, timestamp = Date.now(), onWarning?: WarningSink): void {
    const normalizedCwd = normalizeProjectPath(cwd);
    const project = this.load(normalizedCwd, onWarning);
    const previous = project.entries[0];
    if (previous?.text === text) return;

    const updated: ProjectPromptHistoryFile = {
      ...project,
      entries: [{ text, timestamp }, ...project.entries].slice(0, MAX_STORED_ENTRIES),
    };

    this.cache.set(normalizedCwd, updated);
    this.save(updated);
  }
}

class PromptHistoryEditor extends CustomEditor {
  private readonly keybindings: KeybindingsManager;
  private readonly getRecentEntries: () => PromptHistoryEntry[];
  private browsingHistory = false;
  private browseIndex = -1;
  private browseDraft = "";
  private applyingHistoryText = false;

  constructor(
    tui: TUI,
    theme: EditorTheme,
    keybindings: KeybindingsManager,
    getRecentEntries: () => PromptHistoryEntry[],
  ) {
    super(tui, theme, keybindings);
    this.keybindings = keybindings;
    this.getRecentEntries = getRecentEntries;
  }

  override setText(text: string): void {
    if (this.applyingHistoryText) {
      super.setText(text);
      return;
    }

    this.exitHistoryMode();
    super.setText(text);
  }

  private applyHistoryText(text: string): void {
    this.applyingHistoryText = true;
    try {
      super.setText(text);
    } finally {
      this.applyingHistoryText = false;
    }
  }

  private exitHistoryMode(): void {
    this.browsingHistory = false;
    this.browseIndex = -1;
    this.browseDraft = "";
  }

  private canBrowseOlder(): boolean {
    return this.browsingHistory || this.getText() === "";
  }

  private browseOlder(): void {
    const entries = this.getRecentEntries();
    if (entries.length === 0) return;

    if (!this.browsingHistory) {
      this.browsingHistory = true;
      this.browseDraft = this.getText();
      this.browseIndex = -1;
    }

    const nextIndex = this.browseIndex + 1;
    if (nextIndex >= entries.length) return;

    this.browseIndex = nextIndex;
    this.applyHistoryText(entries[this.browseIndex]!.text);
  }

  private browseNewer(): void {
    if (!this.browsingHistory) return;

    if (this.browseIndex <= 0) {
      const draft = this.browseDraft;
      this.exitHistoryMode();
      this.applyHistoryText(draft);
      return;
    }

    const entries = this.getRecentEntries();
    this.browseIndex -= 1;
    this.applyHistoryText(entries[this.browseIndex]!.text);
  }

  override handleInput(data: string): void {
    if (this.keybindings.matches(data, "tui.editor.cursorUp") && this.canBrowseOlder()) {
      this.browseOlder();
      return;
    }

    if (this.keybindings.matches(data, "tui.editor.cursorDown") && this.browsingHistory) {
      this.browseNewer();
      return;
    }

    const before = this.getText();
    const wasBrowsing = this.browsingHistory;
    super.handleInput(data);

    if (wasBrowsing && before !== this.getText()) {
      this.exitHistoryMode();
    }
  }
}

class PromptHistoryPicker implements Component, Focusable {
  private readonly input = new Input();
  private selectList: SelectList;
  private filteredEntries: PromptHistoryEntry[];
  private _focused = false;

  get focused(): boolean {
    return this._focused;
  }

  set focused(value: boolean) {
    this._focused = value;
    this.input.focused = value;
  }

  constructor(
    private readonly tui: TUI,
    private readonly theme: UiTheme,
    private readonly entries: PromptHistoryEntry[],
    private readonly done: (result: string | null) => void,
  ) {
    this.filteredEntries = entries;
    this.selectList = this.createSelectList(entries);
    this.input.onEscape = () => this.done(null);
    this.input.onSubmit = () => {
      const selected = this.getSelectedEntry();
      if (selected) this.done(selected.text);
    };
  }

  private getSelectedEntry(): PromptHistoryEntry | null {
    const selected = this.selectList.getSelectedItem();
    if (!selected) return this.filteredEntries[0] ?? null;
    const index = Number(selected.value);
    return this.filteredEntries[index] ?? null;
  }

  private buildPreviewLines(entry: PromptHistoryEntry, width: number, maxLines = 5): string[] {
    const rendered: string[] = [];
    const logicalLines = entry.text.replace(/\r/g, "").split("\n");

    for (const logicalLine of logicalLines) {
      const wrapped = logicalLine.length > 0 ? wrapTextWithAnsi(logicalLine, width) : [""];
      for (const line of wrapped) {
        rendered.push(line);
        if (rendered.length >= maxLines) {
          return rendered;
        }
      }
    }

    return rendered.length > 0 ? rendered : [""];
  }

  private createSelectList(entries: PromptHistoryEntry[]): SelectList {
    const items: SelectItem[] = entries.map((entry, index) => ({
      value: String(index),
      label: previewPrompt(entry.text),
      description: formatTimestamp(entry.timestamp),
    }));

    const list = new SelectList(
      items,
      Math.min(PICKER_MAX_VISIBLE, Math.max(1, entries.length)),
      {
        selectedPrefix: (text) => this.theme.fg("accent", text),
        selectedText: (text) => this.theme.fg("accent", text),
        description: (text) => this.theme.fg("muted", text),
        scrollInfo: (text) => this.theme.fg("dim", text),
        noMatch: (text) => this.theme.fg("warning", text),
      },
      {
        minPrimaryColumnWidth: 32,
        maxPrimaryColumnWidth: 80,
      },
    );

    list.onSelect = (item) => {
      const entry = this.filteredEntries[Number(item.value)];
      if (entry) this.done(entry.text);
    };
    list.onCancel = () => this.done(null);
    list.onSelectionChange = () => this.tui.requestRender();

    return list;
  }

  private updateFilter(): void {
    const query = this.input.getValue().trim().toLowerCase();
    this.filteredEntries = query
      ? this.entries.filter((entry) => entry.text.toLowerCase().includes(query))
      : this.entries;
    this.selectList = this.createSelectList(this.filteredEntries);
  }

  handleInput(data: string): void {
    const isSelectionKey =
      matchesKey(data, Key.up) ||
      matchesKey(data, Key.down) ||
      matchesKey(data, Key.enter) ||
      matchesKey(data, Key.escape) ||
      matchesKey(data, Key.ctrl("c"));

    if (this.filteredEntries.length > 0 && isSelectionKey) {
      this.selectList.handleInput(data);
      this.tui.requestRender();
      return;
    }

    const before = this.input.getValue();
    this.input.handleInput(data);
    if (before !== this.input.getValue()) {
      this.updateFilter();
    }
    this.tui.requestRender();
  }

  render(width: number): string[] {
    const outerWidth = Math.max(20, width);
    const innerWidth = Math.max(1, outerWidth - 4);
    const border = (text: string) => this.theme.fg("accent", text);
    const lines: string[] = [];
    const query = this.input.getValue().trim();
    const resultSummary = query
      ? `Matches ${this.filteredEntries.length} of ${this.entries.length}`
      : `${this.entries.length} prompts in this project`;
    const selectedEntry = this.getSelectedEntry();
    const selectedMeta = selectedEntry
      ? `Selected ${formatTimestamp(selectedEntry.timestamp)} • ${selectedEntry.text.replace(/\r/g, "").split("\n").length} lines`
      : "Selected prompt preview";
    const help = this.theme.fg("dim", " Type to filter • ↑↓ navigate • Enter select • Esc cancel ");

    lines.push(border(`┌${"─".repeat(innerWidth + 2)}┐`));
    lines.push(
      `${border("│")} ${padLine(this.theme.fg("accent", this.theme.bold("Prompt History")), innerWidth)} ${border("│")}`,
    );
    lines.push(`${border("│")} ${padLine(this.theme.fg("muted", resultSummary), innerWidth)} ${border("│")}`);
    lines.push(`${border("│")} ${padLine(this.theme.fg("muted", " Search "), innerWidth)} ${border("│")}`);

    for (const line of this.input.render(innerWidth)) {
      lines.push(`${border("│")} ${padLine(line, innerWidth)} ${border("│")}`);
    }

    const listLines = this.selectList.render(innerWidth);
    for (const line of listLines) {
      lines.push(`${border("│")} ${padLine(line, innerWidth)} ${border("│")}`);
    }

    lines.push(`${border("│")} ${padLine(this.theme.fg("muted", selectedMeta), innerWidth)} ${border("│")}`);

    if (selectedEntry) {
      const previewLines = this.buildPreviewLines(selectedEntry, innerWidth, 5);
      for (const line of previewLines) {
        lines.push(`${border("│")} ${padLine(line, innerWidth)} ${border("│")}`);
      }

      const totalRenderedLines = selectedEntry.text.replace(/\r/g, "").split("\n").flatMap((line) =>
        line.length > 0 ? wrapTextWithAnsi(line, innerWidth) : [""],
      ).length;
      if (totalRenderedLines > previewLines.length) {
        lines.push(
          `${border("│")} ${padLine(this.theme.fg("dim", `… ${totalRenderedLines - previewLines.length} more preview lines`), innerWidth)} ${border("│")}`,
        );
      }
    }

    lines.push(`${border("│")} ${padLine(help, innerWidth)} ${border("│")}`);
    lines.push(border(`└${"─".repeat(innerWidth + 2)}┘`));
    return lines;
  }

  invalidate(): void {
    this.input.invalidate();
    this.selectList.invalidate();
  }
}

export default function promptHistory(pi: ExtensionAPI) {
  const store = new PromptHistoryStore();

  pi.on("session_start", async (_event, ctx) => {
    if (!ctx.hasUI) return;

    store.getEntries(ctx.cwd, (message) => ctx.ui.notify(message, "warning"));
    ctx.ui.setEditorComponent((tui, theme, keybindings) =>
      new PromptHistoryEditor(tui, theme, keybindings, () =>
        store.getRecentEntries(ctx.cwd, MAX_QUICK_BROWSE_ENTRIES, (message) => ctx.ui.notify(message, "warning")),
      ),
    );
  });

  pi.on("input", async (event, ctx) => {
    if (event.source !== "interactive") return;

    const trimmed = event.text.trim();
    if (!trimmed) return;
    if (event.text.trimStart().startsWith("/")) return;

    store.add(ctx.cwd, event.text, Date.now(), (message) => {
      if (ctx.hasUI) ctx.ui.notify(message, "warning");
    });
  });

  pi.registerCommand("history", {
    description: "Search recent prompts for this project",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) return;

      const entries = store.getEntries(ctx.cwd, (message) => ctx.ui.notify(message, "warning"));
      if (entries.length === 0) {
        ctx.ui.notify("No prompt history for this project yet.", "info");
        return;
      }

      const selected = await ctx.ui.custom<string | null>(
        (tui, theme, _keybindings, done) => new PromptHistoryPicker(tui, theme, entries, done),
        {
          overlay: true,
          overlayOptions: {
            width: "80%",
            maxHeight: "70%",
            minWidth: 60,
            anchor: "center",
          },
        },
      );

      if (selected !== null) {
        ctx.ui.setEditorText(selected);
      }
    },
  });
}
