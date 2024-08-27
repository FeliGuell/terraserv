# APP - TERRASERV

Sistema para gestionar informes de estudios geofísicos.

![image](https://github.com/user-attachments/assets/f8cc8c69-3fba-43e0-8d65-3637cb5b9dc4)




## Índice
1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Diagrama de la base de datos](#diagrama-de-la-base-de-datos)
5. [Instalación y Configuración](#instalación-y-configuración)
   - [Backend (API)](#backend-api)
   - [Frontend (Cliente)](#frontend-cliente)
6. [Uso](#uso)
   - [Ejecutar el Backend](#ejecutar-el-backend)
   - [Ejecutar el Frontend](#ejecutar-el-frontend)
7. [Despliegue](#despliegue)
8. [Contacto](#contacto)




## Descripción del Proyecto

Es una aplicación web para gestionar los informes de estudios geofísicos de una empresa. Esta solución permite a la empresa centralizar todos sus informes de los estudios geofísicos, que antes estaban dispersos en diversas carpetas locales en diferentes computadoras. La aplicación facilita la creación, gestión y visualización de estudios geofísicos mediante una interfaz intuitiva y funcionalidades avanzadas como la carga de archivos, almacenamiento en Amazon S3, búsqueda en un mapa interactivo con Leaflet.js, y autocompletado de ubicaciones con Google Places API.




## Tecnologías Utilizadas

Listado de las tecnologías, lenguajes, frameworks y herramientas que se utilizaron para desarrollar el proyecto.

### Backend (API)
- Maven
- Spring Boot 3.2.1
- Java 17
- MySQL 8.0.15
- Spring Security
- Spring Validation
- Lombok 1.18.30
- Apache commons IO 2.15.1
- Amazon Java SDK 2.0.0
- Amazon Java SDK S3 1.11.371
- Json WEB token 0.12.3

### Frontend (Cliente)
- Angular 17.3.11
- TypeScript 5.4.5
- Bootstrap 5.3.2
- Angular JWT 5.2.0
- JQuery 3.7.1
- File saver 2.0.7
- JWT decode 4.0.0
- Leaflet 1.9.4
- Ngx image compress 15.1.6
- Popper 1.16.1
- SweetAlert2 11.10.2





## Estructura del Proyecto

```plaintext
/terraserv
│
├── /api            # Código del servidor (Backend)
│   ├── src
│   ├── pom.xml     # Configuración del proyecto Maven
│   └── /main
|       ├── / resources
|       |   └── application.properties    # Configuración de las propiedades
|       |
|       └── /java/com/felipeguell/terraserv/api/rest
|                                                   ├── /amazon             # Gestión y configuración de archivos en Amazon S3
|                                                   ├── /auditor            # Implementación de interfaz de auditoría
|                                                   ├── /auth               # Gestión y configuración de la autenticación
|                                                   ├── /config             # Clases de configuración 
|                                                   ├── /controllers        # Controladores 
|                                                   ├── /exceptionHandler   # Excepciones customizadas 
|                                                   ├── /jwt                # Gestión y configuración de Json WEB Token
|                                                   ├── /models             # Clases entidad, enum y dao
|                                                   ├── /services           # Servicios 
|                                                   └── /util               # Configuración de variables estáticas
|                                                    
│
|
├── /cliente        # Código del cliente (Frontend)
│   ├── /src
|   |   ├──/app
|   |   |     ├── /core
|   |   |     |    ├── /contants      # Configuración de constantes
|   |   |     |    ├── /models        # Interfaces de tipo modelo
|   |   |     |    └── /services      # Configuración de servicios
|   |   |     ├── /features
|   |   |     |     ├── /auth/login   # Componente de logueo
|   |   |     |     ├── /estudios     # Componentes relacionados a los informes de los estudios geofísicos
|   |   |     |     └── /mapa         # Componentes relacionados al mapa
|   |   |     ├── /guards           # Configuración de las guardas
|   |   |     ├── /shared           # Componentes compartidos
|   |   |     ├── app-routing.module.ts     # Configuración de enrutamiento
|   |   |     └── app.module.ts             # Configuración de módulos
|   |   |       
|   |   ├──/asset            # Imágenes
|   |   └──/environments     # Variables globales de configuración
|   | 
│   └── package.json # Configuración del proyecto Angular
│   
│
└── README.md       # Documentación del proyecto
```





## Diagrama de la base de datos

![image](https://github.com/user-attachments/assets/74b69e2d-0538-4bc2-ad27-a44015d3dbf3)




## Instalación y Configuración

  - Backend API
   * Instalación
      1. Instalar Java 17+. Link para descarga: https://www.oracle.com/java/technologies/downloads/#jdk17-windows
      2. Instalar MySQL 8+. Link para descarga: https://dev.mysql.com/downloads/mysql/8.0.html
      3. Instalar Intellij IDEA. Link para descarga: https://www.jetbrains.com/es-es/idea/download/?section=windows
      4. Dentro de Intellij IDEA, descargar e instalar el plugin Lombok 
      5. Descargar la carpeta /api del proyecto y abrirla con Intellij IDEA.
      6. Instalar todas las dependencias de Maven
  * Configuración
      1. **Crear la Base de Datos:** Utiliza MySQL Workbench para crear la base de datos necesaria para la aplicación.
      2. **Configurar application.properties:** En el archivo application.properties, asegúrate de configurar correctamente los siguientes parámetros: 
        - Conexión a MySQL
        - Credenciales de Amazon Web Services (AWS)
        - Zona horaria para Jackson.
        - Parámetros multipart (opcional).  
      3. **Crear un Bucket S3 en AWS:** En Amazon Web Services, sigue este tutorial en YouTube para crear un bucket S3 en AWS: https://www.youtube.com/watch?v=UeWDXpufOAc.
      4. **Configuración del Bucket S3:**
      ![image](https://github.com/user-attachments/assets/9b04c90a-9caf-46f4-adb6-8cfcd31d4bb1)
      5. Crear un Usuario IAM en AWS: Crea un usuario IAM en AWS para obtener las credenciales necesarias. 
      Asegúrate de asignar la política AmazonS3FullAccess al usuario.
      Puedes seguir este tutorial en YouTube para más detalles. https://www.youtube.com/watch?v=ubrE4xq9_9c
      Una vez creado, accede a las credenciales desde la cuenta raíz en la sección de usuarios IAM:
      ![iam](https://github.com/user-attachments/assets/e2ca5e1f-4782-43ba-8999-ca2da5b766a0).
      6. **Configurar Utilidades:** En la carpeta /util, edita la clase AmazonWebServicesUtils para configurar el nombre del bucket creado.
      En JwtUtils, configura la clave secreta donde se requiere. Las demás clases utils son opcionales y pueden ser configuradas según sea necesario.
      7. **Configuraciones en /config:**
        - InitUsersConfig: Se crea un usuario por defecto en caso de que no exista. Aquí puedes configurar el username y password.
        - AwsConfig: Asegúrate de que la región configurada coincida con la región elegida para el bucket S3.
        - SecurityConfig: En esta configuración, el usuario con rol "ADMIN" puede realizar cualquier acción, mientras que el rol "USER" tiene restricciones. 
        Tenlo en cuenta al crear nuevos usuarios.
        - CorsConfig: Asegúrate de configurar la ruta correcta para permitir solicitudes de origen cruzado (CORS).
      
  -FrontEnd Cliente
   * Instalación
       1. Instalar node.js. Link para descarga: https://nodejs.org/en
       2. Instalar Visual Studio Code. Link para descarga: https://code.visualstudio.com/Download
       3. Descargar la carpeta /client del proyecto y abrirla con Visual Studio Code
       4. Instalar todas las dependencias con npm install
   * Configuración
       1. En environment.ts colocar las claves para las API.
       2. Crear la clave API_KEY_GOOGLE_PLACES. Puede seguir la documentación en este enlace: https://developers.google.com/maps/documentation/places/web-service/get-api-key?hl=es-419.
       3. Crear la clave API_KEY_STADIA_MAPS.Puede seguir la documentación en este enlace: https://docs.stadiamaps.com/authentication/
       4. DELAY simula un retraso en el inicio de sesión, eliminarselo o ponerlo en 0. 
    




## Uso
   - Ejecutar el Backend
     En Intellij IDEA, ejecutar TerraservApiRestApplication.

   - Ejecutar el Frontend
     En Visual Studio Code, ejecutar con el comando "ng serve" en la terminal.




## Despliegue
  Para el deploy del backend: https://www.youtube.com/watch?v=cMXTd6PoFpo. 




## Contacto
  - Gmail: feliguells@gmail.com
  - Telefono: +54 9 2645-846-555
  
  

     
     
  
      
  




