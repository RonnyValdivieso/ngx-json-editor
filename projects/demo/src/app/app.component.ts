import { Component } from '@angular/core';
import { NgxJsonEditorModule } from '../../../ngx-json-editor/src/lib/ngx-json-editor.module';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxJsonEditorModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  data = `{"name": "Ronny"}`;

  onJsonChange(newJson: any) {
    console.log('Nuevo JSON:', newJson);
  }
}
