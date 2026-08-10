import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { STATUS_LABEL, STATUS_VEHICLE_LABEL } from '../core/utils';

@Component({
  selector: 'app-task-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span class="badge" [ngClass]="'badge-' + status">{{ label }}</span>`,
})
export class TaskBadgeComponent {
  @Input() status: string = 'upcoming';
  get label(): string {
    return STATUS_LABEL[this.status as keyof typeof STATUS_LABEL] ?? this.status;
  }
}

@Component({
  selector: 'app-vehicle-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span class="badge" [ngClass]="badgeClass">{{ label }}</span>`,
})
export class VehicleBadgeComponent {
  @Input() status: string = 'active';
  get label(): string {
    return STATUS_VEHICLE_LABEL[this.status] ?? this.status;
  }
  get badgeClass(): string {
    if (this.status === 'active') return 'badge-success';
    if (this.status === 'maintenance') return 'badge-warning';
    return 'badge-secondary';
  }
}
