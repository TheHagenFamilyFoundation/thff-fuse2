import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'custom-editable',
  templateUrl: './editable.component.html',
  styleUrls: ['./editable.component.scss']
})
export class EditableComponent implements OnInit {

  @Input()
  fieldName: string;

  @Input()
  fieldNameValue: string;

  @Input()
  edit: boolean = false;

  @Output() outputFromChild: EventEmitter<string> = new EventEmitter();
  outputText: string = 'Hi ... message from child';

  constructor() {

    console.log('editable - constructor');

  }

  ngOnInit(): void {

    console.log('editable - fieldName value', - this.fieldNameValue);

  }

  sendDataToParent(): void {
    this.outputFromChild.emit(this.outputText);
    }

}
