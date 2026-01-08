const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const TAMANHO_MAXIMO_PREVIA = 80;

class HistoryMenu {
  constructor(applet) {
    this.applet = applet;
    this.history = [];
    this._loadHistory();

    this.menu = new PopupMenu.PopupMenu(applet.actor, 0.0, St.Side.TOP);
    this.menuManager = new PopupMenu.PopupMenuManager(applet);
    this.menuManager.addMenu(this.menu);

    Main.uiGroup.add_actor(this.menu.actor);
    this.menu.actor.hide();

    this._buildHeader();
    this.referesh();
  }

  _buildHeader() {
    let header = new PopupMenu.PopupMenuItem("Clipboard History", {
      reactive: false,
    });

    this.menu.addMenuItem(header);
    this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
  }

  _getConfigDir() {
    let dir =
      GLib.get_user_config_dir() +
      "/cinnamon/configs/clipboard-history@willian";
    global.log("dir", dir);
    return dir;
  }

  saveHistory() {
    try {
      let dir = this._getConfigDir();
      GLib.mkdir_with_parents(dir, 0o755);

      let file = Gio.File.new_for_path(dir + "/history.json");

      let data = JSON.stringify(this.history);
      let encoder = new TextEncoder();
      data = encoder.encode(data);

      file.replace_contents(
        data,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
      );
    } catch (e) {
      logError(e, "Erro ao salvar histórico");
    }
  }

  _loadHistory() {
    try {
      let dir = this._getConfigDir();

      let file = Gio.File.new_for_path(dir + "/history.json");

      if (!file.query_exists(null)) return;

      let [success, contents] = file.load_contents(null);
      if (!success) return;

      let decoder = new TextDecoder("utf-8");
      contents = decoder.decode(contents);

      this.history = JSON.parse(contents);
    } catch (e) {
      logError(e, "Erro ao carregar histórico");
      this.history = [];
    }
  }

  referesh() {
    let items = this.menu._getMenuItems();
    while (items.length > 2) {
      items[2].destroy();
      items = this.menu._getMenuItems();
    }

    if (this.history.length === 0) {
      this.menu.addMenuItem(
        new PopupMenu.PopupMenuItem("Nenhum item no histórico", {
          reactive: false,
        })
      );

      return;
    }

    this.history.forEach((text, index) => {
      let preview = text.replace(/\n/g, " ");
      if (preview.length > TAMANHO_MAXIMO_PREVIA) {
        preview = preview.substring(0, TAMANHO_MAXIMO_PREVIA) + "...";
      }

      let item = new PopupMenu.PopupMenuItem(preview);

      item.connect("activate", () => {
        this.applet.setClipboardText(text);
        this.menu.close();
      });

      this.menu.addMenuItem(item);
    });
  }

  open() {
    this.referesh();
    this.menu.open();
    this.menuIsOpen = true;
  }

  toggle() {
    this.menu.toggle();
  }

  destroy() {
    this.menu.destroy();
  }
}

var HistoryMenuExport = HistoryMenu;
