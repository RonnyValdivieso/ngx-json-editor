import { Component, effect, Input, output, signal, WritableSignal } from '@angular/core';
import { parseJson, formatJson } from 'json-editor-core';

@Component({
	selector: 'ngx-json-editor',
	standalone: true,
	imports: [],
	template: `
    <div class="editor-container">
      <textarea
				rows="12"
        cols="50"
        [value]="jsonText()"
        (input)="onChange()"
      ></textarea>

      <div class="actions">
        <button type="button" (click)="copy()">Copiar</button>
        <button type="button" (click)="download()">Descargar</button>
        <button type="button" (click)="reset()">Reiniciar</button>
        <input type="file" (change)="loadFile($event)" />
      </div>

      @if(error()) {
        <div class="error">⚠️ Error: {{ error() }}</div>
      }
    </div>
  `,
	styles: `
		.editor-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-family: monospace;
    }
    textarea {
      padding: 0.5rem;
      border-radius: 8px;
      border: 1px solid #ccc;
      font-family: monospace;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
    .error {
      color: red;
      font-weight: bold;
    }
	`
})
export class NgxJsonEditorComponent {
	/** Valor inicial (JSON válido como string) */
	@Input({ required: false }) initialValue = `{\n  "hello": "world"\n}`;

	/** Evento de salida (emite el objeto JSON ya parseado) */
	jsonChange = output<any>();

	/** Estado interno con signals */
	jsonText: WritableSignal<string> = signal(this.initialValue);
	error = signal<string | null>(null);

	constructor() {
		// Efecto reactivo: cada vez que cambia el texto, intentamos parsear
		effect(() => {
			const parsed = parseJson(this.jsonText());
			if (parsed) {
				this.error.set(null);
				this.jsonChange.emit(parsed);
			} else {
				this.error.set('JSON inválido');
			}
		});
	}

	onChange() {
		// ya está controlado por el effect()
	}

	copy() {
		navigator.clipboard.writeText(this.jsonText());
	}

	download() {
		const blob = new Blob([this.jsonText()], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'data.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	reset() {
		this.jsonText.set(this.initialValue);
	}

	loadFile(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result as string;
			if (parseJson(text)) {
				this.jsonText.set(formatJson(text)!);
			} else {
				this.error.set('Archivo inválido');
			}
		};
		reader.readAsText(file);
	}
}
