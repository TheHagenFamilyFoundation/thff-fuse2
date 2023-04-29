import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-director',
  templateUrl: './director.component.html',
  styleUrls: ['./director.component.scss']
})
export class DirectorComponent implements OnInit {

  constructor(private _router: Router) { }

  ngOnInit(): void {
  }

  goToOrganizations(): void {
    //route to director - organizations
    console.log('route to organizations');

    this._router.navigate(['/pages/director/organizations']);
  }

  goToProposals(): void {
    //route to director - proposals
    console.log('route to proposals');
    this._router.navigate(['/pages/director/proposals']);

}

  goToVoting(): void {
    //route to director - voting
    console.log('route to voting');
    this._router.navigate(['/pages/director/voting']);

  }

}
