import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupplyQueue } from './supply-queue';

describe('SupplyQueue', () => {
  let component: SupplyQueue;
  let fixture: ComponentFixture<SupplyQueue>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplyQueue],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplyQueue);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
