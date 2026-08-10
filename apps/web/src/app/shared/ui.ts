import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{ icon }}</div>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-copy">{{ copy }}</p>
      <button *ngIf="actionLabel" class="btn btn-primary" (click)="action.emit()">{{ actionLabel }}</button>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = '📦';
  @Input() title = '';
  @Input() copy = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}

@Component({
  selector: 'app-error-banner',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="error-banner" *ngIf="message">
      <span>{{ message }}</span>
      <button class="btn btn-secondary btn-sm" (click)="retry.emit()" *ngIf="retriable">Reintentar</button>
    </div>
  `,
})
export class ErrorBannerComponent {
  @Input() message = '';
  @Input() retriable = true;
  @Output() retry = new EventEmitter<void>();
}

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="pagination" *ngIf="total > limit">
      <button class="btn btn-secondary btn-sm" [disabled]="page <= 1" (click)="go(page - 1)">← Anterior</button>
      <span class="page-info mono">Página {{ page }} de {{ pages }}</span>
      <button class="btn btn-secondary btn-sm" [disabled]="page >= pages" (click)="go(page + 1)">Siguiente →</button>
    </div>
  `,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() total = 0;
  @Input() limit = 20;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }
  go(p: number): void {
    this.pageChange.emit(p);
  }
}

/** Modal genérico — overlay + panel. */
@Component({
  selector: 'app-modal',
  standalone: true,
  template: `
    <div class="modal-overlay" (click)="closed.emit()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h3>{{ title }}</h3>
          <button class="icon-btn" (click)="closed.emit()" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
}