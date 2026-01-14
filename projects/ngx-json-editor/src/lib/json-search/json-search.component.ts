import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'ngx-json-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-search.component.html',
  styleUrls: ['./json-search.component.scss'],
})
export class JsonSearchComponent {
  @Input() searchTerm: string = '';
  @Input() totalMatches: number = 0;
  @Input() currentMatchIndex: number = 0;
  @Input() show: boolean = false;

  @Output() searchTermChange = new EventEmitter<string>();
  @Output() next = new EventEmitter<void>();
  @Output() prev = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  onInput(e: any) {
    this.searchTermChange.emit(e.target.value);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        this.prev.emit();
      } else {
        this.next.emit();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.close.emit();
    }
  }

  focus() {
    this.searchInput?.nativeElement?.focus();
  }
}
