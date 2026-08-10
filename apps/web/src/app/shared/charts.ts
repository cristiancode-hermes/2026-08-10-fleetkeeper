import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { CostRow, EfficiencyEntry } from '../core/models';
import { fmtMonth } from '../core/utils';

@Component({
  selector: 'app-cost-bar-chart',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="chart" *ngIf="data.length > 0">
      <svg [attr.viewBox]="'0 0 ' + width + ' 180'" class="chart-svg" preserveAspectRatio="none">
        <ng-container *ngFor="let row of data; let i = index">
          <rect
            [attr.x]="barX(i)"
            [attr.y]="barY(row.total)"
            [attr.width]="barWidth"
            [attr.height]="barHeight(row.total)"
            class="chart-bar"
          >
            <title>{{ fmtMonth(row.month) }} — {{ row.total }} €</title>
          </rect>
        </ng-container>
        <line *ngFor="let g of gridLines" [attr.y1]="g.y" [attr.y2]="g.y" x1="0" [attr.x2]="width" class="chart-grid" />
      </svg>
      <div class="chart-labels">
        <span *ngFor="let row of data" class="chart-label">{{ shortMonth(row.month) }}</span>
      </div>
    </div>
    <p class="muted empty-hint" *ngIf="data.length === 0">Sin datos en el periodo.</p>
  `,
})
export class CostBarChartComponent {
  @Input() data: CostRow[] = [];
  width = 560;

  get max(): number {
    const m = Math.max(...this.data.map((d) => d.total), 0);
    return m > 0 ? m : 1;
  }
  get gridLines(): { y: number }[] {
    return [0.25, 0.5, 0.75].map((f) => ({ y: 170 - f * 160 }));
  }
  get barWidth(): number {
    return Math.max(12, Math.min(40, (this.width - this.data.length * 12) / Math.max(1, this.data.length)));
  }
  barX(i: number): number {
    return i * (this.barWidth + 14) + 4;
  }
  barY(v: number): number {
    return 170 - this.barHeight(v);
  }
  barHeight(v: number): number {
    return Math.max(2, (v / this.max) * 160);
  }
  fmtMonth(m: string): string {
    return fmtMonth(m);
  }
  shortMonth(m: string): string {
    return m.split('-')[1] ?? m;
  }
}

@Component({
  selector: 'app-efficiency-chart',
  standalone: true,
  imports: [NgIf, NgFor],
  template: `
    <div class="chart" *ngIf="entries.length > 1">
      <svg [attr.viewBox]="'0 0 ' + width + ' 160'" class="chart-svg" preserveAspectRatio="none">
        <polyline [attr.points]="points" class="chart-line" fill="none" />
        <circle *ngFor="let p of pts" [attr.cx]="p.x" [attr.cy]="p.y" r="3" class="chart-dot">
          <title>{{ p.e.date }} — {{ p.e.lPer100km }} l/100km</title>
        </circle>
      </svg>
      <div class="chart-labels">
        <span *ngFor="let e of entries" class="chart-label">{{ short(e.date) }}</span>
      </div>
    </div>
    <p class="muted empty-hint" *ngIf="entries.length <= 1">Necesitas al menos 2 repostajes de tanque lleno.</p>
  `,
})
export class EfficiencyChartComponent {
  @Input() entries: EfficiencyEntry[] = [];
  width = 560;

  get pts(): { x: number; y: number; e: EfficiencyEntry }[] {
    const n = this.entries.length;
    if (n === 0) return [];
    const maxL = Math.max(...this.entries.map((e) => e.lPer100km), 1);
    return this.entries.map((e, i) => ({
      x: n === 1 ? 0 : (i / (n - 1)) * (this.width - 40) + 20,
      y: 140 - (e.lPer100km / maxL) * 120,
      e,
    }));
  }
  get points(): string {
    return this.pts.map((p) => `${p.x},${p.y}`).join(' ');
  }
  short(d: string): string {
    return d.slice(5).replace('-', '/');
  }
}
