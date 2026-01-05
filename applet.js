const Applet = imports.ui.applet;
const St = imports.gi.St;

const UUID = "clipboard-history@willian";

const HistoryMenu = imports.ui.appletManager.applets[UUID].ui.historyMenu;

// Import correto de módulos locais (Cinnamon)
const ClipboardTracker =
  imports.ui.appletManager.applets[UUID].clipboard.clipboardTracker;

const Main = imports.ui.main;
const HOT_KEY_NAME_SUPER_V = "clipboard-history-toggle-menu-super-v";
const HOT_KEY_NAME_CTRL_ALT_V = "clipboard-history-toggle-menu-ctrl-alt-v";
const HOT_KEYS = {
  [HOT_KEY_NAME_SUPER_V]: "<Super>v",
  [HOT_KEY_NAME_CTRL_ALT_V]: "<Ctrl><Alt>V",
};

class ClipboardHistoryApplet extends Applet.Applet {
  constructor(metadata, orientation, panelHeight, instanceId) {
    super(orientation, panelHeight, instanceId);

    this.label = new St.Label({
      text: "📋",
      y_align: St.Align.MIDDLE,
    });

    this.actor.add_child(this.label);
    this.set_applet_tooltip("Clipboard History");

    this.clipboardTracker = new ClipboardTracker.ClipboardTrackerExport(
      (text) => this._onClipboardChanged(text)
    );

    this.historyMenu = new HistoryMenu.HistoryMenuExport(this);
    this._registerShortcut();
  }

  _onClipboardChanged(text) {
    if (!text || text.trim() === "") return;

    this.historyMenu.history = this.historyMenu.history.filter(
      (item) => item !== text
    );
    this.historyMenu.history.unshift(text);

    if (this.historyMenu.history.length > 10) {
      this.historyMenu.history.pop();
    }

    global.log(`[ClipboardHistory] Copied: ${text.substring(0, 50)}`);
  }

  _registerShortcut() {
    Object.keys(HOT_KEYS).forEach((hotkey) => {
      Main.keybindingManager.addHotKey(hotkey, HOT_KEYS[hotkey], () => {
        this.historyMenu.referesh();
        this.historyMenu.toggle();
      });
    });
  }

  setClipboardText(text) {
    let clipboard = St.Clipboard.get_default();
    clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
  }

  on_applet_clicked() {
    this.historyMenu.referesh();
    this.historyMenu.open();
  }

  on_applet_removed_from_panel() {
    if (this.clipboardTracker) {
      this.clipboardTracker.destroy();
    }

    if (this.historyMenu) {
      this.historyMenu.destroy();
    }

    Main.keybindingManager.removeHotKey(HOT_KEY_NAME_SUPER_V);
    Main.keybindingManager.removeHotKey(HOT_KEY_NAME_CTRL_ALT_V);
  }
}

function main(metadata, orientation, panelHeight, instanceId) {
  return new ClipboardHistoryApplet(
    metadata,
    orientation,
    panelHeight,
    instanceId
  );
}
