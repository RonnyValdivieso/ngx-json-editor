import { Component } from '@angular/core';
import { NgxJsonEditorModule } from '../../../ngx-json-editor/src/lib/ngx-json-editor.module';
import { CommonModule } from '@angular/common';
import { JsonEditorConfig } from '../../../ngx-json-editor/src/lib/models/json-editor-config';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [CommonModule, NgxJsonEditorModule],
	templateUrl: './app.component.html',
	styleUrl: './app.component.scss'
})
export class AppComponent {
	data = `{
    "name": "Ronny",
    "role": "Developer",
    "skills": ["Angular", "TypeScript", "SCSS"],
    "settings": {
      "theme": "dark",
      "notifications": true
    }
  }`;

	editorConfig: JsonEditorConfig = {
		buttons: {
			minify: false,
			download: false
		}
	};

	onJsonChange(newJson: any) {
		console.log('Nuevo JSON:', newJson);
	}

	onErrorChange(error: string | null) {
		console.log('Error:', error);
	}
}
