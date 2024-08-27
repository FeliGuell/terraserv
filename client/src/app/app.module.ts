import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { EstudioFormComponent } from './features/estudios/estudio-form/estudio-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ImagenFormComponent } from './features/estudios/imagen-form/imagen-form.component';
import { ArchivoFormComponent } from './features/estudios/archivo-form/archivo-form.component';
import { CoordenadasFormComponent } from './features/estudios/coordenadas-form/coordenadas-form.component';
import { NgOptimizedImage } from '@angular/common';
import { MapaComponent } from './features/mapa/mapa/mapa.component';
import { BusquedaComponent } from './features/mapa/busqueda/busqueda.component';
import { HeaderComponent } from './shared/header/header.component';
import { LoginComponent } from './features/auth/login/login.component';
import { FooterComponent } from './shared/footer/footer.component';
import { JwtInterceptorService } from './core/services/auth/jwt-interceptor.service';
import { ErrorHttpInterceptorService } from './core/services/errores/error-http-interceptor.service';
import { ErrorGlobalHandlerService } from './core/services/errores/error-global-handler.service';
import { EstudioDetailComponent } from './features/estudios/estudio-detail/estudio-detail.component';
import { EstudioRegisterComponent } from './features/estudios/estudio-register/estudio-register.component';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';



@NgModule({
  declarations: [
    AppComponent,
    EstudioFormComponent,
    ImagenFormComponent,
    ArchivoFormComponent,
    CoordenadasFormComponent,
    MapaComponent,
    BusquedaComponent,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    EstudioDetailComponent,
    EstudioRegisterComponent
  ],
  imports: [
    BrowserModule, 
    HttpClientModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
  providers: [
    {provide:HTTP_INTERCEPTORS, useClass:JwtInterceptorService, multi:true}, 
    {provide:HTTP_INTERCEPTORS, useClass:ErrorHttpInterceptorService, multi:true},
    {provide: ErrorHandler, useClass: ErrorGlobalHandlerService}, 
    {provide: JWT_OPTIONS, useValue: JWT_OPTIONS},
    JwtHelperService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
