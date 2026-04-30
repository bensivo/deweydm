import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';

@Component({
  selector: 'app-home-page',
  imports: [CommonModule, NzCardModule, NzButtonModule],
  templateUrl: './home.page.html',
  styleUrl: './home.page.less'
})
export class HomePageComponent {

  onClickHello(): void {
    (window as any).electronApi.helloWorld('Benjamin').then((response: string) => {
      console.log('response', response);
    });
  }

}
