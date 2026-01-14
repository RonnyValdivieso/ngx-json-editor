import { Component } from '@angular/core';
import { NgxJsonEditorModule } from '../../../ngx-json-editor/src/lib/ngx-json-editor.module';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxJsonEditorModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  data = `{"name": "Ronny"}`;

  onJsonChange(newJson: any) {
    console.log('Nuevo JSON:', newJson);
  }
}
