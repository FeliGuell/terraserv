import { Component, OnInit } from '@angular/core';
import { LoginService } from 'src/app/core/services/auth/login.service';
import { jwtDecode } from "jwt-decode";


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  userLoginOn: boolean = false;
  username: string;

  constructor(private loginService: LoginService) {}

  ngOnInit(): void {
    // Verificar si el usuario está logueado
    this.loginService.currentUserLoginOn.subscribe({
      next: (userLoginOn) => {
        this.userLoginOn = userLoginOn;
      },
    });

    this.loginService.userData.subscribe((token) => {
      if(token){
        const decodedToken = jwtDecode(token);
        if(decodedToken){
          this.username = this.capitalizeFirstLetter(decodedToken.sub!);
        }
      }
    });
  }

  logout(): void {
    this.loginService.logout();
  }

  private capitalizeFirstLetter(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}


