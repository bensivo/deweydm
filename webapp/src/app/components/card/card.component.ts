import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { NzCardModule } from "ng-zorro-antd/card";

@Component({
    selector: 'app-card',
    imports: [CommonModule, NzCardModule],
    templateUrl: './card.component.html',
    styleUrl: './card.component.less'
})
export class CardComponent {
    @Input() title?: string;
}