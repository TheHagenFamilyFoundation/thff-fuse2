import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-org-doc501c3',
  templateUrl: './org-doc501c3.component.html',
  styleUrls: ['./org-doc501c3.component.scss']
})
export class OrgDoc501c3Component implements OnInit {

  outputStatus:any;
  HasUpload501c3:boolean=false;
  Rejected501c3:boolean=false;
  CanUpload501c3:boolean=false;
  Submitted:boolean=false;
  file: File;
  constructor() { }

  ngOnInit(): void {
  }

  fileChange(event): void {
    console.log('fileChange', event);

    const fileList: FileList = event.target.files;
    if (fileList.length > 0) {
      this.file = fileList[0];

      this.CanUpload501c3 = true;
    } else {
      this.CanUpload501c3 = false;
    }
  }
  upload(event): void {
  }  
  get501c3(event): void {
  }  
  delete501c3check(event): void {
  }
  uploadReplacement(event): void {
  }
}
