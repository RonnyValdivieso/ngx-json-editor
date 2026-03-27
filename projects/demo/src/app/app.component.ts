import { Component } from '@angular/core';
import { NgxJsonEditorComponent } from '../../../ngx-json-editor/src/lib/ngx-json-editor.component';
import { CommonModule } from '@angular/common';
import { JsonEditorConfig } from '../../../ngx-json-editor/src/lib/models/json-editor-config';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, NgxJsonEditorComponent],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent {
	data = `{
  "name": "Ronny",
  "role": "Developer",
  "skills": [
    "Angular",
    "TypeScript",
    "SCSS",
    "Node.js"
  ],
  "settings": {
    "theme": "dark",
    "notifications": true,
    "editor": {
      "fontSize": 14,
      "tabSize": 2,
      "wordWrap": true
    }
  },
  "projects": [
    {
      "name": "ngx-json-editor",
      "stars": 42,
      "tags": ["angular", "json", "editor"]
    },
    {
      "name": "another-lib",
      "stars": 15,
      "tags": ["typescript", "utils"]
    }
  ]
}`;

	editorConfig: JsonEditorConfig = {};

	onJsonChange(newJson: any) {
		console.log('JSON changed:', newJson);
	}

	onErrorChange(error: string | null) {
		if (error) console.warn('JSON error:', error);
	}
}
