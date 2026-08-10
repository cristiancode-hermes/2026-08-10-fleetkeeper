import { Component, Input } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [NgClass, NgIf],
  template: `
    <div class="card kpi" [ngClass]="'kpi-' + tone">
      <div class="kpi-label">{{ label }}</div>
      <div class="kpi-value mono">{{ value }}</div>
      <div class="kpi-sub" *ngIf="sub">{{ sub }}</div>
    </div>
  `,
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value = '';
  @Input() sub = '';
  @Input() tone: 'default' | 'warning' | 'danger' | 'success' = 'default';
}
