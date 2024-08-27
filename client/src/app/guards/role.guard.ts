import { CanActivateFn } from '@angular/router';
import { LoginService } from '../core/services/auth/login.service';
import { inject } from '@angular/core';

export const roleGuard: CanActivateFn = (route, state) => {
  const loginService = inject(LoginService);
  const expectedRole = route.data['expectedRole'];
  const actualRoleArray  = loginService.getRoleFromToken();
  return loginService.checkLoginStatus() && actualRoleArray!.includes(expectedRole);
};
