import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { EstudioFormComponent } from './features/estudios/estudio-form/estudio-form.component';
import { MapaComponent } from './features/mapa/mapa/mapa.component';
import { authGuard } from './guards/auth.guard';
import { EstudioDetailComponent } from './features/estudios/estudio-detail/estudio-detail.component';
import { EstudioRegisterComponent } from './features/estudios/estudio-register/estudio-register.component';
import { roleGuard } from './guards/role.guard';


const routes: Routes = [
  {
    path: 'login', 
    component: LoginComponent
  },
  {
    path: 'estudios', 
    component: MapaComponent,
    canMatch:[authGuard, roleGuard], 
    data: { expectedRole: 'ADMIN', contexto: 'mapa'}
  },
  {
    path: 'estudios/form', 
    component: EstudioFormComponent,
    canMatch:[authGuard , roleGuard ], 
    data: { expectedRole: 'ADMIN' }
  },
  {
    path: 'estudios/form/:id', 
    component: EstudioFormComponent,
    canMatch:[authGuard ,roleGuard ], 
    data: { expectedRole: 'ADMIN' }
  },
  {
    path: 'estudios/details/:id', 
    component: EstudioDetailComponent,
    canMatch:[authGuard ,roleGuard ], 
    data: { expectedRole: 'ADMIN' }
  },
  {
    path: 'estudios/registros', 
    component: EstudioRegisterComponent,
    canMatch:[authGuard ,roleGuard ], 
    data: { expectedRole: 'ADMIN', contexto: 'registro'}
  },
  {
    path: '**', 
    redirectTo: '/login'
  },
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forRoot(routes)
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
