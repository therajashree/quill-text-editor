import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import Quill from 'quill';
import { MatDialog } from '@angular/material/dialog';
import { LinkDialogComponent } from './link-dialog/link-dialog.component';
import { LinkOptionsDialogComponent } from './link-options-dialog/link-options-dialog.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  @ViewChild('quillEditorRef', { static: true }) quillEditorRef!: ElementRef;

  quill!: Quill;
  modules: any = {
    // we will not use the built-in toolbar; we'll use a custom toolbar placed below
    toolbar: false
  };

  prevContents: any = null;
  prevSelection: any = null;
  charCount = 0;
  MAX = 250;

  constructor(private dialog: MatDialog, private ngZone: NgZone) {}

  ngOnInit() {}

  onEditorCreated(quillInstance: Quill) {
    this.quill = quillInstance;

    // initialize prevContents
    this.prevContents = this.quill.getContents();
    this.prevSelection = this.quill.getSelection();

    // update charCount
    this.charCount = this.getTextLength();

    this.quill.root.addEventListener('input', () => {
      this.ngZone.run(() => {
        this.charCount = this.getTextLength();
      });
    });

    // add paste handler to limit paste size
    this.quill.root.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));

    // click handler to open link options when clicking a link
    this.quill.root.addEventListener('click', (e: MouseEvent) => this.onEditorClick(e));

    // listen to text-change to enforce limit
    this.quill.on('text-change', (delta: any, oldDelta: any, source: any) => {
      const len = this.getTextLength();
      if (len <= this.MAX) {
        // keep last good state only for user changes
        if (source === 'user') {
          this.prevContents = this.quill.getContents();
          this.prevSelection = this.quill.getSelection();
        }
        this.charCount = len;
      } else {
        // exceeded limit: revert to previous contents and restore selection
        // only revert if there is a previous state
        if (this.prevContents) {
          this.quill.setContents(this.prevContents);
          if (this.prevSelection) {
            this.quill.setSelection(this.prevSelection.index, this.prevSelection.length);
          }
        } else {
          // fallback: trim to MAX
          const text = this.quill.getText().substring(0, this.MAX);
          this.quill.setText(text);
        }
        this.charCount = this.getTextLength();
      }
    });
  }

  getTextLength(): number {
    // quill.getLength includes trailing newline; subtract 1 for visible chars
    const len = this.quill ? Math.max(0, this.quill.getText().replace(/\n$/, '').length) : 0;
    return len;
  }

  public get hasLink(): boolean {
    if (!this.quill) {
      return false;
    }
    const delta = this.quill.getContents();
    let hasLink = false;
    delta.ops?.forEach(op => {
      if (op.attributes?.link) {
        hasLink = true;
      }
    });
    return hasLink;
  }

  openLinkDialog(replaceRange?: { index: number; length: number; currentText?: string; currentUrl?: string }) {
    // If we're adding a new link (not replacing) and a link already exists, block
    if (!replaceRange && this.hasLink) {
      alert('Only one link is allowed in the editor.');
      return;
    }

    // Get current selection
    const sel = this.quill.getSelection(true);
    const selectedText = sel && sel.length > 0 ? this.quill.getText(sel.index, sel.length) : '';

    const dialogRef = this.dialog.open(LinkDialogComponent, {
      width: '420px',
      data: {
        text: replaceRange?.currentText || selectedText || '',
        url: replaceRange?.currentUrl || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      const { text, url } = result;
      if (!text) return;

      // Determine range for replacement
      let index: number;
      let length: number;

      if (replaceRange) {
        index = replaceRange.index;
        length = replaceRange.length;
      } else if (sel && sel.length > 0) {
        index = sel.index;
        length = sel.length;
      } else {
        index = this.quill.getLength(); // append to end if nothing selected
        length = 0;
      }

      // Replace the selected text with new link text
      this.quill.deleteText(index, length, 'user');
      this.quill.insertText(index, text, 'user');
      this.quill.formatText(index, text.length, 'link', url, 'user');
      this.quill.setSelection(index + text.length, 0, 'user');

      this.prevContents = this.quill.getContents();
      this.prevSelection = this.quill.getSelection();
      this.charCount = this.getTextLength();
    });
  }

  // Handler for clicking on the editor area: if click target is a link, open the options popup
  onEditorClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    let node: HTMLElement | null = target;
    while (node && node !== this.quill.root && node.tagName !== 'A') {
      node = node.parentElement;
    }
    if (node && node.tagName === 'A') {
      // found anchor node
      // use Quill's Parchment to find blot and index
      try {
        const blot: any = Quill.find(node);
        const index = this.quill.getIndex(blot);
        let length = 0;
        // attempt to get length via blot.length(), otherwise fallback to text length
        if (typeof blot.length === 'function') {
          length = blot.length();
        } else {
          length = (node as HTMLElement).innerText.length || 1;
        }

        // open options dialog
        const url = (node as HTMLAnchorElement).getAttribute('href') || '';
        const currentText = (node as HTMLElement).innerText || '';

        const optRef = this.dialog.open(LinkOptionsDialogComponent, {
          width: '360px',
          data: { url, text: currentText }
        });

        optRef.afterClosed().subscribe(choice => {
          if (!choice) return;
          if (choice === 'modify') {
            // open the add/modify dialog prefilled; pass replaceRange
            this.openLinkDialog({ index, length, currentText, currentUrl: url });
          } else if (choice === 'remove') {
            // remove link formatting but keep text
            this.quill.formatText(index, length, 'link', false, 'user');
            this.prevContents = this.quill.getContents();
            this.prevSelection = this.quill.getSelection();
            this.charCount = this.getTextLength();
          }
        });
      } catch (err) {
        console.warn('Could not determine link index/length', err);
      }
    }
  }

  onAddLinkButton() {
    this.openLinkDialog();
  }

  onPaste(e: ClipboardEvent) {
    e.preventDefault();
    const clipboard = e.clipboardData || (window as any).clipboardData;
    const pastedText = clipboard.getData('text/plain') || '';
    const currentLen = this.getTextLength();
    const maxAllowed = this.MAX - currentLen;
    if (maxAllowed <= 0) {
      return; // nothing allowed
    }
    const toInsert = pastedText.substring(0, maxAllowed);
    const sel = this.quill.getSelection(true);
    const insertIndex = sel ? sel.index : this.quill.getLength();
    this.quill.insertText(insertIndex, toInsert, 'user');
    this.quill.setSelection(insertIndex + toInsert.length, 0, 'user');
  }
}
