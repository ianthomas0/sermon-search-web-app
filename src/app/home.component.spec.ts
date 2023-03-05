import { TestBed, ComponentFixture } from '@angular/core/testing';

import { expect } from '@skyux-sdk/testing';

// Component we're going to test
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { SearchService } from './shared/search.service';

describe('Home component', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        {
          provide: SearchService,
          useValue: jasmine.createSpy('SearchService'),
        },
      ],
      declarations: [HomeComponent],
      imports: [FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
  });

  it('should create the component', () => {
    expect(fixture.componentInstance).toExist();
  });
});
