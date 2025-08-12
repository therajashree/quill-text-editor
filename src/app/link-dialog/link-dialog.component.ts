import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-link-dialog',
  templateUrl: './link-dialog.component.html',
  styleUrls: ['./link-dialog.component.css']
})
export class LinkDialogComponent {
  textControl = new FormControl(this.data.text || '', [Validators.required]);
  urlControl = new FormControl(this.data.url || '', [Validators.required]);

  constructor(
    public dialogRef: MatDialogRef<LinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { text: string; url: string }
  ) {}

  save() {
    if (this.textControl.invalid || this.urlControl.invalid) return;
    this.dialogRef.close({ text: this.textControl.value, url: this.urlControl.value });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
