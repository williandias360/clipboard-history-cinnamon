const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Main = imports.ui.main;

class HistoryMenu {
  constructor(applet) {
    this.applet = applet;
    this.history = [];

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
      if (preview.length > 50) {
        preview = preview.substring(0, 50) + "...";
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
