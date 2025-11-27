# BBSY Homework #3 – API (Shopping List)

Krátký demo backend k domácímu úkolu č. 3.  
Aplikace simuluje uuApp API pro správu nákupních seznamů (shoppingList / item) nad Node.js + Express.

## Technologie

- Node.js + npm
- Express.js
- Jednoduchá autentizace přes HTTP headers (`x-user-id`, `x-user-profiles`)

## Jak projekt spustit

1. Naklonovat repozitář.
2. V kořeni projektu spustit:

   ```bash
   npm install
   npm start

Server běží na adrese:
http://localhost:3000

Autentizace:

-   Všechny endpointy očekávají tyto hlavičky:
    - Content-Type: application/json
    - x-user-id: 1
    - x-user-profiles: User

Bez nich vrací API chybu system/notAuthenticated.


Všechny uuCmd pouze validují dtoIn, kontrolují profily a vracejí statické dtoOut dle dokumentace v zadání (včetně uuAppErrorMap).
