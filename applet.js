const Applet = imports.ui.applet;
const St = imports.gi.St;

const UUID = "clipboard-history@willian";

const HistoryMenu = imports.ui.appletManager.applets[UUID].ui.historyMenu;

const ClipboardTracker =
  imports.ui.appletManager.applets[UUID].clipboard.clipboardTracker;

const Main = imports.ui.main;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;

const HOT_KEY_NAME_SUPER_V = "clipboard-history-toggle-menu-super-v";
const HOT_KEY_NAME_CTRL_ALT_V = "clipboard-history-toggle-menu-ctrl-alt-v";
const HOT_KEYS = {
  [HOT_KEY_NAME_SUPER_V]: "<Super>v",
  [HOT_KEY_NAME_CTRL_ALT_V]: "<Ctrl><Alt>V",
};

class ClipboardHistoryApplet extends Applet.Applet {
  constructor(metadata, orientation, panelHeight, instanceId) {
    super(orientation, panelHeight, instanceId);
    this.settings = new Settings.AppletSettings(
      this,
      metadata.uuid,
      instanceId
    );

    this.settings.bind("maxItems", "maxItems", this._onSettingsChanged);

    this.settings.bind(
      "avoidDuplicates",
      "avoidDuplicates",
      this._onSettingsChanged
    );

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
    this.historyMenu.menu.connect("open-state-changed", (_, isOpen) => {
      if (!isOpen && this._pointerActor) {
        this._pointerActor.destroy();
        this._pointerActor = null;
      }
    });

    this._registerShortcut();
  }

  _onClipboardChanged(text) {
    if (!text || text.trim() === "") return;

    if (this.avoidDuplicates) {
      this.historyMenu.history = this.historyMenu.history.filter(
        (item) => item.trim() !== text.trim()
      );
    }

    this.historyMenu.history.unshift(text);

    if (this.historyMenu.history.length > this.maxItems) {
      this.historyMenu.history.pop();
    }

    this.historyMenu.saveHistory();

    global.log(`[ClipboardHistory] Copied: ${text.substring(0, 50)}`);
  }

  _openMenuAtPointer() {
    this.historyMenu.menu.close();

    if (this._pointerActor) {
      this._pointerActor.destroy();
      this._pointerActor = null;
    }

    let [x, y] = global.get_pointer();

    this._pointerActor = new Clutter.Actor({
      x,
      y,
      width: 1,
      height: 1,
      reactive: false,
    });

    Main.uiGroup.add_actor(this._pointerActor);
    this.historyMenu.menu.sourceActor = this._pointerActor;

    this.historyMenu.referesh();
    this.historyMenu.open();
  }

  _onSettingsChanged() {
    if (this.historyMenu.history.length > this.maxItems) {
      this.historyMenu.history = this.historyMenu.history.slice(
        0,
        this.maxItems
      );
    }
  }

  _registerShortcut() {
    Object.keys(HOT_KEYS).forEach((hotkey) => {
      Main.keybindingManager.addHotKey(hotkey, HOT_KEYS[hotkey], () => {
        this._openMenuAtPointer();
      });
    });
  }

  setClipboardText(text) {
    let clipboard = St.Clipboard.get_default();
    clipboard.set_text(St.ClipboardType.CLIPBOARD, text);
  }

  on_applet_clicked() {
    try {
      this.historyMenu.menu.close();

      if (this._pointerActor) {
        this._pointerActor.destroy();
        this._pointerActor = null;
      }

      this.historyMenu.menu.sourceActor = this.actor;

      this.historyMenu.referesh();
      this.historyMenu.open();
    } catch (e) {
      global.logError(e);
    }
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
