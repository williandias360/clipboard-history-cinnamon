const St = imports.gi.St;
const Mainloop = imports.mainloop;

class ClipboardTracker {
  constructor(onChangeCallback) {
    this.clipboard = St.Clipboard.get_default();
    this.lastText = null;
    this.onChange = onChangeCallback;

    // Intervalo de polling (500ms é padrão aceito)
    this._loopId = Mainloop.timeout_add(500, () => this._checkClipboard());
  }

  _checkClipboard() {
    this.clipboard.get_text(St.ClipboardType.CLIPBOARD, (clipboard, text) => {
      if (!text || text === this.lastText) return true;

      this.lastText = text;

      if (this.onChange) {
        this.onChange(text);
      }
    });

    return true; // Continue o loop
  }

  destroy() {
    if (this._loopId) {
      Mainloop.source_remove(this._loopId);
      this._loopId = null;
    }
  }
}

var ClipboardTrackerExport = ClipboardTracker;
