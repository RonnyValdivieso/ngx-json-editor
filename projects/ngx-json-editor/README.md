# ngx-json-editor

A powerful and flexible JSON editor component for Angular applications with syntax highlighting, validation, and advanced editing features.

[![npm version](https://badge.fury.io/js/ngx-json-editor.svg)](https://badge.fury.io/js/ngx-json-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Rich JSON Editing Experience**
- Syntax highlighting for JSON
- Real-time validation
- Format and minify JSON
- Sort keys alphabetically
- Search and highlight functionality

🎨 **Customizable Controls**
- Configurable toolbar buttons
- Format, minify, sort, search, copy, download, reset, and load operations
- Standalone components for maximum flexibility

🚀 **Modern Angular**
- Built with Angular 18+
- Standalone components support
- TypeScript support
- Reactive forms compatible

## Installation

```bash
npm install ngx-json-editor json-editor-core
```

## Usage

### Basic Example

Import the component in your Angular component:

```typescript
import { Component } from '@angular/core';
import { NgxJsonEditorComponent } from 'ngx-json-editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxJsonEditorComponent],
  template: `
    <ngx-json-editor
      [data]="jsonData"
      (dataChange)="onDataChange($event)">
    </ngx-json-editor>
  `
})
export class AppComponent {
  jsonData = {
    name: 'John Doe',
    age: 30,
    email: 'john@example.com'
  };

  onDataChange(newData: any) {
    console.log('JSON data changed:', newData);
  }
}
```

### With Custom Configuration

You can customize which toolbar buttons are displayed:

```typescript
import { Component } from '@angular/core';
import { NgxJsonEditorComponent, JsonEditorConfig } from 'ngx-json-editor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NgxJsonEditorComponent],
  template: `
    <ngx-json-editor
      [data]="jsonData"
      [config]="editorConfig"
      (dataChange)="onDataChange($event)">
    </ngx-json-editor>
  `
})
export class AppComponent {
  jsonData = { /* your JSON data */ };
  
  editorConfig: JsonEditorConfig = {
    buttons: {
      format: true,
      minify: true,
      sort: true,
      search: true,
      copy: true,
      download: true,
      reset: false,
      load: false
    }
  };

  onDataChange(newData: any) {
    console.log('JSON data changed:', newData);
  }
}
```

### Using with NgModule

If you're using NgModule instead of standalone components:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgxJsonEditorModule } from 'ngx-json-editor';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    NgxJsonEditorModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## API

### NgxJsonEditorComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `any` | `{}` | The JSON data to edit |
| `config` | `JsonEditorConfig` | All buttons enabled | Configuration for toolbar buttons |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `dataChange` | `EventEmitter<any>` | Emitted when the JSON data changes |

### JsonEditorConfig

```typescript
interface JsonEditorConfig {
  buttons?: {
    format?: boolean;    // Format JSON with indentation
    minify?: boolean;    // Minify JSON (remove whitespace)
    sort?: boolean;      // Sort keys alphabetically
    search?: boolean;    // Enable search functionality
    copy?: boolean;      // Copy JSON to clipboard
    download?: boolean;  // Download JSON as file
    reset?: boolean;     // Reset to original data
    load?: boolean;      // Load JSON from file
  };
}
```

## Development

### Building the Library

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Running the Demo

```bash
npm start
```

Navigate to `http://localhost:4200/` to see the demo application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Ronny Valdivieso**

## Links

- [GitHub Repository](https://github.com/RonnyValdivieso/ngx-json-editor)
- [Report Issues](https://github.com/RonnyValdivieso/ngx-json-editor/issues)
- [npm Package](https://www.npmjs.com/package/ngx-json-editor)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
