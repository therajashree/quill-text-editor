import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-link-options-dialog',
  templateUrl: './link-options-dialog.component.html',
  styleUrls: ['./link-options-dialog.component.css']
})
export class LinkOptionsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<LinkOptionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { url: string; text: string }
  ) {}

  modify() {
    this.dialogRef.close('modify');
  }

  remove() {
    this.dialogRef.close('remove');
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
