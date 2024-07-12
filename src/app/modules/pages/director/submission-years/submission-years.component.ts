import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
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

    loaded: boolean;

    currentYear: number;

    years: any;

    year: number;

    yearCount: number;

    submissionYearMissing: boolean;

    constructor(
        public submissionYearsService: SubmissionYearsService,
    ) {
        this.loaded = false;
        this.currentYear = (new Date()).getFullYear();
        // Assign the data to the data source for the table to render
        this.dataSource = new MatTableDataSource(this.years);
    }

    ngAfterViewInit(): void {

        this.getSubmissionYearCount();
        this.getSubmissionYears();

        this.dataSource.sort = this.sort;
    }

    checkCurrentYearSubmissionYear(): void {
        const yearFound = this.years.find(y => y.year === this.currentYear);
        if (yearFound) {
            this.submissionYearMissing = false;
        }
        else {
            this.submissionYearMissing = true;
        }
    }

    getSubmissionYears(): void {
        this.submissionYearsService.getAllSubmissionYears(this.year)
            .subscribe(
                (years) => {
                    console.log('years**', years);
                    this.years = years;
                    this.checkCurrentYearSubmissionYear();
                    this.dataSource = new MatTableDataSource(this.years);
                    this.dataSource.sort = this.sort;
                    console.log('this.dataSource', this.dataSource);
                },
                (err) => {
                    console.log('getAllSubmissionYears - err', err);
                });
    }

    getSubmissionYearCount(): void {
        this.submissionYearsService.getSubmissionYearCount()
            .subscribe(
                (count) => { this.yearCount = count; },
                (err) => {
                    console.log('getSubmissionYearCount - err', err);
                });
    }

    toggleSubmissionYear(subID: string): void {
        console.log('toggle submissionYear', subID);
        //get subID
        const yearFound = this.years.find(y => y.subID === subID);
        console.log('yearFound', yearFound);
        console.log('toggle', yearFound.active);
        this.submissionYearsService.toggleSubmissionYear(yearFound._id, !yearFound.active)
            .subscribe(
                (response) => {
                    console.log('response', response);
                    this.getSubmissionYearCount();
                    this.getSubmissionYears();
                    this.checkCurrentYearSubmissionYear();
                },
                (err) => {
                    console.log('toggleSubmissionYear - err', err);
                });
    }

    createSubmissionYear(): void {
        this.submissionYearsService.createSubmissionYear()
            .subscribe(
                (response) => {
                    this.getSubmissionYearCount();
                    this.getSubmissionYears();
                    this.checkCurrentYearSubmissionYear();
                },
                (err) => {
                    console.log('createSubmissionYear - err', err);
                });
    }

}


