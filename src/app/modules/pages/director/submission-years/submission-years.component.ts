import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubmissionYearsService } from 'app/core/services/admin/submission-years.service';

@Component({
    selector: 'app-submission-years',
    templateUrl: './submission-years.component.html',
    styleUrls: ['./submission-years.component.scss']
})
export class SubmissionYearsComponent implements AfterViewInit {

    @ViewChild(MatSort) sort: MatSort;

    displayedColumns: string[] = ['year', 'createdAt', 'updatedAt', 'active', 'toggle'];
    dataSource: MatTableDataSource<any>;
    currentYear: number;
    submissionYearMissing: boolean = false;

    private years: any;

    constructor(public submissionYearsService: SubmissionYearsService) {
        this.currentYear = (new Date()).getFullYear();
        this.dataSource = new MatTableDataSource([]);
    }

    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
        this.getSubmissionYears();
    }

    toggleSubmissionYear(subID: string): void {
        const yearFound = this.years.find(y => y.subID === subID);
        this.submissionYearsService.toggleSubmissionYear(yearFound._id, !yearFound.active).subscribe({
            next: () => { this.getSubmissionYears(); },
            error: (err) => { console.error('toggleSubmissionYear error', err); }
        });
    }

    createSubmissionYear(): void {
        this.submissionYearsService.createSubmissionYear().subscribe({
            next: () => { this.getSubmissionYears(); },
            error: (err) => { console.error('createSubmissionYear error', err); }
        });
    }

    private getSubmissionYears(): void {
        this.submissionYearsService.getAllSubmissionYears(undefined).subscribe({
            next: (years) => {
                this.years = years;
                this.dataSource = new MatTableDataSource(this.years);
                this.dataSource.sort = this.sort;
                this.checkCurrentYearSubmissionYear();
            },
            error: (err) => { console.error('getAllSubmissionYears error', err); }
        });
    }

    private checkCurrentYearSubmissionYear(): void {
        this.submissionYearMissing = !this.years?.find(y => y.year === this.currentYear);
    }
}
