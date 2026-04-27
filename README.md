# Wallet Pipe


## Descripción

Este proyecto se hace para llevar registro de las finanzas personales.

Actualmente permite:
- autenticación con email y contraseña
- gestión de billeteras
- registro de ingresos, gastos, transporte y transferencias
- dashboard con métricas básicas
- reportes iniciales y pantalla básica de configuración


## Correr en dev

1. Clonar el repositorio.
1. Crear una copia del archivo ```.env.template``` y renombrarlo a ```.env``` y cambiar las variables de entorno.
1. Instalar las dependencias ```npm install```
1. Levantar la base de datos ```docker compose up -d```
1. Correr las migraciones de Prisma ```npx prisma migrate dev```
1. Ejecutar seed ```npm run seed```
1. Correr el proyecto ```npm run dev```


## Correr en prod

1. Configurar las variables de entorno reales.
1. Instalar dependencias con ```npm install```.
1. Ejecutar ```npm run prisma:deploy```.
1. Construir con ```npm run build```.
1. Levantar con ```npm run start```.


## Calidad

- ```npm run lint``` valida estilo y reglas de Next.js
- ```npm run typecheck``` ejecuta TypeScript sin emitir archivos
- ```npm run test``` corre pruebas básicas del dominio
- ```npm run check``` ejecuta lint + typecheck + test


## Arquitectura rápida

- `src/app`: rutas y layouts con App Router
- `src/actions`: server actions para auth, billeteras, transacciones y categorías
- `src/lib`: utilidades compartidas de validación, respuestas y reglas financieras
- `src/components`: interfaz y formularios
- `prisma`: esquema y migraciones
