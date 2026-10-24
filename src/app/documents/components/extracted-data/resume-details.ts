import { Component, computed, input } from '@angular/core';
import { ResumeData, WorkExperience } from '../../models/extracted-data.model';
import { MISSING_VALUE } from '../../utils/format-amount';
import { FieldList, LabeledValue } from './field-list';

const CURRENT_JOB_LABEL = 'Present';

@Component({
  selector: 'app-resume-details',
  imports: [FieldList],
  template: `
    <div class="space-y-6">
      <app-field-list [fields]="fields()" />

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600">Skills</h3>
        <ul class="mt-2 flex flex-wrap gap-2">
          @for (skill of data().skills; track skill) {
            <li class="rounded-full bg-slate-100 px-2.5 py-0.5 text-sm text-slate-900">
              {{ skill }}
            </li>
          } @empty {
            <li class="text-slate-600">No skills found.</li>
          }
        </ul>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600">Experience</h3>
        <ul class="mt-2 space-y-2 text-slate-900">
          @for (job of data().experience; track $index) {
            <li>
              <span class="font-semibold">{{ job.role ?? missingValue }}</span>
              at {{ job.company }}
              <span class="block text-sm text-slate-600">{{ period(job) }}</span>
            </li>
          } @empty {
            <li class="text-slate-600">No experience found.</li>
          }
        </ul>
      </div>

      <div>
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-600">Education</h3>
        <ul class="mt-2 space-y-2 text-slate-900">
          @for (study of data().education; track $index) {
            <li>
              <span class="font-semibold">{{ study.degree ?? missingValue }}</span>
              — {{ study.institution }}
              @if (study.endYear !== null) {
                <span class="text-slate-600">({{ study.endYear }})</span>
              }
            </li>
          } @empty {
            <li class="text-slate-600">No education found.</li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class ResumeDetails {
  readonly data = input.required<ResumeData>();

  protected readonly missingValue = MISSING_VALUE;

  protected readonly fields = computed<LabeledValue[]>(() => {
    const resume = this.data();
    return [
      { label: 'Name', value: resume.fullName },
      { label: 'Email', value: resume.email },
      { label: 'Phone', value: resume.phone },
      { label: 'Location', value: resume.location },
      { label: 'Profile', value: resume.summary },
    ];
  });

  /** "2024-01 – Present" */
  protected period(job: WorkExperience): string {
    const start = job.startDate ?? MISSING_VALUE;
    return `${start} – ${job.endDate ?? CURRENT_JOB_LABEL}`;
  }
}
