import { Component } from '@angular/core';
import { LinkDialogComponent } from '../link-dialog/link-dialog.component';
import { LinkOptionsDialogComponent } from '../link-options-dialog/link-options-dialog.component';
import Quill from 'quill';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent {
  content = '';
    charCount = 0;
    MAX = 250;
    private quillInstance: any;
    prevContents: any = null;
    prevSelection: any = null;
    modules = {
      toolbar: {
        container: [['link']], // only link icon
        handlers: {
          link: () => {
            const range = this.quillInstance.getSelection();
            if (!range) return;

            // Check if selection already has a link
            const [link, offset] = this.quillInstance.scroll.descendant(
              Quill.import('formats/link'),
              range.index
            );

            if (link) {
              return;
            } else {
              this.openLinkDialog();
            }
          }
        }
      }
    };
  
    constructor(private dialog: MatDialog) {}
  
    // onEditorCreated(quillInstance: Quill) {
    //   this.quillInstance = quillInstance;
  
    //   this.prevContents = this.quillInstance.getContents();
    //   this.prevSelection = this.quillInstance.getSelection();
    //   this.charCount = this.getTextLength();
  
    //   this.quillInstance.root.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));
    //   this.quillInstance.root.addEventListener('click', (e: MouseEvent) => this.onEditorClick(e));
  
    //   this.quillInstance.on('text-change', (delta: any, oldDelta: any, source: any) => {
    //     const len = this.getTextLength();
    //     if (len <= this.MAX) {
    //       if (source === 'user') {
    //         this.prevContents = this.quillInstance.getContents();
    //         this.prevSelection = this.quillInstance.getSelection();
    //       }
    //       this.charCount = len;
    //     } else {
    //       if (this.prevContents) {
    //         this.quillInstance.setContents(this.prevContents);
    //         if (this.prevSelection) {
    //           this.quillInstance.setSelection(this.prevSelection.index, this.prevSelection.length);
    //         }
    //       } else {
    //         const text = this.quillInstance.getText().substring(0, this.MAX);
    //         this.quillInstance.setText(text);
    //       }
    //       this.charCount = this.getTextLength();
    //     }
    //   });
    // }

    onEditorCreated(quillInstance: Quill) {
      this.quillInstance = quillInstance;
  
      this.prevContents = this.quillInstance.getContents();
      this.prevSelection = this.quillInstance.getSelection();
      this.charCount = this.getTextLength();
  
      this.quillInstance.root.addEventListener('paste', (e: ClipboardEvent) => this.onPaste(e));
      this.quillInstance.root.addEventListener('click', (e: MouseEvent) => this.onEditorClick(e));
  
      this.quillInstance.on('text-change', (delta: any, oldDelta: any, source: any) => {
        const len = this.getTextLength();
        if (len <= this.MAX) {
          if (source === 'user') {
            this.prevContents = this.quillInstance.getContents();
            this.prevSelection = this.quillInstance.getSelection();
          }
          this.charCount = len;
        } else {
          if (this.prevContents) {
            this.quillInstance.setContents(this.prevContents);
            if (this.prevSelection) {
              this.quillInstance.setSelection(this.prevSelection.index, this.prevSelection.length);
            }
          } else {
            const text = this.quillInstance.getText().substring(0, this.MAX);
            this.quillInstance.setText(text);
          }
          this.charCount = this.getTextLength();
        }
      });
    }

    onEditorClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      let node: HTMLElement | null = target;
      while (node && node !== this.quillInstance.root && node.tagName !== 'A') {
        node = node.parentElement;
      }
      if (node && node.tagName === 'A') {
        try {
          const blot: any = Quill.find(node);
          const index = this.quillInstance.getIndex(blot);
          let length = 0;
          if (typeof blot.length === 'function') {
            length = blot.length();
          } else {
            length = (node as HTMLElement).innerText.length || 1;
          }
  
          const url = (node as HTMLAnchorElement).getAttribute('href') || '';
          const currentText = (node as HTMLElement).innerText || '';
  
          const optRef = this.dialog.open(LinkOptionsDialogComponent, {
            width: '360px',
            data: { url, text: currentText }
          });
  
          optRef.afterClosed().subscribe(choice => {
            if (!choice) return;
            if (choice === 'modify') {
              this.openLinkDialog({ index, length, currentText, currentUrl: url });
            } else if (choice === 'remove') {
              this.quillInstance.formatText(index, length, 'link', false, 'user');
              this.prevContents = this.quillInstance.getContents();
              this.prevSelection = this.quillInstance.getSelection();
              this.charCount = this.getTextLength();
            }
          });
        } catch (err) {
          console.warn('Could not determine link index/length', err);
        }
      }
    }


    // onEditorClick(e: MouseEvent) {
    //   const target = e.target as HTMLElement;
    //   let node: HTMLElement | null = target;
    //   while (node && node !== this.quillInstance.root && node.tagName !== 'A') {
    //     node = node.parentElement;
    //   }
    //   if (node && node.tagName === 'A') {
    //     try {
    //       const blot: any = Quill.find(node);
    //       const index = this.quillInstance.getIndex(blot);
    //       let length = 0;
    //       if (typeof blot.length === 'function') {
    //         length = blot.length();
    //       } else {
    //         length = (node as HTMLElement).innerText.length || 1;
    //       }
  
    //       const url = (node as HTMLAnchorElement).getAttribute('href') || '';
    //       const currentText = (node as HTMLElement).innerText || '';
  
    //       const optRef = this.dialog.open(LinkOptionsDialogComponent, {
    //         width: '360px',
    //         data: { url, text: currentText }
    //       });
  
    //       optRef.afterClosed().subscribe(choice => {
    //         if (!choice) return;
    //         if (choice === 'modify') {
    //           this.openLinkDialog({ index, length, currentText, currentUrl: url });
    //         } else if (choice === 'remove') {
    //           this.quillInstance.formatText(index, length, 'link', false, 'user');
    //           this.prevContents = this.quillInstance.getContents();
    //           this.prevSelection = this.quillInstance.getSelection();
    //           this.charCount = this.getTextLength();
    //         }
    //       });
    //     } catch (err) {
    //       console.warn('Could not determine link index/length', err);
    //     }
    //   }
    // }

      openLinkDialog(replaceRange?: { index: number; length: number; currentText?: string; currentUrl?: string }) {
        const dialogRef = this.dialog.open(LinkDialogComponent, {
          width: '420px',
          data: {
            text: replaceRange?.currentText || '',
            url: replaceRange?.currentUrl || ''
          }
        });
    
        dialogRef.afterClosed().subscribe(result => {
          if (!result) return;
          const { text, url } = result;
          if (!text) return;
    
          if (replaceRange) {
            this.quillInstance.deleteText(replaceRange.index, replaceRange.length, 'user');
            this.quillInstance.insertText(replaceRange.index, text, 'user');
            this.quillInstance.formatText(replaceRange.index, text.length, 'link', url, 'user');
            this.quillInstance.setSelection(replaceRange.index + text.length, 0, 'user');
          } else {
            const sel = this.quillInstance.getSelection(true);
            const insertIndex = sel ? sel.index : this.quillInstance.getLength();
            this.quillInstance.insertText(insertIndex, text, 'user');
            this.quillInstance.formatText(insertIndex, text.length, 'link', url, 'user');
            this.quillInstance.setSelection(insertIndex + text.length, 0, 'user');
          }
          this.prevContents = this.quillInstance.getContents();
          this.prevSelection = this.quillInstance.getSelection();
          this.charCount = this.getTextLength();
        });
      }
    // openLinkDialog(replaceRange?: { index: number; length: number; currentText?: string; currentUrl?: string }) {
    //     const dialogRef = this.dialog.open(LinkDialogComponent, {
    //       width: '420px',
    //       data: {
    //         text: replaceRange?.currentText || '',
    //         url: replaceRange?.currentUrl || ''
    //       }
    //     });
    
    //     dialogRef.afterClosed().subscribe(result => {
    //       if (!result) return;
    //       const { text, url } = result;
    //       if (!text) return;
    
    //       if (replaceRange) {
    //         this.quillInstance.deleteText(replaceRange.index, replaceRange.length, 'user');
    //         this.quillInstance.insertText(replaceRange.index, text, 'user');
    //         this.quillInstance.formatText(replaceRange.index, text.length, 'link', url, 'user');
    //         this.quillInstance.setSelection(replaceRange.index + text.length, 0, 'user');
    //       } else {
    //         const sel = this.quillInstance.getSelection(true);
    //         const insertIndex = sel ? sel.index : this.quillInstance.getLength();
    //         this.quillInstance.insertText(insertIndex, text, 'user');
    //         this.quillInstance.formatText(insertIndex, text.length, 'link', url, 'user');
    //         this.quillInstance.setSelection(insertIndex + text.length, 0, 'user');
    //       }
    //       this.prevContents = this.quillInstance.getContents();
    //       this.prevSelection = this.quillInstance.getSelection();
    //       this.charCount = this.getTextLength();
    //     });
    //   }

    getTextLength(): number {
      const len = this.quillInstance ? Math.max(0, this.quillInstance.getText().replace(/\n$/, '').length) : 0;
      return len;
    }

    onPaste(e: ClipboardEvent) {
      e.preventDefault();
      const clipboard = e.clipboardData || (window as any).clipboardData;
      const pastedText = clipboard.getData('text/plain') || '';
      const currentLen = this.getTextLength();
      const maxAllowed = this.MAX - currentLen;
      if (maxAllowed <= 0) {
        return;
      }
      const toInsert = pastedText.substring(0, maxAllowed);
      const sel = this.quillInstance.getSelection(true);
      const insertIndex = sel ? sel.index : this.quillInstance.getLength();
      this.quillInstance.insertText(insertIndex, toInsert, 'user');
      this.quillInstance.setSelection(insertIndex + toInsert.length, 0, 'user');
    }
}
