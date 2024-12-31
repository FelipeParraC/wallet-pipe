# Wallet Pipe


## Descripción

Este proyecto se hace para llevar registro de las finanzas personales.


## Correr en dev

1. Clonar el repositorio.
1. Crear una copia del archivo ```.env.template``` y renombrarlo a ```.env``` y cambiar las variables de entorno.
1. Instalar las dependencias ```npm install```
1. Levantar la base de datos ```docker compose up -d```
1. Correr las migraciones de Prisma ```npx prisma migrate dev```
1. Ejecutar seed ```npm run seed```
1. Correr el proyecto ```npm run dev```


## Correr en prod

1. 