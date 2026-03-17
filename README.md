#  Librería Backend — API REST

Sistema de Gestión y Compra de Libros en Línea  
**Stack:** NestJS · PostgreSQL · TypeORM · JWT · Docker

---

## 📋 Tabla de Contenidos

- [Requisitos](#requisitos)
- [Instalación y arranque](#instalación-y-arranque)
- [Variables de entorno](#variables-de-entorno)
- [Autenticación](#autenticación)
- [Roles y permisos](#roles-y-permisos)
- [Módulos y endpoints](#módulos-y-endpoints)
  - [Auth](#1-auth)
  - [Books](#2-books)
  - [Search](#3-search)
  - [Reservations](#4-reservations)
  - [Orders](#5-orders)
  - [Shipping](#6-shipping)
  - [Returns](#7-returns)
  - [Payments](#8-payments)
- [Modelos de datos](#modelos-de-datos)
- [Códigos de respuesta](#códigos-de-respuesta)
- [Notas para el frontend](#notas-para-el-frontend)

---

## Requisitos

- Node.js v18 o superior
- Docker Desktop (para la base de datos)
- npm

---

## Instalación y arranque

### 1. Clonar el repositorio

```bash
git clone <URL-DEL-REPOSITORIO>
cd libreria-backend
```

### 2. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 3. Levantar la base de datos con Docker

```bash
docker run --name libreria-postgres \
  -e POSTGRES_PASSWORD=libreria123 \
  -e POSTGRES_DB=libreria_db \
  -p 5434:5432 \
  -d postgres
```

> Si ya tienes el contenedor creado y apagado, solo ejecuta:
> ```bash
> docker start libreria-postgres
> ```

### 4. Crear el archivo `.env` en la raíz del proyecto

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=postgres
DB_PASSWORD=libreria123
DB_DATABASE=libreria_db

JWT_SECRET=libreria-jwt-secret-2026
JWT_EXPIRES_IN=15m

PORT=3000
NODE_ENV=development
```

### 5. Iniciar el servidor

```bash
npm run start:dev
```

El servidor corre en: **http://localhost:3000**

> Las tablas se crean automáticamente en PostgreSQL gracias a `synchronize: true`.

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto del contenedor Docker | `5434` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `libreria123` |
| `DB_DATABASE` | Nombre de la base de datos | `libreria_db` |
| `JWT_SECRET` | Clave secreta para firmar tokens | — |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `15m` |
| `PORT` | Puerto del servidor NestJS | `3000` |

---

## Autenticación

El sistema usa **JWT (JSON Web Token)** con Bearer Token.

### Flujo básico

1. El usuario se registra → `POST /auth/register`
2. El usuario inicia sesión → `POST /auth/login`
3. El servidor devuelve un `access_token`
4. El frontend debe incluir ese token en todas las peticiones protegidas

### Cómo enviar el token

En el header de cada petición protegida:

```
Authorization: Bearer <access_token>
```

### Duración del token

El token expira en **15 minutos**. Cuando expire, el frontend debe hacer login de nuevo para obtener un token nuevo. Si una petición devuelve `401 Unauthorized`, significa que el token expiró.

---

## Roles y permisos

El sistema tiene 4 roles:

| Rol | Descripción | Puede comprar/reservar |
|---|---|---|
| `root` | Superusuario, solo gestiona admins | ❌ |
| `administrator` | Gestiona libros, envíos, inventario | ❌ |
| `client` | Usuario comprador registrado | ✅ |
| `visitor` | No autenticado, solo búsqueda | ❌ |

> **Importante:** Los endpoints de compra, reserva y pagos solo funcionan con rol `client`. Si se intenta con otro rol, devuelve `403 Forbidden`.

---

## Módulos y endpoints

Base URL: `http://localhost:3000`

---

### 1. Auth

#### `POST /auth/register`
Registra un nuevo cliente. No requiere token.

**Body:**
```json
{
  "username": "juan123",
  "email": "juan@email.com",
  "password": "123456",
  "dni": "1234567890",
  "firstName": "Juan",
  "lastName": "Pérez",
  "birthDate": "2000-01-15",
  "birthPlace": "Pereira",
  "shippingAddress": "Calle 1 # 2-3, Pereira",
  "gender": "masculino"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Usuario registrado exitosamente",
  "access_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "juan123",
    "email": "juan@email.com",
    "role": "client"
  }
}
```

---

#### `POST /auth/login`
Inicia sesión. No requiere token.

**Body:**
```json
{
  "username": "juan123",
  "password": "123456"
}
```

**Respuesta exitosa (201):**
```json
{
  "message": "Inicio de sesión exitoso",
  "access_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "username": "juan123",
    "email": "juan@email.com",
    "role": "client"
  }
}
```

---

### 2. Books

> Todos los endpoints requieren token JWT.

#### `POST /books`
Crea un libro y genera N ejemplares automáticamente con código único.

**Body:**
```json
{
  "title": "Cien años de soledad",
  "author": "Gabriel García Márquez",
  "publicationYear": 1967,
  "genre": "Realismo mágico",
  "pages": 432,
  "publisher": "Editorial Sudamericana",
  "issn": "978-84-397-0494-0",
  "language": "Español",
  "publicationDate": "1967-05-30",
  "condition": "new",
  "price": 45000,
  "quantity": 5
}
```

> `condition` acepta: `"new"` o `"used"`  
> `quantity` define cuántos ejemplares físicos se crean

**Respuesta exitosa (201):**
```json
{
  "message": "Libro registrado exitosamente",
  "book": { "id": 1, "title": "Cien años de soledad", "..." },
  "exemplarsCreated": 5
}
```

---

#### `GET /books`
Lista todos los libros activos con sus ejemplares.

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "title": "Cien años de soledad",
    "author": "Gabriel García Márquez",
    "price": "45000.00",
    "condition": "new",
    "exemplars": [
      {
        "id": 1,
        "uniqueCode": "LIB-1-A3B4C5D6",
        "available": true,
        "outOfStock": false
      }
    ]
  }
]
```

---

#### `GET /books/:id`
Obtiene un libro por ID con todos sus ejemplares.

---

#### `PUT /books/:id`
Actualiza la información de un libro. Acepta los mismos campos del POST, todos opcionales.

---

#### `DELETE /books/:id`
Desactiva un libro (soft delete). No lo elimina físicamente.

---

### 3. Search

> No requiere token. Disponible para todos los usuarios incluyendo visitantes.

#### `GET /search`
Búsqueda multi-criterio. Todos los parámetros son opcionales y combinables.

**Query params disponibles:**

| Parámetro | Tipo | Ejemplo |
|---|---|---|
| `title` | string | `?title=soledad` |
| `author` | string | `?author=García` |
| `genre` | string | `?genre=novela` |
| `publisher` | string | `?publisher=Planeta` |
| `issn` | string | `?issn=978-84` |
| `language` | string | `?language=Español` |
| `condition` | string | `?condition=new` |
| `minPrice` | number | `?minPrice=10000` |
| `maxPrice` | number | `?maxPrice=50000` |
| `publicationYear` | number | `?publicationYear=1967` |

**Ejemplo combinado:**
```
GET /search?author=García&condition=new&minPrice=20000&maxPrice=60000
```

**Respuesta (200):**
```json
{
  "total": 1,
  "results": [
    {
      "id": 1,
      "title": "Cien años de soledad",
      "author": "Gabriel García Márquez",
      "price": "45000.00",
      "condition": "new",
      "exemplars": [...]
    }
  ]
}
```

---

### 4. Reservations

> Requiere token JWT con rol `client`.

#### `POST /reservations`
Crea una reserva. Los ejemplares quedan bloqueados por 24 horas.

**Reglas de negocio:**
- Máximo 5 libros distintos por reserva
- Máximo 3 ejemplares del mismo libro
- La reserva expira automáticamente a las 24 horas (cron job cada 30 min)

**Body:**
```json
{
  "exemplarIds": [1, 2, 3]
}
```

> `exemplarIds` son los IDs de los ejemplares (no de los libros)

**Respuesta exitosa (201):**
```json
{
  "message": "Reserva creada exitosamente",
  "reservation": {
    "id": 1,
    "status": "active",
    "createdAt": "2026-03-17T..."
  },
  "expiresAt": "2026-03-18T..."
}
```

---

#### `GET /reservations`
Lista todas las reservas del cliente autenticado.

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "status": "active",
    "expiresAt": "2026-03-18T...",
    "items": [
      {
        "id": 1,
        "quantity": 1,
        "exemplar": {
          "id": 1,
          "uniqueCode": "LIB-1-A3B4C5D6",
          "book": {
            "id": 1,
            "title": "Cien años de soledad"
          }
        }
      }
    ]
  }
]
```

---

#### `DELETE /reservations/:id`
Cancela una reserva y libera los ejemplares.

**Respuesta (200):**
```json
{
  "message": "Reserva cancelada exitosamente"
}
```

**Estados posibles de una reserva:**

| Estado | Descripción |
|---|---|
| `active` | Reserva vigente (menos de 24h) |
| `expired` | Venció sin confirmarse |
| `cancelled` | Cancelada por el cliente |
| `converted` | Se realizó la compra |

---

### 5. Orders

> Requiere token JWT con rol `client`.

#### `POST /orders`
Realiza una compra. Los ejemplares quedan marcados como no disponibles.

**Body:**
```json
{
  "exemplarIds": [3, 4],
  "deliveryType": "home_delivery",
  "shippingAddress": "Calle 1 # 2-3, Pereira"
}
```

> `deliveryType` acepta: `"home_delivery"` o `"store_pickup"`  
> `shippingAddress` es obligatorio si `deliveryType` es `"home_delivery"`

**Respuesta exitosa (201):**
```json
{
  "message": "Compra realizada exitosamente",
  "order": {
    "id": 1,
    "status": "confirmed",
    "total": "90000.00",
    "deliveryType": "home_delivery"
  },
  "total": 90000
}
```

---

#### `GET /orders`
Lista el historial de compras del cliente autenticado.

---

#### `GET /orders/:id`
Obtiene el detalle de una orden específica con todos los ejemplares comprados.

---

#### `DELETE /orders/:id`
Cancela una orden y libera los ejemplares al inventario.

**Estados posibles de una orden:**

| Estado | Descripción |
|---|---|
| `confirmed` | Compra confirmada |
| `cancelled` | Compra cancelada |

---

### 6. Shipping

> Requiere token JWT.

#### `POST /shipping`
Crea un envío asociado a una orden. Normalmente se llama después de crear una orden.

**Body:**
```json
{
  "orderId": 1,
  "type": "domicilio",
  "destinationAddress": "Calle 1 # 2-3, Pereira"
}
```

> `type` acepta: `"domicilio"` o `"recogida_tienda"`

---

#### `GET /shipping/order/:orderId`
Obtiene el envío asociado a una orden.

**Respuesta (200):**
```json
{
  "id": 1,
  "status": "en_preparacion",
  "type": "domicilio",
  "destinationAddress": "Calle 1 # 2-3, Pereira",
  "estimatedDelivery": "2026-03-22",
  "deliveredAt": null
}
```

---

#### `PUT /shipping/:id/status`
Actualiza el estado del envío. Normalmente lo usa el administrador.

**Body:**
```json
{
  "status": "enviado",
  "observation": "Paquete en camino"
}
```

**Flujo de estados:**
```
en_preparacion → enviado → entregado
```

| Estado | Descripción |
|---|---|
| `en_preparacion` | Pedido siendo empacado |
| `enviado` | En camino al cliente |
| `entregado` | Entregado al cliente |

---

#### `GET /shipping/:id/history`
Obtiene el historial completo de cambios de estado del envío.

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "previousStatus": "en_preparacion",
    "newStatus": "enviado",
    "observation": "Paquete en camino",
    "changedAt": "2026-03-18T..."
  }
]
```

---

### 7. Returns

> Requiere token JWT con rol `client`.

#### `POST /returns`
Solicita una devolución. Solo válido si el envío tiene estado `entregado` y no han pasado 8 días.

**Body:**
```json
{
  "orderId": 1,
  "cause": "mal_estado",
  "additionalDescription": "El libro llegó con las páginas mojadas"
}
```

**Causas válidas:**

| Valor | Descripción |
|---|---|
| `mal_estado` | Producto en mal estado |
| `no_expectativas` | No llenó las expectativas |
| `demora_entrega` | Pedido llegó tarde |

**Respuesta exitosa (201):**
```json
{
  "message": "Solicitud de devolución creada exitosamente",
  "return": {
    "id": 1,
    "cause": "mal_estado",
    "status": "pendiente",
    "deadlineDate": "2026-03-26"
  },
  "qrCode": "data:image/png;base64,iVBORw0KGgo..."
}
```

> El `qrCode` viene como base64. El frontend puede mostrarlo directamente en un `<img src="...">`.

---

#### `GET /returns`
Lista todas las devoluciones del cliente autenticado.

---

#### `PUT /returns/:id/status`
Actualiza el estado de una devolución. Lo usa el administrador.

**Body:**
```json
{
  "status": "aprobada"
}
```

**Estados posibles:**

| Estado | Descripción |
|---|---|
| `pendiente` | Esperando revisión |
| `aprobada` | Devolución aprobada |
| `rechazada` | Devolución rechazada |
| `completada` | Proceso finalizado |

---

### 8. Payments

> Requiere token JWT.

#### `POST /payments/cards`
Registra una tarjeta de pago. El `gatewayToken` es el token que devuelve MercadoPago al tokenizar la tarjeta en el frontend.

**Body:**
```json
{
  "type": "credito",
  "gatewayToken": "tok_test_123456",
  "lastDigits": "4242",
  "brand": "Visa",
  "expiryDate": "2028-12-01"
}
```

> `type` acepta: `"credito"` o `"debito"`

---

#### `GET /payments/cards`
Lista las tarjetas activas del cliente autenticado.

---

#### `DELETE /payments/cards/:id`
Desactiva una tarjeta (no la elimina físicamente).

---

#### `GET /payments/balance`
Consulta el saldo disponible del cliente.

**Respuesta (200):**
```json
{
  "id": 1,
  "available": "0.00",
  "updatedAt": "2026-03-17T..."
}
```

---

#### `POST /payments/process`
Procesa un pago. Si el método es `saldo`, descuenta del balance del cliente.

**Body:**
```json
{
  "amount": 45000,
  "method": "tarjeta"
}
```

> `method` acepta: `"tarjeta"` o `"saldo"`

**Respuesta exitosa (201):**
```json
{
  "id": 1,
  "amount": "45000.00",
  "method": "tarjeta",
  "status": "aprobado",
  "gatewayReference": "REF-1710718356789"
}
```

---

## Modelos de datos

### User
```
id, username, email, password (hash), role, active, createdAt, updatedAt
```

### ClientProfile
```
id, userId (FK), dni, firstName, lastName, birthDate, birthPlace,
shippingAddress, gender, subscribedToNews, createdAt
```

### Book
```
id, title, author, publicationYear, genre, pages, publisher, issn,
language, publicationDate, condition (new/used), price, coverImage,
active, createdAt, updatedAt
```

### Exemplar
```
id, uniqueCode, bookId (FK), storeLocation, available, outOfStock, entryDate
```

### Reservation
```
id, clientId (FK), expiresAt, status (active/expired/cancelled/converted), createdAt
```

### ReservationItem
```
id, reservationId (FK), exemplarId (FK), quantity
```

### Order
```
id, clientId (FK), total, discount, status (confirmed/cancelled),
deliveryType (home_delivery/store_pickup), shippingAddress, createdAt
```

### OrderDetail
```
id, orderId (FK), exemplarId (FK), quantity, unitPrice, subtotal
```

### Shipping
```
id, orderId (FK), destinationAddress, type (domicilio/recogida_tienda),
status (en_preparacion/enviado/entregado), estimatedDelivery, deliveredAt, createdAt
```

### ShippingHistory
```
id, shippingId (FK), previousStatus, newStatus, observation, changedAt
```

### Return
```
id, orderId (FK), clientId (FK), cause, additionalDescription,
qrCode, deadlineDate, status (pendiente/aprobada/rechazada/completada), createdAt
```

### Payment
```
id, clientId (FK), amount, method (tarjeta/saldo),
status (pendiente/aprobado/rechazado/reembolsado), gatewayReference, createdAt
```

### Card
```
id, clientId (FK), type (credito/debito), gatewayToken,
lastDigits, brand, expiryDate, active, createdAt
```

### Balance
```
id, clientId (FK), available, updatedAt
```

---

## Códigos de respuesta

| Código | Significado |
|---|---|
| `200` | OK — consulta exitosa |
| `201` | Created — recurso creado exitosamente |
| `400` | Bad Request — datos inválidos o regla de negocio violada |
| `401` | Unauthorized — token inválido o expirado |
| `403` | Forbidden — sin permisos para esta acción |
| `404` | Not Found — recurso no encontrado |
| `409` | Conflict — recurso duplicado (ej: usuario ya existe) |
| `500` | Internal Server Error — error del servidor |

---

## Notas para el frontend

### 1. Manejo del token
- Guarda el `access_token` en `localStorage` o en memoria
- Adjúntalo en cada petición protegida: `Authorization: Bearer <token>`
- Si recibes `401`, redirige al usuario al login para obtener token nuevo
- El token dura **15 minutos**

### 2. Flujo de compra completo
```
1. Buscar libros          → GET /search
2. Ver detalle del libro  → GET /books/:id
3. Agregar al carrito     → (manejo en frontend por ahora)
4. Procesar pago          → POST /payments/process
5. Crear orden            → POST /orders
6. Crear envío            → POST /shipping
```

### 3. Flujo de reserva
```
1. Buscar libro disponible  → GET /search
2. Crear reserva            → POST /reservations (con exemplarIds)
3. Ver mis reservas         → GET /reservations
4. Cancelar si necesario    → DELETE /reservations/:id
```

### 4. Mostrar QR de devolución
El campo `qrCode` viene como base64. Úsalo directamente en HTML:
```html
<img src="data:image/png;base64,..." alt="Código QR devolución" />
```

### 5. IDs importantes
- En reservas y órdenes se usan **IDs de ejemplares** (`exemplarIds`), no IDs de libros
- Para saber qué ejemplares están disponibles de un libro: `GET /books/:id` → revisar `exemplars` donde `available: true`

### 6. CORS
El backend acepta peticiones desde cualquier origen en desarrollo. En producción se configurará para aceptar solo el dominio del frontend.

---

## Pendiente por implementar

- [ ] Módulo de Noticias
- [ ] Módulo de Mensajería (WebSockets)
- [ ] Módulo de Recomendaciones (bot)
- [ ] Guards de roles (restringir endpoints por rol)
- [ ] Validación de pipes global
- [ ] Swagger/OpenAPI en `/api/docs`

---

*Desarrollado en Pereira, Colombia — 2026*