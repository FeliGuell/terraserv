import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from 'src/app/core/services/auth/login.service';
import { LoginRequest } from 'src/app/core/services/auth/loginRequest';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  isSubmitting = false;
  loginError: string = ''; // Variable para almacenar mensajes de error en el inicio de sesión

  // Formulario de inicio de sesión con controles para 'username' y 'password'
  loginForm = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private loginService: LoginService
  ) {}

  /**
   * Método que se ejecuta al iniciar el componente.
   *
   * Este método realiza las siguientes acciones:
   * - Se suscribe al observable 'currentUserLoginOn' del servicio de inicio de sesión.
   * - Si el usuario ya ha iniciado sesión (es decir, 'currentUserLoginOn' es verdadero), redirige al usuario a la página de 'estudios'.
   */
  ngOnInit(): void {
    this.loginService.currentUserLoginOn.subscribe({
      next: (userLoginOn) => {
        if (userLoginOn) {
          // Redirige al usuario a la página de 'estudios' si ya ha iniciado sesión
          this.router.navigateByUrl('/estudios');
        }
      },
    });
  }

  /**
   * Realiza el inicio de sesión del usuario.
   *
   * Este método realiza las siguientes acciones:
   * - Verifica si el formulario de inicio de sesión es válido.
   * - Si es válido, llama al servicio de inicio de sesión con los datos del formulario.
   * - En caso de error, captura el mensaje de error.
   * - Al completar la solicitud, redirige al usuario a la página de estudios y reinicia el formulario.
   * - Si el formulario no es válido, marca todos los controles como tocados para mostrar mensajes de validación.
   */
  login(): void {
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.loginError = ''; // Limpiar mensaje de error

      const username = (this.loginForm.value.username || '').trim(); //Eliminar espacios en blanco.
      const password = this.loginForm.value.password || '';

      const loginRequest = { username, password } as LoginRequest;

      this.simulateDelay(1000).then(() => {
        this.loginService.login(loginRequest).subscribe({
          next: () => {},
          error: (errorData) => {
            this.isSubmitting = false;
            // Capturar y mostrar el mensaje de error
            this.loginError = errorData.error.access_denied_reason;
          },
          complete: () => {
            // Redirigir al usuario y resetear el formulario
            this.router.navigateByUrl('/estudios');
            this.loginForm.reset();
          },
        });
      });
    } else {
      // Marcar todos los controles como tocados para mostrar mensajes de validación
      this.loginForm.markAllAsTouched();
    }
  }

  /**
   * Simula un retraso de una cantidad específica de milisegundos.
   *
   * @param milliseconds - El número de milisegundos para retrasar la ejecución.
   * @returns Una promesa que se resuelve después del retraso especificado.
   */
  simulateDelay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  // Getter para acceder al control 'username' del formulario
  get username() {
    return this.loginForm.controls.username;
  }

  // Getter para acceder al control 'password' del formulario
  get password() {
    return this.loginForm.controls.password;
  }
}
