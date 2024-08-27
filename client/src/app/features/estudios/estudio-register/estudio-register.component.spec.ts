import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstudioRegisterComponent } from './estudio-register.component';

describe('EstudioRegisterComponent', () => {
  let component: EstudioRegisterComponent;
  let fixture: ComponentFixture<EstudioRegisterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EstudioRegisterComponent]
    });
    fixture = TestBed.createComponent(EstudioRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
