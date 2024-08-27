import { inject } from '@angular/core';
import { CanMatchFn } from '@angular/router';
import { LoginService } from '../core/services/auth/login.service';

export const authGuard: CanMatchFn = (route, state) => {
  const loginService = inject(LoginService);
  return loginService.userLoginOn;
};
